import { useMemo } from 'react'
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { DataTable } from '@/components/charts/ChartCard'
import {
  AXIS_PROPS,
  CHART_COLORS,
  CURSOR_PROPS,
  GRID_PROPS,
  LINE_WIDTH,
} from '@/components/charts/chartTheme'
import { formatLongDate, formatShortDate } from '@/lib/date'
import { formatNumber, formatPercent } from '@/lib/format'
import type { ForecastPoint } from '@/types/domain'

interface Datum {
  readonly date: string
  readonly label: string
  readonly actual: number | null
  /** In-sample model fit — the "forecast" line over observed days. */
  readonly fit: number | null
  readonly forecast: number | null
  readonly band: readonly [number, number] | null
  readonly loadFactor: number | null
  readonly forecastLoadFactor: number
  readonly holidayName: string | null
  readonly isFuture: boolean
}

function toData(series: readonly ForecastPoint[]): Datum[] {
  const lastObservedIndex = series.reduce((last, p, i) => (p.isFuture ? last : i), 0)

  return series.map((point, i) => ({
    date: point.date,
    label: formatShortDate(point.date),
    actual: point.actual,
    // The seam day carries both, so the solid and dashed lines meet.
    fit: point.isFuture ? null : point.forecast,
    forecast: point.isFuture || i === lastObservedIndex ? point.forecast : null,
    band: point.isFuture || i === lastObservedIndex ? ([point.lower, point.upper] as const) : null,
    loadFactor: point.loadFactor,
    forecastLoadFactor: point.forecastLoadFactor,
    holidayName: point.holidayName,
    isFuture: point.isFuture,
  }))
}

/** Contiguous runs of holiday dates, so a long weekend shades as one block. */
function holidayBlocks(data: readonly Datum[]): { from: string; to: string; name: string }[] {
  const blocks: { from: string; to: string; name: string }[] = []
  let current: { from: string; to: string; name: string } | null = null

  for (const datum of data) {
    if (datum.holidayName) {
      if (current) current.to = datum.date
      else current = { from: datum.date, to: datum.date, name: datum.holidayName }
    } else if (current) {
      blocks.push(current)
      current = null
    }
  }
  if (current) blocks.push(current)
  return blocks
}

export function ForecastChart({
  series,
  today,
}: {
  series: readonly ForecastPoint[]
  today: string
}) {
  const data = useMemo(() => toData(series), [series])
  const blocks = useMemo(() => holidayBlocks(data), [data])
  const tickInterval = Math.max(1, Math.round(data.length / 9))

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data as unknown as Record<string, unknown>[]}
          margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
        >
          <defs>
            <linearGradient id="forecast-band" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.series2} stopOpacity={0.2} />
              <stop offset="100%" stopColor={CHART_COLORS.series2} stopOpacity={0.06} />
            </linearGradient>
          </defs>

          <CartesianGrid {...GRID_PROPS} />

          {blocks.map((block) => (
            <ReferenceArea
              key={block.from}
              x1={formatShortDate(block.from)}
              x2={formatShortDate(block.to)}
              fill={CHART_COLORS.muted}
              fillOpacity={0.07}
              stroke="none"
            />
          ))}

          <XAxis
            dataKey="label"
            {...AXIS_PROPS}
            axisLine={{ stroke: CHART_COLORS.axis }}
            interval={tickInterval - 1}
            minTickGap={16}
            padding={{ left: 6, right: 6 }}
          />
          <YAxis
            {...AXIS_PROPS}
            axisLine={false}
            width={56}
            tickFormatter={(value: number) => formatNumber(value)}
            domain={['dataMin - 120', 'dataMax + 80']}
          />

          <ReferenceLine
            x={formatShortDate(today)}
            stroke={CHART_COLORS.axis}
            strokeWidth={1}
            label={{
              value: 'วันนี้',
              position: 'insideTopLeft',
              fill: CHART_COLORS.muted,
              fontSize: 10,
              offset: 6,
            }}
          />

          <Tooltip
            cursor={CURSOR_PROPS}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const datum = payload[0]?.payload as Datum | undefined
              if (!datum) return null

              return (
                <ChartTooltip
                  title={formatLongDate(datum.date)}
                  subtitle={datum.holidayName ?? (datum.isFuture ? 'ค่าพยากรณ์' : 'ค่าจริง')}
                  rows={[
                    ...(datum.actual !== null
                      ? [
                          {
                            label: 'ผู้โดยสารจริง',
                            value: formatNumber(datum.actual),
                            color: CHART_COLORS.series1,
                          },
                        ]
                      : []),
                    {
                      label: datum.isFuture ? 'ผู้โดยสารที่พยากรณ์' : 'ค่าที่โมเดลฟิต',
                      value: formatNumber(datum.forecast ?? datum.fit ?? 0),
                      color: CHART_COLORS.series2,
                    },
                    ...(datum.band
                      ? [
                          {
                            label: 'ช่วงความเชื่อมั่น 80%',
                            value: `${formatNumber(datum.band[0])} – ${formatNumber(datum.band[1])}`,
                            muted: true,
                          },
                        ]
                      : []),
                    {
                      label: 'อัตราบรรทุก',
                      value: formatPercent(datum.loadFactor ?? datum.forecastLoadFactor),
                      muted: true,
                    },
                  ]}
                />
              )
            }}
          />

          <Area
            dataKey="band"
            stroke="none"
            fill="url(#forecast-band)"
            isAnimationActive={false}
            connectNulls
            activeDot={false}
          />
          <Line
            dataKey="actual"
            stroke={CHART_COLORS.series1}
            strokeWidth={LINE_WIDTH}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: CHART_COLORS.surface }}
            isAnimationActive={false}
            connectNulls={false}
          />
          <Line
            dataKey="fit"
            stroke={CHART_COLORS.series2}
            strokeWidth={LINE_WIDTH}
            strokeOpacity={0.55}
            dot={false}
            activeDot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
          <Line
            dataKey="forecast"
            stroke={CHART_COLORS.series2}
            strokeWidth={LINE_WIDTH}
            strokeDasharray="5 4"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: CHART_COLORS.surface }}
            isAnimationActive={false}
            connectNulls={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ForecastTable({ series }: { series: readonly ForecastPoint[] }) {
  return (
    <DataTable
      headers={['วันที่', 'ค่าจริง', 'ค่าพยากรณ์', 'ช่วงความเชื่อมั่น', 'อัตราบรรทุก', 'หมายเหตุ']}
      align={['left', 'right', 'right', 'right', 'right', 'left']}
      rows={series.map((point) => [
        formatShortDate(point.date),
        point.actual === null ? '—' : formatNumber(point.actual),
        formatNumber(point.forecast),
        point.isFuture ? `${formatNumber(point.lower)} – ${formatNumber(point.upper)}` : '—',
        formatPercent(point.loadFactor ?? point.forecastLoadFactor),
        point.holidayName ?? (point.isFuture ? 'ค่าพยากรณ์' : 'ค่าจริง'),
      ])}
    />
  )
}
