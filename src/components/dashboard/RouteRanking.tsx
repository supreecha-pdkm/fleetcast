import { ROUTE_STATUS_LABEL } from '@/components/common/severity'
import { Sparkline } from '@/components/common/Sparkline'
import { StatusBadge } from '@/components/common/StatusIndicator'
import { TrendPill } from '@/components/common/TrendPill'
import { DataTable } from '@/components/charts/ChartCard'
import { CHART_COLORS } from '@/components/charts/chartTheme'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatShortDate } from '@/lib/date'
import { formatCurrency, formatNumber, formatPercent, formatSignedPercent } from '@/lib/format'
import { pctChange } from '@/lib/utils'
import type { RouteForecast } from '@/types/domain'

/**
 * Magnitude ranking with the bar drawn inside the row. One series, one
 * colour — the bar length already encodes size, so hue stays free.
 */
export function RouteRanking({ forecasts }: { forecasts: readonly RouteForecast[] }) {
  const max = Math.max(...forecasts.map((f) => f.predictedPassengers), 1)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div className="grid grid-cols-[minmax(0,1fr)_120px_92px_104px_88px] items-center gap-3 px-2 pb-2 text-[11px] font-medium tracking-[0.02em] text-ink-muted uppercase">
          <span>เส้นทาง</span>
          <span className="text-right">ความต้องการที่พยากรณ์</span>
          <span className="text-right">อัตราบรรทุก</span>
          <span className="text-right">เทียบย้อนหลัง</span>
          <span className="text-right">สถานะ</span>
        </div>

        <div className="space-y-0.5">
          {forecasts.map((forecast, index) => (
            <Tooltip key={forecast.route.id}>
              <TooltipTrigger asChild>
                <div
                  className="grid cursor-default grid-cols-[minmax(0,1fr)_120px_92px_104px_88px] items-center gap-3 rounded-lg px-2 py-2.5 transition-colors duration-150 hover:bg-surface-hover"
                  tabIndex={0}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="tnum w-4 shrink-0 text-[12px] text-ink-muted">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-medium text-ink">
                        {forecast.route.code}
                        <span className="ml-2 font-normal text-ink-secondary">
                          {forecast.route.name}
                        </span>
                      </p>
                      {/* Magnitude bar sits under the label, full row width. */}
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-sunken">
                        <div
                          className="h-full rounded-full transition-[width] duration-500"
                          style={{
                            width: `${(forecast.predictedPassengers / max) * 100}%`,
                            backgroundColor: CHART_COLORS.series1,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Sparkline
                      values={forecast.sparkline}
                      width={44}
                      height={18}
                      stroke={CHART_COLORS.series1}
                      className="opacity-60"
                    />
                    <span className="tnum text-[13px] font-semibold text-ink">
                      {formatNumber(forecast.predictedPassengers)}
                    </span>
                  </div>

                  <span className="tnum text-right text-[13px] text-ink-secondary">
                    {formatPercent(forecast.predictedLoadFactor)}
                  </span>

                  <div className="flex justify-end">
                    <TrendPill
                      delta={forecast.growth}
                      direction={
                        Math.abs(forecast.growth) < 0.001
                          ? 'flat'
                          : forecast.growth > 0
                            ? 'up'
                            : 'down'
                      }
                      intent={
                        Math.abs(forecast.growth) < 0.001
                          ? 'neutral'
                          : forecast.growth > 0
                            ? 'positive'
                            : 'negative'
                      }
                    />
                  </div>

                  <div className="flex justify-end">
                    <StatusBadge status={forecast.status} />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p className="font-semibold">{forecast.route.name}</p>
                <p className="mt-1 text-ink-secondary">
                  {formatNumber(forecast.predictedPassengers)} ผู้โดยสาร · รายได้ที่พยากรณ์{' '}
                  {formatCurrency(forecast.predictedRevenue)}
                </p>
                <p className="mt-0.5 text-ink-muted">
                  สูงสุดวันที่ {formatShortDate(forecast.peakDate)} · {forecast.departuresPerDay}{' '}
                  เที่ยวต่อวัน · ความเชื่อมั่น {formatPercent(forecast.confidence, 0)}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  )
}

export function RouteRankingTable({ forecasts }: { forecasts: readonly RouteForecast[] }) {
  return (
    <DataTable
      headers={[
        'เส้นทาง',
        'ค่าพยากรณ์',
        'ช่วงย้อนหลัง',
        'เปลี่ยนแปลง',
        'อัตราบรรทุก',
        'รายได้',
        'วันที่สูงสุด',
        'สถานะ',
      ]}
      align={['left', 'right', 'right', 'right', 'right', 'right', 'left', 'left']}
      rows={forecasts.map((forecast) => [
        `${forecast.route.code} · ${forecast.route.name}`,
        formatNumber(forecast.predictedPassengers),
        formatNumber(forecast.currentPassengers),
        formatSignedPercent(pctChange(forecast.predictedPassengers, forecast.currentPassengers)),
        formatPercent(forecast.predictedLoadFactor),
        formatCurrency(forecast.predictedRevenue),
        formatShortDate(forecast.peakDate),
        ROUTE_STATUS_LABEL[forecast.status],
      ])}
    />
  )
}
