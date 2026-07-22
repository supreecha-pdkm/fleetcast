import {
  BUS_CLASSES,
  CHANNEL_MARKUP,
  CHANNEL_WEIGHTS,
  CHANNELS,
  DATASET_SEED,
  DEPARTURE_SLOTS,
  HISTORY_DAYS,
  HISTORY_START,
  HOLIDAY_BY_DATE,
  ROUTES,
} from '@/data/constants'
import { dateRange, dayOfWeek, shiftIso } from '@/lib/date'
import { createRandom } from '@/lib/rng'
import { clamp } from '@/lib/utils'
import type { BusClass, DayOfWeek, TicketRecord } from '@/types/domain'

interface RouteProfile {
  /** Long-run mean load factor the route gravitates to. */
  readonly baseLoadFactor: number
  /** Baht per kilometre at X-Class, before class multiplier. */
  readonly farePerKm: number
  /** Multiplicative demand index per departure slot, keyed by slot time. */
  readonly slotIndex: Record<string, number>
  /** Rolling-bus class flown on each slot. */
  readonly slotClass: Record<string, BusClass>
  /** Fractional demand growth applied linearly across the history window. */
  readonly trend: number
  /** Day-to-day volatility as a fraction of the mean. */
  readonly volatility: number
}

/**
 * Per-route demand shape. Calibrated against the observed May-2026 report:
 * route 166 sustains LF 90–98%, the Mae Hong Son mountain route runs half
 * empty, and the Bangkok trunk routes are overnight-dominant.
 */
const ROUTE_PROFILES: Record<string, RouteProfile> = {
  'r-166': {
    baseLoadFactor: 0.925,
    farePerKm: 0.92,
    slotIndex: { '07:00': 1.04, '11:00': 0.96, '16:30': 1.06, '22:00': 0.94 },
    slotClass: { '07:00': 'V-Class', '11:00': 'X-Class', '16:30': 'V-Class', '22:00': 'X-Class' },
    trend: 0.06,
    volatility: 0.05,
  },
  'r-018': {
    baseLoadFactor: 0.83,
    farePerKm: 0.78,
    slotIndex: { '07:00': 0.82, '11:00': 0.74, '16:30': 1.02, '22:00': 1.34 },
    slotClass: {
      '07:00': 'X-Class',
      '11:00': 'X-Class',
      '16:30': 'V-Class',
      '22:00': 'Gold Class',
    },
    trend: 0.04,
    volatility: 0.08,
  },
  'r-170': {
    baseLoadFactor: 0.72,
    farePerKm: 0.84,
    slotIndex: { '07:00': 1.18, '11:00': 0.94, '16:30': 0.9, '22:00': 0.98 },
    slotClass: { '07:00': 'X-Class', '11:00': 'A-Class', '16:30': 'X-Class', '22:00': 'V-Class' },
    trend: 0.09,
    volatility: 0.09,
  },
  'r-148': {
    baseLoadFactor: 0.77,
    farePerKm: 0.88,
    slotIndex: { '07:00': 1.1, '11:00': 0.98, '16:30': 1.0, '22:00': 0.88 },
    slotClass: { '07:00': 'V-Class', '11:00': 'X-Class', '16:30': 'X-Class', '22:00': 'A-Class' },
    trend: 0.03,
    volatility: 0.07,
  },
  'r-961': {
    baseLoadFactor: 0.79,
    farePerKm: 0.74,
    slotIndex: { '07:00': 0.78, '11:00': 0.72, '16:30': 1.06, '22:00': 1.4 },
    slotClass: {
      '07:00': 'X-Class',
      '11:00': 'A-Class',
      '16:30': 'V-Class',
      '22:00': 'Gold Class',
    },
    trend: 0.05,
    volatility: 0.08,
  },
  'r-671': {
    baseLoadFactor: 0.64,
    farePerKm: 0.86,
    slotIndex: { '07:00': 1.12, '11:00': 0.92, '16:30': 1.02, '22:00': 0.9 },
    slotClass: { '07:00': 'X-Class', '11:00': 'A-Class', '16:30': 'X-Class', '22:00': 'A-Class' },
    trend: -0.02,
    volatility: 0.1,
  },
  'r-129': {
    baseLoadFactor: 0.58,
    farePerKm: 1.05,
    slotIndex: { '07:00': 1.26, '11:00': 0.86, '16:30': 1.14, '22:00': 0.7 },
    slotClass: { '07:00': 'A-Class', '11:00': 'A-Class', '16:30': 'A-Class', '22:00': 'A-Class' },
    trend: 0.01,
    volatility: 0.11,
  },
  'r-152': {
    baseLoadFactor: 0.47,
    farePerKm: 0.98,
    slotIndex: { '07:00': 1.24, '11:00': 0.9, '16:30': 0.96, '22:00': 0.66 },
    slotClass: { '07:00': 'V-Class', '11:00': 'A-Class', '16:30': 'A-Class', '22:00': 'A-Class' },
    trend: -0.05,
    volatility: 0.13,
  },
}

