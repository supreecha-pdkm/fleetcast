import { DEPARTURE_SLOTS, HOLIDAY_BY_DATE, LOAD_FACTOR_THRESHOLDS, ROUTES } from '@/data/constants'
import { averageFare } from '@/data/generateDataset'
import { dayOfWeek, formatShortDate, isWeekend } from '@/lib/date'
import { clamp, groupBy, mean, pctChange, sortBy, sum } from '@/lib/utils'
import {
  confidenceAtHorizon,
  seriesKey,
  type ForecastModel,
  type PredictionPoint,
} from '@/services/forecastEngine'
import type {
  CapacityBand,
  ChannelMix,
  ConfidenceBreakdown,
  ForecastPoint,
  HeatmapCell,
  KpiMetric,
  PredictionSummary,
  Route,
  RouteForecast,
  RouteStatus,
  TicketRecord,
} from '@/types/domain'

const { overCapacity, atRisk, underUtilised, target } = LOAD_FACTOR_THRESHOLDS

/** A route × slot × day prediction with the capacity it will be served on. */
export interface HorizonRow {
  readonly routeId: string
  readonly departureTime: string
  readonly seatCapacity: number
  readonly point: PredictionPoint
}

/**
 * Flattens the model's per-series predictions into rows, trimmed to the
 * selected horizon. Every downstream aggregate reads from this.
 */
export function buildHorizonRows(model: ForecastModel, horizonDays: number): HorizonRow[] {
  const rows: HorizonRow[] = []
  for (const fit of model.fits) {
    const points = model.predictions.get(seriesKey(fit.routeId, fit.departureTime)) ?? []
    for (const point of points.slice(0, horizonDays)) {
      rows.push({
        routeId: fit.routeId,
        departureTime: fit.departureTime,
        seatCapacity: fit.seatCapacity,
        point,
      })
    }
  }
  return rows
}

function loadFactorOf(passengers: number, capacity: number): number {
  return capacity === 0 ? 0 : clamp(passengers / capacity, 0, 1.35)
}

/**
 * Route health. Both ends of the scale are problems: a route pinned at
 * capacity is turning demand away, one running near-empty is burning fuel.
 */
export function statusFor(loadFactor: number): RouteStatus {
  if (loadFactor >= overCapacity || loadFactor < 0.4) return 'critical'
  if (loadFactor >= atRisk || loadFactor < underUtilised) return 'warning'
  return 'healthy'
}

/** Which side of the target the route sits on — drives the status copy. */
export function statusReason(loadFactor: number): 'over' | 'under' | 'healthy' {
  if (loadFactor >= atRisk) return 'over'
  if (loadFactor < underUtilised) return 'under'
  return 'healthy'
}

/* ------------------------------------------------------------------ series */

/**
 * The 30-day actual + 30-day forecast line. History carries an `actual`
 * value; the horizon carries `forecast` plus its interval. The last observed
 * day also carries a forecast value so the two lines meet without a gap.
 */
