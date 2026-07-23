import {
  DEPARTURE_SLOTS,
  HISTORY_DAYS,
  MAX_CHART_HISTORY_DAYS,
  MODEL,
  ROUTES,
  SIMULATED_NOW,
  TODAY,
  type HorizonOption,
} from '@/data/constants'
import { generateDataset } from '@/data/generateDataset'
import { shiftIso } from '@/lib/date'
import { sleep } from '@/lib/utils'
import {
  buildCapacityBands,
  buildChannelMix,
  buildConfidence,
  buildForecastSeries,
  buildHeatmap,
  buildHorizonRows,
  buildKpis,
  buildRouteForecasts,
  buildSummary,
} from '@/services/analytics'
import { trainForecastModel, type ForecastModel } from '@/services/forecastEngine'
import { buildRecommendations } from '@/services/recommendations'
import type { DashboardSnapshot, TicketRecord } from '@/types/domain'

export const REGIONS = ['all', 'Northern Corridor', 'Bangkok Trunk', 'Border Corridor'] as const
export type RegionFilter = (typeof REGIONS)[number]

export interface DashboardFilters {
  readonly horizonDays: HorizonOption
  readonly region: RegionFilter
}

export const DEFAULT_FILTERS: DashboardFilters = { horizonDays: 30, region: 'all' }

/**
 * Fake repository layer. Stands in for the BigQuery-backed API the real
 * platform would call: the dataset and the trained model are computed once and
 * cached, then every query is served from them behind a simulated latency.
 */
interface Warehouse {
  readonly records: readonly TicketRecord[]
  readonly model: ForecastModel
}

let warehouse: Warehouse | null = null

function loadWarehouse(): Warehouse {
  if (!warehouse) {
    const records = generateDataset()
    warehouse = { records, model: trainForecastModel(records) }
  }
  return warehouse
}

/** Total rows in the mock warehouse, independent of any filter. */
export function datasetSize(): number {
  return loadWarehouse().records.length
}

function selectSnapshot(filters: DashboardFilters): DashboardSnapshot {
  const { records, model } = loadWarehouse()

  const routes =
    filters.region === 'all' ? ROUTES : ROUTES.filter((route) => route.region === filters.region)
  const routeIds = new Set(routes.map((route) => route.id))

  const scopedRecords = records.filter((record) => routeIds.has(record.routeId))
  const scopedRows = buildHorizonRows(model, filters.horizonDays).filter((row) =>
    routeIds.has(row.routeId),
  )

  // History shown behind the horizon tracks the horizon, but stops well short
  // of it on the long options — a year of actuals drawn against a year of
  // forecast is unreadable as a line.
  const historyDays = Math.min(
    HISTORY_DAYS,
    MAX_CHART_HISTORY_DAYS,
    Math.max(filters.horizonDays, 14),
  )
  const series = buildForecastSeries(scopedRecords, model, scopedRows, historyDays)
  const routeForecasts = buildRouteForecasts(
    scopedRows,
    scopedRecords,
    model,
    routes,
    filters.horizonDays,
  )
  const recommendations = buildRecommendations(scopedRows, routes, scopedRecords, model)

  return {
    generatedAt: SIMULATED_NOW.toISOString(),
    model: {
      name: MODEL.name,
      version: MODEL.version,
      algorithm: MODEL.algorithm,
      trainedAt: new Date(SIMULATED_NOW.getTime() - 72 * 60_000).toISOString(),
      trainingRows: records.length,
      seriesFitted: model.fits.length,
      nextRunAt: `${shiftIso(TODAY, 1)}T00:00:00.000Z`,
    },
    kpis: buildKpis({
      records: scopedRecords,
      rows: scopedRows,
      model,
      routeForecasts,
      series,
      horizonDays: filters.horizonDays,
    }),
    forecastSeries: series,
    historyDays,
    heatmap: buildHeatmap(scopedRows, scopedRecords),
    departureTimes: DEPARTURE_SLOTS,
    routes,
    routeForecasts,
    recommendations,
    channelMix: buildChannelMix(scopedRecords),
    capacityBands: buildCapacityBands(scopedRows),
    confidence: buildConfidence(model),
    summary: buildSummary(scopedRows, series, routeForecasts, scopedRecords, filters.horizonDays),
    recordCount: scopedRecords.length,
  }
}

/**
 * Queries the warehouse. The delay is deliberate — it exercises the loading
 * skeletons and makes the prototype behave like a networked product.
 */
export async function fetchDashboard(
  filters: DashboardFilters,
  { delayMs = 700 }: { delayMs?: number } = {},
): Promise<DashboardSnapshot> {
  await sleep(delayMs)
  return selectSnapshot(filters)
}
