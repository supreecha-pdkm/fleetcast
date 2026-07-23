import { Gauge, LayoutGrid, ListOrdered, Route as RouteIcon } from 'lucide-react'

import { ChartCard } from '@/components/charts/ChartCard'
import { ChannelDonut, ChannelTable } from '@/components/charts/ChannelDonut'
import { channelLegend } from '@/components/charts/channelSlices'
import { FORECAST_LEGEND } from '@/components/charts/chartTheme'
import { DemandHeatmap, HeatmapScale, HeatmapTable } from '@/components/charts/DemandHeatmap'
import { ForecastChart, ForecastTable } from '@/components/charts/ForecastChart'
import {
  ChartCardSkeleton,
  KpiGridSkeleton,
  ListSkeleton,
} from '@/components/common/LoadingSkeleton'
import { SectionTitle } from '@/components/common/SectionTitle'
import { CapacityTable, CapacityUtilization } from '@/components/dashboard/CapacityUtilization'
import { ConfidencePanel } from '@/components/dashboard/ConfidencePanel'
import { FilterBar } from '@/components/dashboard/FilterBar'
import { ForecastUpdates } from '@/components/dashboard/ForecastUpdates'
import { KpiGrid } from '@/components/dashboard/KpiGrid'
import { PredictionSummaryCard } from '@/components/dashboard/PredictionSummaryCard'
import { RecommendationPanel } from '@/components/dashboard/RecommendationPanel'
import { RouteRanking, RouteRankingTable } from '@/components/dashboard/RouteRanking'
import { RouteStatusBoard } from '@/components/dashboard/RouteStatusBoard'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TODAY } from '@/data/constants'
import { useDashboard } from '@/hooks/useDashboard'
import { formatLongDate } from '@/lib/date'
import { formatNumber, formatPercent } from '@/lib/format'