export function buildForecastSeries(
  records: readonly TicketRecord[],
  model: ForecastModel,
  rows: readonly HorizonRow[],
  historyDays: number,
): ForecastPoint[] {
  const byDate = groupBy(records, (r) => r.travelDate)
  const historyDates = [...byDate.keys()].sort().slice(-historyDays)

  // The model is trained network-wide, but this chart may be scoped to a
  // region. Sum only the series whose route is actually in scope, otherwise
  // the fitted line sits far above the actual line it is meant to track.
  const routesInScope = new Set(records.map((record) => record.routeId))

  const fittedByDate = new Map<string, number>()
  for (const fit of model.fits) {
    if (!routesInScope.has(fit.routeId)) continue
    for (const [i, point] of fit.history.entries()) {
      const seasonal = model.dowIndex[dayOfWeek(point.date)]
      const level = fit.intercept + fit.slope * i
      fittedByDate.set(point.date, (fittedByDate.get(point.date) ?? 0) + level * seasonal)
    }
  }

  const historyPoints: ForecastPoint[] = historyDates.map((date) => {
    const dayRows = byDate.get(date) ?? []
    const actual = sum(dayRows.map((r) => r.ticketCount))
    const capacity = sum(dayRows.map((r) => r.seatCapacity))
    const fitted = fittedByDate.get(date) ?? actual
    const holiday = dayRows.find((r) => r.isHoliday)

    return {
      date,
      actual,
      forecast: fitted,
      lower: fitted,
      upper: fitted,
      loadFactor: loadFactorOf(actual, capacity),
      forecastLoadFactor: loadFactorOf(fitted, capacity),
      isHoliday: holiday !== undefined,
      holidayName: holiday?.holidayName ?? null,
      isFuture: false,
    }
  })

  const byHorizonDate = groupBy(rows, (r) => r.point.date)
  const futurePoints: ForecastPoint[] = [...byHorizonDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayRows]) => {
      const forecast = sum(dayRows.map((r) => r.point.mean))
      const capacity = sum(dayRows.map((r) => r.seatCapacity))
      const holiday = HOLIDAY_BY_DATE.get(date)

      return {
        date,
        actual: null,
        forecast,
        lower: sum(dayRows.map((r) => r.point.lower)),
        upper: sum(dayRows.map((r) => r.point.upper)),
        loadFactor: null,
        forecastLoadFactor: loadFactorOf(forecast, capacity),
        isHoliday: holiday !== undefined,
        holidayName: holiday?.name ?? null,
        isFuture: true,
      }
    })

  // Bridge the seam: the forecast line starts at the last observed actual so
  // the two series connect instead of leaving a one-day gap.
  const lastHistory = historyPoints.at(-1)
  if (lastHistory && lastHistory.actual !== null) {
    historyPoints[historyPoints.length - 1] = {
      ...lastHistory,
      forecast: lastHistory.actual,
      lower: lastHistory.actual,
      upper: lastHistory.actual,
    }
  }

  return [...historyPoints, ...futurePoints]
}

/* ----------------------------------------------------------------- heatmap */

/** Mean predicted load factor per route × departure slot over the horizon. */
export function buildHeatmap(
  rows: readonly HorizonRow[],
  records: readonly TicketRecord[],
): HeatmapCell[] {
  const historicalLf = new Map<string, number>()
  for (const [key, group] of groupBy(records, (r) => seriesKey(r.routeId, r.departureTime))) {
    historicalLf.set(key, mean(group.map((r) => r.loadFactor)))
  }

  const cells: HeatmapCell[] = []
  for (const [key, group] of groupBy(rows, (r) => seriesKey(r.routeId, r.departureTime))) {
    const first = group[0]
    if (!first) continue

    const predictedPassengers = mean(group.map((r) => r.point.mean))
    const loadFactor = loadFactorOf(predictedPassengers, first.seatCapacity)

    cells.push({
      routeId: first.routeId,
      departureTime: first.departureTime,
      loadFactor,
      predictedPassengers,
      seatCapacity: first.seatCapacity,
      delta: loadFactor - (historicalLf.get(key) ?? loadFactor),
    })
  }

  return cells
}

/* ---------------------------------------------------------- route forecast */

export function buildRouteForecasts(
  rows: readonly HorizonRow[],
  records: readonly TicketRecord[],
  model: ForecastModel,
  routes: readonly Route[],
  horizonDays: number,
): RouteForecast[] {
  const rowsByRoute = groupBy(rows, (r) => r.routeId)
  const recordsByRoute = groupBy(records, (r) => r.routeId)
  const fare = averageFare(records)

  const forecasts = routes.flatMap<RouteForecast>((route) => {
    const routeRows = rowsByRoute.get(route.id) ?? []
    if (routeRows.length === 0) return []

    const routeRecords = recordsByRoute.get(route.id) ?? []
    const recentRecords = routeRecords.filter((r) =>
      isWithinLastDays(r.travelDate, routeRecords, horizonDays),
    )

    const predictedPassengers = sum(routeRows.map((r) => r.point.mean))
    const capacity = sum(routeRows.map((r) => r.seatCapacity))
    const currentPassengers = sum(recentRecords.map((r) => r.ticketCount))
    const currentCapacity = sum(recentRecords.map((r) => r.seatCapacity))

    const predictedLoadFactor = loadFactorOf(predictedPassengers, capacity)

    const byDate = groupBy(routeRows, (r) => r.point.date)
    const daily = [...byDate.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, group]) => ({ date, value: sum(group.map((r) => r.point.mean)) }))

    const peak = daily.reduce((best, day) => (day.value > best.value ? day : best), {
      date: daily[0]?.date ?? '',
      value: 0,
    })

    const meanHorizon = mean(routeRows.map((r) => r.point.horizon))

    return [
      {
        route,
        predictedPassengers,
        currentPassengers,
        growth: pctChange(predictedPassengers, currentPassengers),
        predictedLoadFactor,
        currentLoadFactor: loadFactorOf(currentPassengers, currentCapacity),
        predictedRevenue: predictedPassengers * fare,
        seatCapacity: capacity,
        departuresPerDay: DEPARTURE_SLOTS.length,
        status: statusFor(predictedLoadFactor),
        confidence: confidenceAtHorizon(model.backtest, meanHorizon),
        peakDate: peak.date,
        sparkline: daily.map((d) => d.value),
      },
    ]
  })

  return sortBy(forecasts, (f) => f.predictedPassengers, -1)
}

