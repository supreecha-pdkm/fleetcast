import type { BookingChannel, BusClass, Route } from '@/types/domain'

/**
 * Simulation anchor. Everything downstream is derived from this date, so the
 * demo is stable and the "today" divider always lands in the same place.
 */
export const TODAY = '2026-07-22'

/**
 * Fixed "now" for the demo. Every timestamp, relative label and clock in the
 * UI resolves against this, so the dashboard reads identically on any machine
 * at any real-world time.
 */
export const SIMULATED_NOW = new Date('2026-07-22T02:12:00.000Z') // 09:12 ICT

export const HISTORY_DAYS = 30
export const FORECAST_DAYS = 30
export const DATASET_SEED = 20_260_722

/** First day of observed history (inclusive). */
export const HISTORY_START = '2026-06-22'

/**
 * Departure slots. Every route runs all four, which is what makes the
 * Route × Time heatmap dense enough to read.
 */
export const DEPARTURE_SLOTS = ['07:00', '11:00', '16:30', '22:00'] as const

export const SLOT_LABELS: Record<string, string> = {
  '07:00': 'เช้า',
  '11:00': 'สาย',
  '16:30': 'บ่าย',
  '22:00': 'กลางคืน',
}

/**
 * Green Bus / Chaiyaphat network — northern Thailand trunk and border
 * corridors. Route 166 is the network's strongest performer (LF consistently
 * 90–98%), 152 the weakest; both are reproduced here.
 */
export const ROUTES: readonly Route[] = [
  {
    id: 'r-166',
    code: 'GB-166',
    name: 'เชียงใหม่ – เชียงราย',
    origin: 'เชียงใหม่',
    destination: 'เชียงราย',
    distanceKm: 190,
    region: 'Northern Corridor',
  },
  {
    id: 'r-018',
    code: 'GB-018',
    name: 'เชียงใหม่ – กรุงเทพฯ',
    origin: 'เชียงใหม่',
    destination: 'กรุงเทพฯ',
    distanceKm: 685,
    region: 'Bangkok Trunk',
  },
  {
    id: 'r-170',
    code: 'GB-170',
    name: 'เชียงใหม่ – แม่สอด',
    origin: 'เชียงใหม่',
    destination: 'แม่สอด',
    distanceKm: 380,
    region: 'Border Corridor',
  },
  {
    id: 'r-148',
    code: 'GB-148',
    name: 'เชียงใหม่ – แม่สาย',
    origin: 'เชียงใหม่',
    destination: 'แม่สาย',
    distanceKm: 265,
    region: 'Border Corridor',
  },
  {
    id: 'r-961',
    code: 'GB-961',
    name: 'เชียงราย – กรุงเทพฯ',
    origin: 'เชียงราย',
    destination: 'กรุงเทพฯ',
    distanceKm: 830,
    region: 'Bangkok Trunk',
  },
  {
    id: 'r-671',
    code: 'GB-671',
    name: 'เชียงใหม่ – น่าน',
    origin: 'เชียงใหม่',
    destination: 'น่าน',
    distanceKm: 320,
    region: 'Northern Corridor',
  },
  {
    id: 'r-129',
    code: 'GB-129',
    name: 'เชียงใหม่ – ลำปาง',
    origin: 'เชียงใหม่',
    destination: 'ลำปาง',
    distanceKm: 100,
    region: 'Northern Corridor',
  },
  {
    id: 'r-152',
    code: 'GB-152',
    name: 'เชียงใหม่ – แม่ฮ่องสอน',
    origin: 'เชียงใหม่',
    destination: 'แม่ฮ่องสอน',
    distanceKm: 245,
    region: 'Northern Corridor',
  },
]

/**
 * Display names for the internal region keys. The keys stay in English
 * because they are also the `Region` union used for filtering; only the
 * label a planner reads is translated.
 */
export const REGION_LABELS: Record<string, string> = {
  all: 'ทุกภูมิภาค',
  'Northern Corridor': 'เส้นทางภาคเหนือ',
  'Bangkok Trunk': 'เส้นทางสายกรุงเทพฯ',
  'Border Corridor': 'เส้นทางชายแดน',
}

