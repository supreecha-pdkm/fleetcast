import { FORECAST_DAYS, HOLIDAY_BY_DATE, TODAY } from '@/data/constants'
import { dateRange, dayOfWeek } from '@/lib/date'
import { clamp, groupBy, mean } from '@/lib/utils'
import type { DayOfWeek, TicketRecord } from '@/types/domain'

/**
 * A small but genuine forecasting model. Every number the dashboard shows is
 * fitted from the generated history rather than written down:
 *
 *   1. pooled day-of-week seasonal indices (ratio-to-series-mean)
 *   2. per-series damped linear trend on the deseasonalised level (OLS)
 *   3. known-holiday multipliers from the calendar
 *   4. residual sigma → an 80% prediction interval that widens with horizon
 *   5. a hold-out backtest on the last 7 observed days → MAPE, accuracy, coverage
 */

/** 80% two-sided normal quantile. */
const Z_80 = 1.2816
/**
 * Trend damping per day out. The cumulative contribution converges to
 * `φ / (1 − φ)` ≈ 15.7 slope-days, so a one-year extrapolation flattens into
 * level + seasonality instead of running away on the fitted slope.
 */
const DAMPING = 0.94
const BACKTEST_DAYS = 7

export interface PredictionPoint {
  readonly date: string
  readonly mean: number
  readonly lower: number
  readonly upper: number
  readonly horizon: number
}

export interface SeriesFit {
  readonly routeId: string
  readonly departureTime: string
  readonly seatCapacity: number
  readonly intercept: number
  readonly slope: number
  readonly sigma: number
  readonly lastLevel: number
  readonly history: readonly { date: string; value: number }[]
}

export interface BacktestResult {
  /** Mean absolute percentage error on the hold-out window. */
  readonly mape: number
  /** 1 − MAPE, floored at 0. The headline "forecast accuracy". */
  readonly accuracy: number
  /** Share of hold-out actuals that fell inside the 80% interval. */
  readonly coverage: number
  /** Mean signed error as a fraction — positive means the model over-predicts. */
  readonly bias: number
  readonly points: readonly { date: string; actual: number; predicted: number }[]
}

export interface ForecastModel {
  readonly fits: readonly SeriesFit[]
  readonly dowIndex: Record<DayOfWeek, number>
  readonly horizonDates: readonly string[]
  readonly backtest: BacktestResult
  /** The same backtest shifted one window earlier — gives KPIs a real delta. */
  readonly previousBacktest: BacktestResult
  /** Predictions keyed by `${routeId}|${departureTime}`. */
  readonly predictions: ReadonlyMap<string, readonly PredictionPoint[]>
}

export function seriesKey(routeId: string, departureTime: string): string {
  return `${routeId}|${departureTime}`
}

/** Ordinary least squares over (index, value) pairs. */
function fitTrend(values: readonly number[]): { intercept: number; slope: number } {
  const n = values.length
  if (n < 2) return { intercept: values[0] ?? 0, slope: 0 }

  const meanX = (n - 1) / 2
  const meanY = mean(values)

  let numerator = 0
  let denominator = 0
  for (let i = 0; i < n; i += 1) {
    const dx = i - meanX
    numerator += dx * ((values[i] ?? 0) - meanY)
    denominator += dx * dx
  }

  const slope = denominator === 0 ? 0 : numerator / denominator
  return { intercept: meanY - slope * meanX, slope }
}

function holidayUplift(date: string): number {
  return HOLIDAY_BY_DATE.get(date)?.uplift ?? 1
}

/**
 * Pooled day-of-week indices. Pooling across every route keeps the estimate
 * stable and stops a single route's quiet Tuesday from bending the shared
 * weekly shape.
 */
function computeDowIndex(records: readonly TicketRecord[]): Record<DayOfWeek, number> {
  const byDate = groupBy(records, (r) => r.travelDate)
  const dailyTotals = [...byDate.entries()].map(([date, rows]) => ({
    date,
    // Divide out any known holiday effect so it does not leak into the
    // weekday index and get double-counted at prediction time.
    value: rows.reduce((acc, r) => acc + r.ticketCount, 0) / holidayUplift(date),
  }))

  const overall = mean(dailyTotals.map((d) => d.value))
  const buckets = groupBy(dailyTotals, (d) => dayOfWeek(d.date))

  const index = {} as Record<DayOfWeek, number>
  for (const day of ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const) {
    const bucket = buckets.get(day)
    index[day] =
      bucket && bucket.length > 0 && overall > 0 ? mean(bucket.map((d) => d.value)) / overall : 1
  }
  return index
}

function fitSeries(
  routeId: string,
  departureTime: string,
  seatCapacity: number,
  history: readonly { date: string; value: number }[],
  dowIndex: Record<DayOfWeek, number>,
): SeriesFit {
  const deseasonalised = history.map(
    (point) => point.value / (dowIndex[dayOfWeek(point.date)] * holidayUplift(point.date)),
  )

  const { intercept, slope } = fitTrend(deseasonalised)

  const residuals = deseasonalised.map((value, i) => value - (intercept + slope * i))
  const variance = mean(residuals.map((r) => r * r))
  const sigma = Math.sqrt(variance)

  return {
    routeId,
    departureTime,
    seatCapacity,
    intercept,
    slope,
    sigma,
    lastLevel: intercept + slope * (history.length - 1),
    history,
  }
}