export function DashboardPage() {
  const { snapshot, filters, setFilters, isLoading, isRefreshing, refresh } = useDashboard()

  const accuracy = snapshot?.confidence.accuracy ?? null
  const alertCount = snapshot?.recommendations.filter((r) => r.severity === 'critical').length ?? 0

  return (
    <DashboardLayout accuracy={accuracy} alertCount={alertCount}>
      <div className="space-y-5">
        {/* Page heading */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[22px] leading-7 font-semibold tracking-[-0.02em] text-ink">
              ภาพรวมการพยากรณ์ความต้องการเดินทาง
            </h1>
            <p className="mt-1 text-[13px] text-ink-muted">
              พยากรณ์จำนวนผู้โดยสารและอัตราบรรทุกรายเส้นทางและรายรอบเดินรถ · {formatLongDate(TODAY)}
            </p>
          </div>
        </div>

        <FilterBar
          filters={filters}
          onChange={setFilters}
          onRefresh={refresh}
          isRefreshing={isRefreshing}
          generatedAt={snapshot?.generatedAt ?? null}
          recordCount={snapshot?.recordCount ?? null}
        />

        {/* 1 · Executive KPIs */}
        <section aria-labelledby="kpi-heading">
          <SectionTitle
            className="mb-3"
            icon={LayoutGrid}
            title="ตัวชี้วัดหลักสำหรับผู้บริหาร"
            description={
              snapshot
                ? `คำนวณจากข้อมูลเที่ยวรถ ${formatNumber(snapshot.model.trainingRows)} รายการ ย้อนหลัง 30 วัน`
                : 'กำลังโหลดข้อมูล…'
            }
          />
          <h2 id="kpi-heading" className="sr-only">
            ตัวชี้วัดหลักสำหรับผู้บริหาร
          </h2>

          {isLoading || !snapshot ? (
            <KpiGridSkeleton />
          ) : (
            <KpiGrid metrics={snapshot.kpis} dimmed={isRefreshing} />
          )}
        </section>

        {/* 9 · Prediction summary */}
        {isLoading || !snapshot ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
              <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <PredictionSummaryCard
            summary={snapshot.summary}
            model={snapshot.model}
            dimmed={isRefreshing}
          />
        )}

        {/* 2 · Forecast chart · 7 · Confidence */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {isLoading || !snapshot ? (
            <>
              <ChartCardSkeleton className="xl:col-span-8" height={300} />
              <ChartCardSkeleton className="xl:col-span-4" height={300} />
            </>
          ) : (
            <>
              <ChartCard
                className="xl:col-span-8"
                title="ความต้องการทั้งเครือข่าย · ค่าจริงเทียบค่าพยากรณ์"
                description={`จำนวนผู้โดยสารรายวันย้อนหลัง 30 วัน และอีก ${filters.horizonDays} วันข้างหน้า แถบสีเทาคือวันหยุดนักขัตฤกษ์`}
                legend={FORECAST_LEGEND}
                dimmed={isRefreshing}
                chart={<ForecastChart series={snapshot.forecastSeries} today={TODAY} />}
                table={<ForecastTable series={snapshot.forecastSeries} />}
                footer={
                  <>
                    เส้นพยากรณ์ลากทับช่วงข้อมูลจริงด้วย
                    ส่วนนั้นคือค่าที่โมเดลฟิตกับข้อมูลที่เห็นแล้ว ยิ่งเกาะเส้นสีน้ำเงินใกล้เท่าไร
                    ยิ่งสะท้อนความแม่นยำได้ดีเท่านั้น ({formatPercent(snapshot.confidence.accuracy)}{' '}
                    บนชุดทดสอบ)
                  </>
                }
              />
              <ConfidencePanel
                className="xl:col-span-4"
                confidence={snapshot.confidence}
                model={snapshot.model}
                dimmed={isRefreshing}
              />
            </>
          )}
        </div>

        {/* 3 · Heatmap · 6 · Capacity utilisation */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {isLoading || !snapshot ? (
            <>
              <ChartCardSkeleton className="xl:col-span-8" height={340} />
              <ChartCardSkeleton className="xl:col-span-4" height={340} />
            </>
          ) : (
            <>
              <ChartCard
                className="xl:col-span-8"
                title="แผนภาพความหนาแน่น · เส้นทาง × รอบเดินรถ"
                description={`อัตราบรรทุกเฉลี่ยที่พยากรณ์ของแต่ละรอบเดินรถ ในอีก ${filters.horizonDays} วันข้างหน้า`}
                actions={<HeatmapScale />}
                dimmed={isRefreshing}
                chart={
                  <DemandHeatmap
                    routes={snapshot.routes}
                    departureTimes={snapshot.departureTimes}
                    cells={snapshot.heatmap}
                  />
                }
                table={<HeatmapTable routes={snapshot.routes} cells={snapshot.heatmap} />}
                footer="ช่องที่เกิน 95% ถือว่าเต็มเชิงโครงสร้าง — ค่าพยากรณ์เฉลี่ยของโมเดลเกินจำนวนที่นั่งที่เปิดขายไปแล้ว ส่วนที่เกินคือความต้องการที่เครือข่ายต้องปฏิเสธ"
              />

              <ChartCard
                className="xl:col-span-4"
                title="การใช้ความจุ"
                description="ตำแหน่งของทุกเที่ยวรถที่พยากรณ์ เทียบกับนโยบายอัตราบรรทุก"
                dimmed={isRefreshing}
                chart={
                  <CapacityUtilization
                    bands={snapshot.capacityBands}
                    loadFactor={snapshot.summary.averageLoadFactor}
                  />
                }
                table={<CapacityTable bands={snapshot.capacityBands} />}
              />
            </>
          )}
        </div>

        {/* 8 · Route status */}
        <section>
          <SectionTitle
            className="mb-3"
            icon={Gauge}
            title="สถานะเส้นทาง"
            description="สุขภาพของทุกเส้นทางในขอบเขตที่เลือก ประเมินจากอัตราบรรทุกที่พยากรณ์เทียบกับเกณฑ์นโยบายของผู้ประกอบการ"
          />
          {isLoading || !snapshot ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <Card key={i} className="p-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="mt-3 h-3 w-full" />
                  <Skeleton className="mt-3 h-5 w-32" />
                </Card>
              ))}
            </div>
          ) : (
            <RouteStatusBoard forecasts={snapshot.routeForecasts} dimmed={isRefreshing} />
          )}
        </section>

        {/* 4 · Route ranking · 5 · rule-based recommendations · channel mix · 10 · updates
            The recommendation panel is the tallest card on the page, so it takes
            the right rail for the whole block and the shorter cards stack beside
            it — otherwise it leaves a column of dead space. */}
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-12">
          {isLoading || !snapshot ? (
            <>
              <div className="space-y-4 xl:col-span-8">
                <ChartCardSkeleton height={320} />
                <ChartCardSkeleton height={220} />
              </div>
              <div className="space-y-4 xl:col-span-4">
                <Card>
                  <CardHeader>
                    <Skeleton className="h-4 w-40" />
                  </CardHeader>
                  <CardContent>
                    <ListSkeleton rows={8} />
                  </CardContent>
                </Card>
                <ChartCardSkeleton height={220} />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4 xl:col-span-8">
                <ChartCard
                  title="อันดับเส้นทาง · ความต้องการที่พยากรณ์สูงสุด"
                  description={`จัดอันดับตามจำนวนผู้โดยสารที่พยากรณ์ในอีก ${filters.horizonDays} วันข้างหน้า`}
                  actions={
                    <span className="hidden items-center gap-1.5 text-[11px] text-ink-muted sm:flex">
                      <ListOrdered className="size-3.5" aria-hidden />
                      {snapshot.routeForecasts.length} เส้นทาง
                    </span>
                  }
                  dimmed={isRefreshing}
                  chart={<RouteRanking forecasts={snapshot.routeForecasts} />}
                  table={<RouteRankingTable forecasts={snapshot.routeForecasts} />}
                />

                <ForecastUpdates updates={snapshot.updates} dimmed={isRefreshing} />
              </div>

              <div className="space-y-4 xl:col-span-4">
                <RecommendationPanel
                  recommendations={snapshot.recommendations}
                  dimmed={isRefreshing}
                />

                <ChartCard
                  title="สัดส่วนช่องทางการจอง"
                  description="สัดส่วนตั๋วที่ขายได้จริง แยกตามช่องทาง"
                  legend={channelLegend(snapshot.channelMix)}
                  dimmed={isRefreshing}
                  chart={<ChannelDonut mix={snapshot.channelMix} />}
                  table={<ChannelTable mix={snapshot.channelMix} />}
                  footer="ช่องทาง API ของตัวแทนมีค่าบวกเพิ่มต่อตั๋วที่การขายตรงแบบ B2C ไม่มี — การเปลี่ยนสัดส่วนช่องทางจึงเป็นตัวแปรด้านกำไร ไม่ใช่แค่ปริมาณ"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-5 pb-2 text-[11px] text-ink-muted">
          <span className="flex items-center gap-1.5">
            <RouteIcon className="size-3.5" aria-hidden />
            ต้นแบบ Fleetcast · ทุกตัวเลขคำนวณจากชุดข้อมูลจำลอง{' '}
            {snapshot ? formatNumber(snapshot.model.trainingRows) : '—'} รายการเที่ยวรถ
          </span>
          <span>ไม่มีระบบหลังบ้าน ไม่มีการเรียกเครือข่าย — คำนวณทั้งหมดในเบราว์เซอร์</span>
        </footer>
      </div>
    </DashboardLayout>
  )
}