/** True when `date` sits in the last `days` travel dates present in `records`. */
function isWithinLastDays(date: string, records: readonly TicketRecord[], days: number): boolean {
  const dates = [...new Set(records.map((r) => r.travelDate))].sort()
  return dates.slice(-days).includes(date)
}

/* --------------------------------------------------------------- KPI block */

/**
 * Share of a route's departures that must breach a threshold to flag the
 * route. Holiday peaks push almost every route over the line on a handful of
 * days, so the bar is set at a fifth of the horizon — a structural problem,
 * not a seasonal one.
 */
const OVER_CAPACITY_SHARE = 0.2
const AT_RISK_SHARE = 0.25

/**
 * Classifies routes from departure-level load factors. A route is judged on
 * how *often* it breaches, not on a single outlying departure — one sold-out
 * Friday does not make a route structurally over capacity.
 */
function classifyRoutes(departures: readonly { routeId: string; loadFactor: number }[]): {
  overCapacity: Set<string>
  atRisk: Set<string>
} {
  const over = new Set<string>()
  const risk = new Set<string>()

  for (const [routeId, group] of groupBy(departures, (d) => d.routeId)) {
    const overShare = group.filter((d) => d.loadFactor >= overCapacity).length / group.length
    const riskShare = group.filter((d) => d.loadFactor >= atRisk).length / group.length

    if (overShare >= OVER_CAPACITY_SHARE) over.add(routeId)
    else if (riskShare >= AT_RISK_SHARE) risk.add(routeId)
  }

  return { overCapacity: over, atRisk: risk }
}

interface KpiInput {
  readonly records: readonly TicketRecord[]
  readonly rows: readonly HorizonRow[]
  readonly model: ForecastModel
  readonly routeForecasts: readonly RouteForecast[]
  readonly series: readonly ForecastPoint[]
  readonly horizonDays: number
}

