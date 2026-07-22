import { LOAD_FACTOR_THRESHOLDS, SLOT_LABELS } from '@/data/constants'
import { averageFare } from '@/data/generateDataset'
import { formatShortDate } from '@/lib/date'
import { clamp, groupBy, mean, sortBy, sum } from '@/lib/utils'
import { confidenceAtHorizon, seriesKey, type ForecastModel } from '@/services/forecastEngine'
import type { HorizonRow } from '@/services/analytics'
import type {
  Recommendation,
  RecommendationAction,
  Route,
  Severity,
  TicketRecord,
} from '@/types/domain'

const { overCapacity, atRisk, underUtilised } = LOAD_FACTOR_THRESHOLDS

/** Rough all-in operating cost per bus-kilometre, THB. */
const COST_PER_KM = 24

/** A departure slot only earns a recommendation if the signal persists. */
const MIN_AFFECTED_DAYS = 3

/**
 * Spill below roughly half a coach is rounding, not a capacity problem —
 * recommending an extra bus for it would undermine trust in the panel.
 */
const MIN_SPILL_RATIO = 0.5

interface SlotSignal {
  readonly routeId: string
  readonly departureTime: string
  readonly meanLoadFactor: number
  readonly peakLoadFactor: number
  /** Passengers the model expects beyond the seats offered, summed over days. */
  readonly spilledPassengers: number
  readonly predictedPassengers: number
  readonly daysOverCapacity: number
  readonly daysAtRisk: number
  readonly daysUnderUtilised: number
  /** Unsold seats across every departure in the horizon, not just weak days. */
  readonly emptySeats: number
  /** Unsold seats on the under-utilised days alone. */
  readonly emptySeatsOnWeakDays: number
  readonly seatsPerDeparture: number
  readonly departures: number
  readonly firstAffectedDate: string
  readonly meanHorizon: number
  readonly historicalLoadFactor: number
}

function summariseSlot(
  rows: readonly HorizonRow[],
  historicalLoadFactor: number,
): SlotSignal | null {
  const first = rows[0]
  if (!first) return null

  const sorted = [...rows].sort((a, b) => a.point.date.localeCompare(b.point.date))
  const loadFactors = sorted.map((r) => r.point.mean / r.seatCapacity)

  const overDays = sorted.filter((r) => r.point.mean / r.seatCapacity >= overCapacity)
  const riskDays = sorted.filter((r) => {
    const lf = r.point.mean / r.seatCapacity
    return lf >= atRisk && lf < overCapacity
  })
  const underDays = sorted.filter((r) => r.point.mean / r.seatCapacity < underUtilised)

  return {
    routeId: first.routeId,
    departureTime: first.departureTime,
    meanLoadFactor: mean(loadFactors),
    peakLoadFactor: Math.max(...loadFactors),
    spilledPassengers: sum(sorted.map((r) => Math.max(0, r.point.mean - r.seatCapacity))),
    predictedPassengers: sum(sorted.map((r) => r.point.mean)),
    daysOverCapacity: overDays.length,
    daysAtRisk: riskDays.length,
    daysUnderUtilised: underDays.length,
    emptySeats: sum(sorted.map((r) => Math.max(0, r.seatCapacity - r.point.mean))),
    emptySeatsOnWeakDays: sum(underDays.map((r) => Math.max(0, r.seatCapacity - r.point.mean))),
    seatsPerDeparture: first.seatCapacity,
    departures: sorted.length,
    firstAffectedDate:
      overDays[0]?.point.date ??
      riskDays[0]?.point.date ??
      underDays[0]?.point.date ??
      sorted[0]!.point.date,
    meanHorizon: mean(sorted.map((r) => r.point.horizon)),
    historicalLoadFactor,
  }
}

/**
 * Classifies one departure slot. Rules are ordered by severity — the first
 * match wins, so a slot that is selling out is never also told to discount.
 */
function classifySlot(
  signal: SlotSignal,
): { action: RecommendationAction; severity: Severity } | null {
  if (
    signal.daysOverCapacity >= MIN_AFFECTED_DAYS &&
    signal.spilledPassengers >= signal.seatsPerDeparture * MIN_SPILL_RATIO
  ) {
    return { action: 'increase_capacity', severity: 'critical' }
  }
  if (
    signal.daysUnderUtilised >= signal.departures * 0.6 &&
    signal.meanLoadFactor < underUtilised
  ) {
    return { action: 'reduce_capacity', severity: 'serious' }
  }
  if (
    signal.meanLoadFactor < underUtilised + 0.12 &&
    signal.meanLoadFactor >= underUtilised - 0.05
  ) {
    return { action: 'promotion', severity: 'warning' }
  }
  if (signal.daysAtRisk >= MIN_AFFECTED_DAYS) {
    return { action: 'watch_closely', severity: 'warning' }
  }
  if (signal.meanLoadFactor >= atRisk - 0.04 && signal.peakLoadFactor >= atRisk) {
    return { action: 'reprice', severity: 'good' }
  }
  return null
}

