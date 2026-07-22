/**
 * Domain model for the demand-forecasting platform.
 *
 * Grain note: the source system (Green Bus GIS report 03 "รายได้รายเวลา")
 * emits one row per departure per travel date. `TicketRecord` mirrors that
 * grain — it is a trip-level sales fact, not a single passenger's ticket.
 */

export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'

export type BookingChannel =
  'Fair Fair B2B' | 'Fair Fair B2C' | 'Agent Credit' | '12Go API' | 'Counter'

export type BusClass = 'Gold Class' | 'V-Class' | 'X-Class' | 'A-Class'

export type Region = 'Northern Corridor' | 'Bangkok Trunk' | 'Border Corridor'

export type RouteStatus = 'healthy' | 'warning' | 'critical'

export type RecommendationAction =
  'increase_capacity' | 'reduce_capacity' | 'watch_closely' | 'promotion' | 'reprice'

export type Severity = 'critical' | 'serious' | 'warning' | 'good'

/** A single departure on a single travel date. */
export interface TicketRecord {
  readonly id: string
  readonly routeId: string
  readonly routeName: string
  readonly departureTime: string
  readonly busClass: BusClass
  readonly travelDate: string
  readonly bookingDate: string
  readonly advancePurchaseDays: number
  readonly ticketCount: number
  readonly seatCapacity: number
  readonly loadFactor: number
  readonly revenue: number
  readonly bookingChannel: BookingChannel
  readonly isHoliday: boolean
  readonly holidayName: string | null
  readonly dayOfWeek: DayOfWeek
}

export interface Route {
  readonly id: string
  readonly code: string
  readonly name: string
  readonly origin: string
  readonly destination: string
  readonly distanceKm: number
  readonly region: Region
}

/** One day on the forecast horizon, with the model's uncertainty band. */
export interface ForecastPoint {
  readonly date: string
  readonly actual: number | null
  readonly forecast: number
  readonly lower: number
  readonly upper: number
  readonly loadFactor: number | null
  readonly forecastLoadFactor: number
  readonly isHoliday: boolean
  readonly holidayName: string | null
  readonly isFuture: boolean
}

export interface HeatmapCell {
  readonly routeId: string
  readonly departureTime: string
  readonly loadFactor: number
  readonly predictedPassengers: number
  readonly seatCapacity: number
  readonly delta: number
}

export interface RouteForecast {
  readonly route: Route
  readonly predictedPassengers: number
  readonly currentPassengers: number
  readonly growth: number
  readonly predictedLoadFactor: number
  readonly currentLoadFactor: number
  readonly predictedRevenue: number
  readonly seatCapacity: number
  readonly departuresPerDay: number
  readonly status: RouteStatus
  readonly confidence: number
  readonly peakDate: string
  readonly sparkline: readonly number[]
}

export interface Recommendation {
  readonly id: string
  readonly action: RecommendationAction
  readonly routeId: string
  readonly routeName: string
  readonly departureTime: string | null
  readonly title: string
  readonly rationale: string
  readonly impact: string
  readonly revenueImpact: number
  readonly confidence: number
  readonly severity: Severity
  readonly effectiveFrom: string
}

export interface KpiMetric {
  readonly id: string
  readonly label: string
  readonly value: number
  readonly previousValue: number
  readonly format: 'number' | 'percent' | 'currency' | 'count'
  readonly delta: number
  readonly deltaLabel: string
  readonly direction: 'up' | 'down' | 'flat'
  readonly intent: 'positive' | 'negative' | 'neutral'
  readonly caption: string
  readonly sparkline: readonly number[]
}

export interface ChannelMix {
  readonly channel: BookingChannel
  readonly tickets: number
  readonly revenue: number
  readonly share: number
}

export interface CapacityBand {
  readonly label: string
  readonly description: string
  readonly departures: number
  readonly share: number
  readonly severity: Severity
}

export interface ConfidenceBreakdown {
  readonly overall: number
  readonly accuracy: number
  readonly mape: number
  readonly coverage: number
  readonly drift: number
  readonly horizonDecay: readonly { readonly horizon: string; readonly confidence: number }[]
}

export interface ForecastUpdate {
  readonly id: string
  readonly timestamp: string
  readonly title: string
  readonly detail: string
  readonly kind: 'retrain' | 'drift' | 'ingest' | 'alert' | 'publish'
  readonly routeCode: string | null
}

export interface PredictionSummary {
  readonly horizonDays: number
  readonly totalPredictedPassengers: number
  readonly totalPredictedRevenue: number
  readonly averageLoadFactor: number
  readonly peakDate: string
  readonly peakPassengers: number
  readonly troughDate: string
  readonly troughPassengers: number
  readonly holidayUplift: number
  readonly weekendUplift: number
  readonly routesOverCapacity: number
  readonly narrative: string
}

export interface ModelMeta {
  readonly name: string
  readonly version: string
  readonly algorithm: string
  readonly trainedAt: string
  readonly trainingRows: number
  readonly features: number
  readonly nextRunAt: string
}

/** Everything the dashboard renders, assembled by the analytics service. */
export interface DashboardSnapshot {
  readonly generatedAt: string
  readonly model: ModelMeta
  readonly kpis: readonly KpiMetric[]
  readonly forecastSeries: readonly ForecastPoint[]
  readonly heatmap: readonly HeatmapCell[]
  readonly departureTimes: readonly string[]
  readonly routes: readonly Route[]
  readonly routeForecasts: readonly RouteForecast[]
  readonly recommendations: readonly Recommendation[]
  readonly channelMix: readonly ChannelMix[]
  readonly capacityBands: readonly CapacityBand[]
  readonly confidence: ConfidenceBreakdown
  readonly updates: readonly ForecastUpdate[]
  readonly summary: PredictionSummary
  readonly recordCount: number
}