export function buildKpis({
  records,
  rows,
  model,
  routeForecasts,
  series,
  horizonDays,
}: KpiInput): KpiMetric[] {
  const futureSeries = series.filter((p) => p.isFuture)
  const recentDates = [...new Set(records.map((r) => r.travelDate))].sort().slice(-horizonDays)
  const recentSet = new Set(recentDates)
  const recentRecords = records.filter((r) => recentSet.has(r.travelDate))

  const predictedDemand = sum(rows.map((r) => r.point.mean))
  const priorDemand = sum(recentRecords.map((r) => r.ticketCount))

  const predictedLoadFactor = loadFactorOf(predictedDemand, sum(rows.map((r) => r.seatCapacity)))
  const priorLoadFactor = loadFactorOf(priorDemand, sum(recentRecords.map((r) => r.seatCapacity)))

  const predicted = classifyRoutes(
    rows.map((r) => ({
      routeId: r.routeId,
      loadFactor: loadFactorOf(r.point.mean, r.seatCapacity),
    })),
  )
  const prior = classifyRoutes(
    recentRecords.map((r) => ({ routeId: r.routeId, loadFactor: r.loadFactor })),
  )

  const midHorizon = Math.ceil(horizonDays / 2)
  const confidence = confidenceAtHorizon(model.backtest, midHorizon)
  const priorConfidence = confidenceAtHorizon(model.previousBacktest, midHorizon)

  const dailyRisk = dailyCount(rows, (lf) => lf >= atRisk && lf < overCapacity)
  const dailyOver = dailyCount(rows, (lf) => lf >= overCapacity)

  return [
    metric({
      id: 'predicted-demand',
      label: 'ความต้องการที่พยากรณ์',
      value: predictedDemand,
      previousValue: priorDemand,
      format: 'number',
      intentOnRise: 'positive',
      caption: `จำนวนผู้โดยสารที่พยากรณ์ใน ${horizonDays} วัน · ${routeForecasts.length} เส้นทาง`,
      sparkline: futureSeries.map((p) => p.forecast),
      deltaLabel: `เทียบ ${horizonDays} วันย้อนหลัง`,
    }),
    metric({
      id: 'avg-load-factor',
      label: 'อัตราบรรทุกเฉลี่ย',
      value: predictedLoadFactor,
      previousValue: priorLoadFactor,
      format: 'percent',
      intentOnRise: 'positive',
      caption: `เป้าหมายเชิงพาณิชย์ ${Math.round(target * 100)}% · ที่นั่งที่ขายได้ ÷ ที่นั่งที่เปิดขาย`,
      sparkline: futureSeries.map((p) => p.forecastLoadFactor),
      deltaLabel: 'เทียบช่วงก่อนหน้า',
    }),
    metric({
      id: 'routes-at-risk',
      label: 'เส้นทางที่เสี่ยงเต็ม',
      value: predicted.atRisk.size,
      previousValue: prior.atRisk.size,
      format: 'count',
      intentOnRise: 'negative',
      caption: `เที่ยวรถตั้งแต่ ${Math.round(AT_RISK_SHARE * 100)}% ขึ้นไป พยากรณ์ว่าบรรทุก ≥ ${Math.round(atRisk * 100)}% — มีแนวโน้มเต็ม`,
      sparkline: dailyRisk,
      deltaLabel: 'เทียบช่วงก่อนหน้า',
    }),
    metric({
      id: 'routes-over-capacity',
      label: 'เส้นทางที่เกินความจุ',
      value: predicted.overCapacity.size,
      previousValue: prior.overCapacity.size,
      format: 'count',
      intentOnRise: 'negative',
      caption: `เที่ยวรถตั้งแต่ ${Math.round(OVER_CAPACITY_SHARE * 100)}% ขึ้นไป พยากรณ์ที่ ${Math.round(overCapacity * 100)}%+ — ต้องปฏิเสธผู้โดยสาร`,
      sparkline: dailyOver,
      deltaLabel: 'เทียบช่วงก่อนหน้า',
    }),
    metric({
      id: 'forecast-accuracy',
      label: 'ความแม่นยำของการพยากรณ์',
      value: model.backtest.accuracy,
      previousValue: model.previousBacktest.accuracy,
      format: 'percent',
      intentOnRise: 'positive',
      caption: `1 − MAPE บนชุดทดสอบ 7 วัน · ความเอนเอียง ${(model.backtest.bias * 100).toFixed(1)}%`,
      sparkline: model.backtest.points.map((p) =>
        p.actual === 0 ? 1 : clamp(1 - Math.abs(p.predicted - p.actual) / p.actual, 0, 1),
      ),
      deltaLabel: 'เทียบรอบก่อนหน้า',
    }),
    metric({
      id: 'ai-confidence',
      label: 'ความเชื่อมั่นของ AI',
      value: confidence,
      previousValue: priorConfidence,
      format: 'percent',
      intentOnRise: 'positive',
      caption: `ณ วันที่ ${midHorizon} ของช่วงพยากรณ์ · ครอบคลุมช่วงความเชื่อมั่น ${Math.round(model.backtest.coverage * 100)}%`,
      sparkline: Array.from({ length: horizonDays }, (_, i) =>
        confidenceAtHorizon(model.backtest, i + 1),
      ),
      deltaLabel: 'เทียบรอบก่อนหน้า',
    }),
  ]
}