function slotLabel(departureTime: string): string {
  const label = SLOT_LABELS[departureTime]
  return label ? `${departureTime} (${label})` : departureTime
}

/** "รอบ 07:00 (เช้า) และ 16:30 (บ่าย)" / "ทุกรอบเดินรถ". */
function describeSlots(signals: readonly SlotSignal[], totalSlots: number): string {
  if (signals.length >= totalSlots && totalSlots > 1) return 'ทุกรอบเดินรถ'
  const labels = signals.map((s) => slotLabel(s.departureTime))
  if (labels.length === 1) return `รอบ ${labels[0]}`
  return `รอบ ${labels.slice(0, -1).join(', ')} และ ${labels.at(-1)}`
}

interface Draft {
  readonly route: Route
  readonly action: RecommendationAction
  readonly severity: Severity
  readonly signals: readonly SlotSignal[]
  readonly fare: number
  readonly slotsOnRoute: number
}

/** Turns an aggregated route × action group into presentable copy and value. */
function describe(draft: Draft): Omit<Recommendation, 'id' | 'confidence'> {
  const { route, signals, fare } = draft
  const scope = describeSlots(signals, draft.slotsOnRoute)
  const effectiveFrom = signals
    .map((s) => s.firstAffectedDate)
    .sort()
    .at(0)!
  const departureTime = signals.length === 1 ? (signals[0]?.departureTime ?? null) : null

  const spilled = sum(signals.map((s) => s.spilledPassengers))
  const emptySeats = sum(signals.map((s) => s.emptySeats))
  const emptySeatsOnWeakDays = sum(signals.map((s) => s.emptySeatsOnWeakDays))
  const overDays = sum(signals.map((s) => s.daysOverCapacity))
  const riskDays = sum(signals.map((s) => s.daysAtRisk))
  const totalDepartures = sum(signals.map((s) => s.departures))
  const peakLoadFactor = Math.max(...signals.map((s) => s.peakLoadFactor))
  const avgLoadFactor = mean(signals.map((s) => s.meanLoadFactor))
  const historical = mean(signals.map((s) => s.historicalLoadFactor))
  const pct = (value: number): string => `${Math.round(value * 100)}%`

  const shared = { routeId: route.id, routeName: route.name, departureTime, effectiveFrom }

  switch (draft.action) {
    case 'increase_capacity': {
      const buses = Math.max(1, Math.ceil(spilled / mean(signals.map((s) => s.seatsPerDeparture))))
      return {
        ...shared,
        action: 'increase_capacity',
        severity: 'critical',
        title: `เพิ่มความจุเส้นทาง ${route.code}`,
        rationale: `${overDays} จาก ${totalDepartures} เที่ยวรถที่พยากรณ์ใน${scope} มีอัตราบรรทุกเกิน ${pct(overCapacity)} สูงสุดที่ ${pct(peakLoadFactor)} มีผู้โดยสารประมาณ ${Math.round(spilled)} คนที่ไม่มีที่นั่งภายใต้การจัดสรรปัจจุบัน`,
        impact: `จัดรถโดยสารเพิ่มอีก ${buses} คัน ตั้งแต่วันที่ ${formatShortDate(effectiveFrom)}`,
        revenueImpact: spilled * fare,
      }
    }
    case 'reduce_capacity': {
      const savedDepartures = Math.round(sum(signals.map((s) => s.daysUnderUtilised)) * 0.5)
      return {
        ...shared,
        action: 'reduce_capacity',
        severity: 'serious',
        title: `ยุบรวมเที่ยวรถเส้นทาง ${route.code}`,
        rationale: `${scope}มีอัตราบรรทุกที่พยากรณ์เฉลี่ย ${pct(avgLoadFactor)} เหลือที่นั่งว่างราว ${Math.round(emptySeatsOnWeakDays)} ที่นั่งในวันที่ความต้องการต่ำ ปริมาณผู้โดยสารไม่รองรับความถี่ปัจจุบัน`,
        impact: `ยุบรวม ${savedDepartures} เที่ยวรถเข้ากับรอบใกล้เคียง และโยกรถไปเส้นทางชายแดน`,
        revenueImpact: savedDepartures * route.distanceKm * COST_PER_KM,
      }
    }
    case 'promotion': {
      const breakEven = Math.max(3, Math.round((emptySeats / Math.max(totalDepartures, 1)) * 0.15))
      return {
        ...shared,
        action: 'promotion',
        severity: 'warning',
        title: `จัดโปรโมชันค่าโดยสารเส้นทาง ${route.code}`,
        rationale: `อัตราบรรทุกที่พยากรณ์ ${pct(avgLoadFactor)} ใน${scope} อยู่${avgLoadFactor < historical ? 'ต่ำกว่า' : 'สูงกว่า'}ค่าเฉลี่ยย้อนหลัง ${Math.round(Math.abs(avgLoadFactor - historical) * 100)} จุด และมีที่นั่งว่างราว ${Math.round(emptySeats)} ที่นั่ง ต้นทุนส่วนเพิ่มต่อผู้โดยสารหนึ่งคนแทบเป็นศูนย์`,
        impact: `ลดราคา 12% ผ่านแอป B2C และ 12Go — คุ้มทุนที่ผู้โดยสารเพิ่มอีก ${breakEven} คนต่อเที่ยว`,
        revenueImpact: emptySeats * 0.18 * fare,
      }
    }
    case 'watch_closely':
      return {
        ...shared,
        action: 'watch_closely',
        severity: 'warning',
        title: `เฝ้าติดตามเส้นทาง ${route.code}`,
        rationale: `${riskDays} เที่ยวรถใน${scope} ถูกพยากรณ์ว่ามีอัตราบรรทุกระหว่าง ${pct(atRisk)} ถึง ${pct(overCapacity)} เส้นทางกำลังเข้าใกล้เพดานความจุแต่ยังไม่เกิน`,
        impact: 'คงการจัดสรรรถไว้เดิม และประเมินใหม่ในการรันโมเดลรอบถัดไป',
        revenueImpact: 0,
      }
    case 'reprice':
      return {
        ...shared,
        action: 'reprice',
        severity: 'good',
        title: `เพิ่มรายได้ต่อที่นั่งเส้นทาง ${route.code}`,
        rationale: `อัตราบรรทุกที่พยากรณ์คงที่ ${pct(avgLoadFactor)} ใน${scope} สูงสุดที่ ${pct(peakLoadFactor)} รอบเดินรถนี้รับราคาได้โดยความต้องการไม่ลดลงอย่างมีนัยสำคัญ`,
        impact: 'ปรับค่าโดยสารขึ้น 6–8% สำหรับที่นั่ง 20% สุดท้าย ผ่านระบบราคาแบบพลวัต',
        revenueImpact: sum(signals.map((s) => s.predictedPassengers)) * fare * 0.07,
      }
  }
}

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, serious: 1, warning: 2, good: 3 }