/** Weekly seasonality, shared network-wide. Friday and Sunday are the peaks. */
const DOW_INDEX: Record<DayOfWeek, number> = {
  Mon: 0.97,
  Tue: 0.89,
  Wed: 0.9,
  Thu: 1.0,
  Fri: 1.19,
  Sat: 1.09,
  Sun: 1.16,
}

/** Booking lead time differs sharply by channel — B2B agents book earliest. */
const CHANNEL_LEAD_TIME: Record<string, { mean: number; sd: number }> = {
  'Fair Fair B2B': { mean: 9, sd: 6 },
  'Fair Fair B2C': { mean: 5, sd: 4 },
  'Agent Credit': { mean: 7, sd: 5 },
  '12Go API': { mean: 14, sd: 9 },
  Counter: { mean: 0.6, sd: 1 },
}

function fareFor(distanceKm: number, farePerKm: number, busClass: BusClass): number {
  const { fareMultiplier } = BUS_CLASSES[busClass]
  return Math.round((distanceKm * farePerKm * fareMultiplier) / 5) * 5
}

/**
 * Builds the observed history: one row per route × departure slot × travel
 * date. Deterministic — the same seed always yields the same dataset.
 */
export function generateDataset(): TicketRecord[] {
  const rng = createRandom(DATASET_SEED)
  const dates = dateRange(HISTORY_START, HISTORY_DAYS)
  const records: TicketRecord[] = []

  for (const [dayIndex, travelDate] of dates.entries()) {
    const dow = dayOfWeek(travelDate)
    const holiday = HOLIDAY_BY_DATE.get(travelDate) ?? null
    const trendPosition = dayIndex / Math.max(dates.length - 1, 1)

    // A network-wide shock for the day — weather, fuel protests, a festival in
    // Chiang Mai. Unlike per-trip noise this does NOT cancel when the routes
    // are summed, which is what keeps daily forecast error realistic.
    const dayShock = clamp(1 + rng.normal(0, 0.075), 0.7, 1.35)

    for (const route of ROUTES) {
      const profile = ROUTE_PROFILES[route.id]
      if (!profile) continue

      for (const slot of DEPARTURE_SLOTS) {
        const busClass = profile.slotClass[slot] ?? 'X-Class'
        const seatCapacity = BUS_CLASSES[busClass].seats
        const slotIndex = profile.slotIndex[slot] ?? 1

        const expected =
          profile.baseLoadFactor *
          slotIndex *
          DOW_INDEX[dow] *
          (1 + profile.trend * trendPosition) *
          (holiday?.uplift ?? 1) *
          dayShock

        // Multiplicative noise keeps the variance proportional to the level,
        // which is how real ridership behaves.
        const noise = 1 + rng.normal(0, profile.volatility)
        const loadFactor = clamp(expected * noise, 0.12, 1)

        const ticketCount = Math.max(1, Math.round(loadFactor * seatCapacity))
        const realisedLoadFactor = ticketCount / seatCapacity

        const channel = rng.weighted(CHANNELS, CHANNEL_WEIGHTS)
        const lead = CHANNEL_LEAD_TIME[channel] ?? { mean: 6, sd: 4 }
        const advancePurchaseDays = clamp(Math.round(rng.normal(lead.mean, lead.sd)), 0, 90)

        const baseFare = fareFor(route.distanceKm, profile.farePerKm, busClass)
        // Promo and agent discounting: paid fare sits a little below list.
        const realisedFare = baseFare * rng.between(0.9, 1.0) + CHANNEL_MARKUP[channel]
        const revenue = Math.round(ticketCount * realisedFare)

        records.push({
          id: `${route.code}-${travelDate}-${slot.replace(':', '')}`,
          routeId: route.id,
          routeName: route.name,
          departureTime: slot,
          busClass,
          travelDate,
          bookingDate: shiftIso(travelDate, -advancePurchaseDays),
          advancePurchaseDays,
          ticketCount,
          seatCapacity,
          loadFactor: realisedLoadFactor,
          revenue,
          bookingChannel: channel,
          isHoliday: holiday !== null,
          holidayName: holiday?.name ?? null,
          dayOfWeek: dow,
        })
      }
    }
  }

  return records
}

/** Average paid fare per seat, used to convert predicted demand into revenue. */
export function averageFare(records: readonly TicketRecord[]): number {
  const tickets = records.reduce((acc, r) => acc + r.ticketCount, 0)
  const revenue = records.reduce((acc, r) => acc + r.revenue, 0)
  return tickets === 0 ? 0 : revenue / tickets
}