function dailyCount(rows: readonly HorizonRow[], predicate: (lf: number) => boolean): number[] {
  const byDate = groupBy(rows, (r) => r.point.date)
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([, group]) =>
        group.filter((r) => predicate(loadFactorOf(r.point.mean, r.seatCapacity))).length,
    )
}

interface MetricInput {
  id: string
  label: string
  value: number
  previousValue: number
  format: KpiMetric['format']
  intentOnRise: 'positive' | 'negative'
  caption: string
  sparkline: readonly number[]
  deltaLabel: string
}

function metric(input: MetricInput): KpiMetric {
  const delta = pctChange(input.value, input.previousValue)
  const direction = Math.abs(delta) < 0.001 ? 'flat' : delta > 0 ? 'up' : 'down'
  const intent =
    direction === 'flat'
      ? 'neutral'
      : (direction === 'up') === (input.intentOnRise === 'positive')
        ? 'positive'
        : 'negative'

  return {
    id: input.id,
    label: input.label,
    value: input.value,
    previousValue: input.previousValue,
    format: input.format,
    delta,
    deltaLabel: input.deltaLabel,
    direction,
    intent,
    caption: input.caption,
    sparkline: input.sparkline,
  }
}

/* ------------------------------------------------------- mix and capacity */

export function buildChannelMix(records: readonly TicketRecord[]): ChannelMix[] {
  const totalTickets = sum(records.map((r) => r.ticketCount))
  const mix = [...groupBy(records, (r) => r.bookingChannel).entries()].map(([channel, rows]) => {
    const tickets = sum(rows.map((r) => r.ticketCount))
    return {
      channel,
      tickets,
      revenue: sum(rows.map((r) => r.revenue)),
      share: totalTickets === 0 ? 0 : tickets / totalTickets,
    }
  })

  return sortBy(mix, (m) => m.tickets, -1)
}

export function buildCapacityBands(rows: readonly HorizonRow[]): CapacityBand[] {
  const total = rows.length || 1
  const loadFactors = rows.map((r) => loadFactorOf(r.point.mean, r.seatCapacity))

  const bands: readonly {
    label: string
    description: string
    severity: CapacityBand['severity']
    test: (lf: number) => boolean
  }[] = [
    {
      label: 'เกินความจุ',
      description: `≥ ${Math.round(overCapacity * 100)}% — ต้องปฏิเสธผู้โดยสาร`,
      severity: 'critical',
      test: (lf) => lf >= overCapacity,
    },
    {
      label: 'เสี่ยงเต็ม',
      description: `${Math.round(atRisk * 100)}–${Math.round(overCapacity * 100)}% — มีแนวโน้มเต็ม`,
      severity: 'serious',
      test: (lf) => lf >= atRisk && lf < overCapacity,
    },
    {
      label: 'เหมาะสม',
      description: `${Math.round(underUtilised * 100)}–${Math.round(atRisk * 100)}% — มีส่วนต่างที่ดี`,
      severity: 'good',
      test: (lf) => lf >= underUtilised && lf < atRisk,
    },
    {
      label: 'ใช้ไม่เต็มศักยภาพ',
      description: `< ${Math.round(underUtilised * 100)}% — สูญเสียความจุโดยเปล่าประโยชน์`,
      severity: 'warning',
      test: (lf) => lf < underUtilised,
    },
  ]

  return bands.map((band) => {
    const departures = loadFactors.filter(band.test).length
    return {
      label: band.label,
      description: band.description,
      departures,
      share: departures / total,
      severity: band.severity,
    }
  })
}

export function buildConfidence(model: ForecastModel, horizonDays: number): ConfidenceBreakdown {
  const horizons = [7, 14, 21, 30].filter((h) => h <= Math.max(horizonDays, 7))
  const drift = Math.abs(model.backtest.mape - model.previousBacktest.mape)

  return {
    overall: confidenceAtHorizon(model.backtest, Math.ceil(horizonDays / 2)),
    accuracy: model.backtest.accuracy,
    mape: model.backtest.mape,
    coverage: model.backtest.coverage,
    drift,
    horizonDecay: horizons.map((horizon) => ({
      horizon: `${horizon} วัน`,
      confidence: confidenceAtHorizon(model.backtest, horizon),
    })),
  }
}

/* --------------------------------------------------------------- summary  */