/**
 * Damped cumulative trend contribution `slope · Σ φ^i` for i = 1..h, in closed
 * form — the geometric sum, not a loop, because a 365-day horizon would
 * otherwise cost O(h²) per fitted series.
 */
function dampedTrend(slope: number, horizon: number): number {
  const geometric = (DAMPING * (1 - Math.pow(DAMPING, horizon))) / (1 - DAMPING)
  return slope * geometric
}

function predictSeries(
  fit: SeriesFit,
  dates: readonly string[],
  dowIndex: Record<DayOfWeek, number>,
): PredictionPoint[] {
  const n = fit.history.length
  const baseIndex = n - 1

  return dates.map((date, offset) => {
    const horizon = offset + 1
    const level = fit.intercept + fit.slope * baseIndex + dampedTrend(fit.slope, horizon)
    const seasonal = dowIndex[dayOfWeek(date)] * holidayUplift(date)
    const point = Math.max(0, level * seasonal)

    // Interval widens with the square root of horizon — the standard random
    // walk assumption for accumulated uncertainty.
    const spread = Z_80 * fit.sigma * Math.sqrt(1 + horizon / 7) * seasonal

    return {
      date,
      horizon,
      mean: point,
      lower: Math.max(0, point - spread),
      upper: point + spread,
    }
  })
}

/**
 * Refits on everything before the hold-out window and scores it. This is what
 * makes "Forecast Accuracy" a measured figure rather than a claim.
 *
 * @param offset days to shift the hold-out window further into the past, so
 *   the previous evaluation cycle can be scored the same way.
 */
function runBacktest(
  records: readonly TicketRecord[],
  dowIndex: Record<DayOfWeek, number>,
  offset = 0,
): BacktestResult {
  const byDate = groupBy(records, (r) => r.travelDate)
  const dates = [...byDate.keys()].sort()
  const end = Math.max(BACKTEST_DAYS + 1, dates.length - offset)
  const splitAt = Math.max(1, end - BACKTEST_DAYS)
  const trainDates = new Set(dates.slice(0, splitAt))
  const holdOutDates = dates.slice(splitAt, end)

  const trainRecords = records.filter((r) => trainDates.has(r.travelDate))
  const trainFits = buildFits(trainRecords, dowIndex)

  // Aggregate every series to the daily network total — the same level the
  // forecast chart and the accuracy KPI are read at.
  const aggregate = new Map<string, { mean: number; lower: number; upper: number }>()
  for (const fit of trainFits) {
    for (const point of predictSeries(fit, holdOutDates, dowIndex)) {
      const current = aggregate.get(point.date) ?? { mean: 0, lower: 0, upper: 0 }
      aggregate.set(point.date, {
        mean: current.mean + point.mean,
        lower: current.lower + point.lower,
        upper: current.upper + point.upper,
      })
    }
  }

  const points = holdOutDates.map((date) => ({
    date,
    actual: (byDate.get(date) ?? []).reduce((acc, r) => acc + r.ticketCount, 0),
    predicted: aggregate.get(date)?.mean ?? 0,
  }))

  const errors = points.map((p) =>
    p.actual === 0 ? 0 : Math.abs(p.predicted - p.actual) / p.actual,
  )
  const signed = points.map((p) => (p.actual === 0 ? 0 : (p.predicted - p.actual) / p.actual))
  const inside = points.filter((p) => {
    const bounds = aggregate.get(p.date)
    return bounds ? p.actual >= bounds.lower && p.actual <= bounds.upper : false
  })

  const mape = mean(errors)

  return {
    mape,
    accuracy: clamp(1 - mape, 0, 1),
    coverage: points.length === 0 ? 0 : inside.length / points.length,
    bias: mean(signed),
    points,
  }
}

function buildFits(
  records: readonly TicketRecord[],
  dowIndex: Record<DayOfWeek, number>,
): SeriesFit[] {
  const bySeries = groupBy(records, (r) => seriesKey(r.routeId, r.departureTime))

  return [...bySeries.values()].map((rows) => {
    const sorted = [...rows].sort((a, b) => a.travelDate.localeCompare(b.travelDate))
    const first = sorted[0]!
    return fitSeries(
      first.routeId,
      first.departureTime,
      first.seatCapacity,
      sorted.map((r) => ({ date: r.travelDate, value: r.ticketCount })),
      dowIndex,
    )
  })
}

export function trainForecastModel(records: readonly TicketRecord[]): ForecastModel {
  const dowIndex = computeDowIndex(records)
  const fits = buildFits(records, dowIndex)
  const horizonDates = dateRange(TODAY, FORECAST_DAYS)

  const predictions = new Map<string, readonly PredictionPoint[]>()
  for (const fit of fits) {
    predictions.set(
      seriesKey(fit.routeId, fit.departureTime),
      predictSeries(fit, horizonDates, dowIndex),
    )
  }

  return {
    fits,
    dowIndex,
    horizonDates,
    predictions,
    backtest: runBacktest(records, dowIndex),
    previousBacktest: runBacktest(records, dowIndex, BACKTEST_DAYS),
  }
}

/**
 * Model confidence at a given horizon. Anchored on measured backtest accuracy
 * and decayed as the forecast reaches further out.
 */
export function confidenceAtHorizon(backtest: BacktestResult, horizon: number): number {
  const decay = Math.exp(-horizon / 145)
  return clamp(backtest.accuracy * decay, 0.4, 0.99)
}