/**
 * Rule engine over the horizon predictions. Signals are read per departure
 * slot, then merged to route level so the panel shows one actionable card per
 * route rather than four near-identical ones.
 */
export function buildRecommendations(
  rows: readonly HorizonRow[],
  routes: readonly Route[],
  records: readonly TicketRecord[],
  model: ForecastModel,
): Recommendation[] {
  const fare = averageFare(records)
  const routeById = new Map(routes.map((route) => [route.id, route]))

  const historicalLf = new Map<string, number>()
  for (const [key, group] of groupBy(records, (r) => seriesKey(r.routeId, r.departureTime))) {
    historicalLf.set(key, mean(group.map((r) => r.loadFactor)))
  }

  const slotsPerRoute = new Map<string, number>()
  for (const [routeId, group] of groupBy(rows, (r) => r.routeId)) {
    slotsPerRoute.set(routeId, new Set(group.map((r) => r.departureTime)).size)
  }

  // 1. Score every departure slot.
  const classified: { signal: SlotSignal; action: RecommendationAction; severity: Severity }[] = []
  for (const group of groupBy(rows, (r) => seriesKey(r.routeId, r.departureTime)).values()) {
    const first = group[0]
    if (!first) continue
    const key = seriesKey(first.routeId, first.departureTime)
    const signal = summariseSlot(group, historicalLf.get(key) ?? 0)
    if (!signal) continue

    const verdict = classifySlot(signal)
    if (verdict) classified.push({ signal, ...verdict })
  }

  // 2. Merge slots that share a route and a recommended action.
  const merged = groupBy(classified, (c) => `${c.signal.routeId}|${c.action}`)

  const recommendations = [...merged.values()].flatMap<Recommendation>((group) => {
    const first = group[0]
    if (!first) return []
    const route = routeById.get(first.signal.routeId)
    if (!route) return []

    const signals = sortBy(
      group.map((g) => g.signal),
      (s) => Number(s.departureTime.replace(':', '')),
    )

    const described = describe({
      route,
      action: first.action,
      severity: first.severity,
      signals,
      fare,
      slotsOnRoute: slotsPerRoute.get(route.id) ?? signals.length,
    })

    return [
      {
        ...described,
        id: `rec-${first.action}-${route.id}`,
        confidence: confidenceAtHorizon(model.backtest, mean(signals.map((s) => s.meanHorizon))),
      },
    ]
  })

  // 3. Severity first — an ops planner reads the panel top-down and must not
  //    have a cost saving outrank a capacity breach. Value breaks ties.
  return [...recommendations].sort(
    (a, b) =>
      SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
      b.revenueImpact * b.confidence - a.revenueImpact * a.confidence,
  )
}

/** Confidence-weighted total value of everything the panel is recommending. */
export function recommendationValue(recommendations: readonly Recommendation[]): number {
  return sum(recommendations.map((r) => r.revenueImpact * clamp(r.confidence, 0, 1)))
}