export function buildSummary(
  rows: readonly HorizonRow[],
  series: readonly ForecastPoint[],
  routeForecasts: readonly RouteForecast[],
  records: readonly TicketRecord[],
  horizonDays: number,
): PredictionSummary {
  const future = series.filter((p) => p.isFuture)
  const fare = averageFare(records)

  const peak = future.reduce(
    (best, p) => (p.forecast > best.forecast ? p : best),
    future[0] ?? { date: '', forecast: 0 },
  )
  const trough = future.reduce(
    (worst, p) => (p.forecast < worst.forecast ? p : worst),
    future[0] ?? { date: '', forecast: 0 },
  )

  const holidayDays = future.filter((p) => p.isHoliday)
  const peakHoliday = holidayDays.find((p) => p.date === peak.date)?.holidayName
  // Baseline is an ordinary Monday–Thursday. Friday behaves like a weekend on
  // this network and would flatten the uplift figures if pooled in.
  const ordinaryDays = future.filter(
    (p) => !p.isHoliday && !isWeekend(p.date) && dayOfWeek(p.date) !== 'Fri',
  )
  const weekendDays = future.filter(
    (p) => !p.isHoliday && (isWeekend(p.date) || dayOfWeek(p.date) === 'Fri'),
  )

  const baseline = mean(ordinaryDays.map((p) => p.forecast))
  const holidayUplift =
    baseline === 0 ? 0 : pctChange(mean(holidayDays.map((p) => p.forecast)), baseline)
  const weekendUplift =
    baseline === 0 ? 0 : pctChange(mean(weekendDays.map((p) => p.forecast)), baseline)

  const totalPredicted = sum(rows.map((r) => r.point.mean))
  const overCapacityRoutes = classifyRoutes(
    rows.map((r) => ({
      routeId: r.routeId,
      loadFactor: loadFactorOf(r.point.mean, r.seatCapacity),
    })),
  ).overCapacity.size

  const topRoute = routeForecasts[0]

  const peakClause = peakHoliday
    ? ` โดยสูงสุดในวันที่ ${formatShortDate(peak.date)} ซึ่ง${peakHoliday}ดันปริมาณผู้โดยสารสูงกว่าวันธรรมดาทั่วไป ${(holidayUplift * 100).toFixed(0)}%`
    : holidayDays.length > 0
      ? ` โดยสูงสุดในวันที่ ${formatShortDate(peak.date)} ซึ่งอยู่ในช่วงวันหยุดยาว ${holidayDays.length} วัน ที่เพิ่มปริมาณผู้โดยสารอีก ${(holidayUplift * 100).toFixed(0)}%`
      : ` โดยสูงสุดในวันที่ ${formatShortDate(peak.date)}`

  const narrative = [
    `ความต้องการเดินทางทั้งเครือข่ายถูกพยากรณ์ไว้ที่ ${Math.round(totalPredicted).toLocaleString('th-TH')} ผู้โดยสาร ในอีก ${horizonDays} วันข้างหน้า`,
    peakClause,
    topRoute
      ? ` เส้นทาง ${topRoute.route.code} มีสัดส่วนมากที่สุดที่ ${Math.round(topRoute.predictedPassengers).toLocaleString('th-TH')} ผู้โดยสาร`
      : '',
    overCapacityRoutes > 0
      ? ` และมี ${overCapacityRoutes} เส้นทางที่จะมีเที่ยวรถเต็มหรือเกินความจุ หากไม่จัดสรรรถโดยสารใหม่`
      : ' และไม่มีเส้นทางใดที่คาดว่าจะเกินความจุภายใต้การจัดสรรรถในปัจจุบัน',
  ].join('')

  return {
    horizonDays,
    totalPredictedPassengers: totalPredicted,
    totalPredictedRevenue: totalPredicted * fare,
    averageLoadFactor: loadFactorOf(totalPredicted, sum(rows.map((r) => r.seatCapacity))),
    peakDate: peak.date,
    peakPassengers: peak.forecast,
    troughDate: trough.date,
    troughPassengers: trough.forecast,
    holidayUplift,
    weekendUplift,
    routesOverCapacity: overCapacityRoutes,
    narrative,
  }
}

export const ALL_ROUTES = ROUTES