/** Display names for the booking channels. Partner brands keep their name. */
export const CHANNEL_LABELS: Record<string, string> = {
  'Fair Fair B2B': 'Fair Fair B2B (ตัวแทน)',
  'Fair Fair B2C': 'Fair Fair B2C (ลูกค้าตรง)',
  'Agent Credit': 'เครดิตตัวแทนจำหน่าย',
  '12Go API': '12Go API',
  Counter: 'เคาน์เตอร์จำหน่ายตั๋ว',
}

export const BUS_CLASSES: Record<BusClass, { seats: number; fareMultiplier: number }> = {
  'Gold Class': { seats: 21, fareMultiplier: 1.75 },
  'V-Class': { seats: 32, fareMultiplier: 1.3 },
  'X-Class': { seats: 40, fareMultiplier: 1.0 },
  'A-Class': { seats: 46, fareMultiplier: 0.82 },
}

/**
 * Channel mix reproduces the observed May-2026 distribution from the source
 * data dump: Fair Fair B2B 48%, B2C 19%, agent credit 16%, 12Go API 6%.
 */
export const CHANNELS: readonly BookingChannel[] = [
  'Fair Fair B2B',
  'Fair Fair B2C',
  'Agent Credit',
  '12Go API',
  'Counter',
]

export const CHANNEL_WEIGHTS: readonly number[] = [48, 19, 16, 6, 11]

/**
 * Channel markup per ticket, in THB — agent APIs carry a markup, direct B2C
 * does not. Drives the revenue figures.
 */
export const CHANNEL_MARKUP: Record<BookingChannel, number> = {
  'Fair Fair B2B': 0,
  'Fair Fair B2C': 0,
  'Agent Credit': 20,
  '12Go API': 77,
  Counter: 0,
}

export interface Holiday {
  readonly date: string
  readonly name: string
  /** Demand multiplier applied to the day and its shoulder days. */
  readonly uplift: number
}

/** Thai public holidays and observances intersecting the modelled window. */
export const HOLIDAYS: readonly Holiday[] = [
  { date: '2026-07-27', name: 'วันหยุดชดเชยวันเฉลิมพระชนมพรรษา', uplift: 1.24 },
  { date: '2026-07-28', name: 'วันเฉลิมพระชนมพรรษา ร.๑๐', uplift: 1.38 },
  { date: '2026-07-29', name: 'วันอาสาฬหบูชา', uplift: 1.34 },
  { date: '2026-07-30', name: 'วันเข้าพรรษา', uplift: 1.29 },
  {
    date: '2026-08-12',
    name: 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวง · วันแม่แห่งชาติ',
    uplift: 1.31,
  },
]

export const HOLIDAY_BY_DATE: ReadonlyMap<string, Holiday> = new Map(
  HOLIDAYS.map((holiday) => [holiday.date, holiday]),
)

/** Capacity policy thresholds — the basis of every status and recommendation. */
export const LOAD_FACTOR_THRESHOLDS = {
  /** At or above this, the departure is treated as sold out / turning away demand. */
  overCapacity: 0.95,
  /** At or above this, the route is at risk of running full. */
  atRisk: 0.88,
  /** Below this, capacity is being wasted. */
  underUtilised: 0.55,
  /** Operator's commercial target. */
  target: 0.78,
} as const

/**
 * Descriptive labels for the forecasting method. These must keep describing
 * what `services/forecastEngine.ts` actually computes — no AI, no machine
 * learning, no external model call. If the engine changes, change these too.
 */
export const MODEL = {
  name: 'ระบบพยากรณ์ความต้องการเดินทาง Fleetcast',
  version: 'v0.1.0-prototype',
  algorithm: 'ดัชนีฤดูกาลรายวันในสัปดาห์ + แนวโน้มถดถอยเชิงเส้นแบบหน่วง (OLS)',
} as const
