import { useMemo } from 'react'

import { DataTable } from '@/components/charts/ChartCard'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SLOT_LABELS } from '@/data/constants'
import { formatNumber, formatPercent, formatSignedPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { HeatmapCell, Route } from '@/types/domain'

/**
 * Seven ordered bins for predicted load factor. Sequential single hue,
 * light → dark; the value is printed in every cell so the encoding never
 * rests on colour alone.
 */
const BINS = [
  { max: 0.4, step: 100, label: '< 40%' },
  { max: 0.55, step: 200, label: '40–55%' },
  { max: 0.7, step: 300, label: '55–70%' },
  { max: 0.8, step: 400, label: '70–80%' },
  { max: 0.88, step: 500, label: '80–88%' },
  { max: 0.95, step: 600, label: '88–95%' },
  { max: Infinity, step: 700, label: '≥ 95%' },
] as const

/** Literal indices — a computed `length - 1` would widen to `| undefined`. */
const BOTTOM_BIN = BINS[0]
const TOP_BIN = BINS[6]

function binFor(loadFactor: number): (typeof BINS)[number] {
  return BINS.find((bin) => loadFactor < bin.max) ?? TOP_BIN
}

function cellStyle(loadFactor: number): React.CSSProperties {
  const { step } = binFor(loadFactor)
  return {
    backgroundColor: `var(--seq-${step})`,
    color: `var(--seq-${step}-fg)`,
  }
}

export interface DemandHeatmapProps {
  readonly routes: readonly Route[]
  readonly departureTimes: readonly string[]
  readonly cells: readonly HeatmapCell[]
}

export function DemandHeatmap({ routes, departureTimes, cells }: DemandHeatmapProps) {
  const byKey = useMemo(
    () => new Map(cells.map((cell) => [`${cell.routeId}|${cell.departureTime}`, cell])),
    [cells],
  )

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[520px]">
        {/* Column header */}
        <div
          className="grid gap-0.5 pb-1.5"
          style={{ gridTemplateColumns: `150px repeat(${departureTimes.length}, minmax(0, 1fr))` }}
        >
          <span />
          {departureTimes.map((time) => (
            <div key={time} className="px-1 text-center">
              <p className="tnum text-[12px] font-medium text-ink">{time}</p>
              <p className="text-[10px] text-ink-muted">{SLOT_LABELS[time] ?? ''}</p>
            </div>
          ))}
        </div>

        <div className="space-y-0.5">
          {routes.map((route) => (
            <div
              key={route.id}
              className="grid gap-0.5"
              style={{
                gridTemplateColumns: `150px repeat(${departureTimes.length}, minmax(0, 1fr))`,
              }}
            >
              <div className="flex min-w-0 flex-col justify-center pr-2">
                <p className="truncate text-[12px] font-medium text-ink">{route.code}</p>
                <p className="truncate text-[11px] text-ink-muted">{route.name}</p>
              </div>

              {departureTimes.map((time) => {
                const cell = byKey.get(`${route.id}|${time}`)
                if (!cell) {
                  return (
                    <div
                      key={time}
                      className="flex h-11 items-center justify-center rounded-md border border-dashed border-hairline text-[11px] text-ink-muted"
                    >
                      —
                    </div>
                  )
                }

                return (
                  <Tooltip key={time}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        style={cellStyle(cell.loadFactor)}
                        className={cn(
                          'tnum flex h-11 items-center justify-center rounded-md text-[12px] font-semibold',
                          'ring-offset-surface transition-transform duration-150 outline-none',
                          'hover:scale-[1.03] hover:shadow-raised focus-visible:scale-[1.03]',
                        )}
                      >
                        {Math.round(cell.loadFactor * 100)}%
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">
                        {route.code} · {time}
                      </p>
                      <p className="mt-1 text-ink-secondary">
                        {formatNumber(cell.predictedPassengers)} จาก {cell.seatCapacity} ที่นั่ง ·{' '}
                        อัตราบรรทุกที่พยากรณ์ {formatPercent(cell.loadFactor)}
                      </p>
                      <p className="mt-0.5 text-ink-muted">
                        {formatSignedPercent(cell.delta)} เทียบค่าเฉลี่ย 30 วันย้อนหลัง
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Scale legend — required whenever a continuous ramp carries meaning. */
export function HeatmapScale() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="text-[11px] text-ink-muted">อัตราบรรทุกที่พยากรณ์</span>
      <div className="flex items-center gap-0.5">
        {BINS.map((bin) => (
          <span key={bin.step} className="flex items-center gap-1">
            <span
              className="h-2.5 w-5 rounded-[3px]"
              style={{ backgroundColor: `var(--seq-${bin.step})` }}
              aria-hidden
            />
          </span>
        ))}
      </div>
      <span className="tnum text-[11px] text-ink-muted">
        {BOTTOM_BIN.label} → {TOP_BIN.label}
      </span>
    </div>
  )
}

export function HeatmapTable({
  routes,
  cells,
}: {
  routes: readonly Route[]
  cells: readonly HeatmapCell[]
}) {
  const routeById = new Map(routes.map((route) => [route.id, route]))

  return (
    <DataTable
      headers={[
        'เส้นทาง',
        'รอบเดินรถ',
        'อัตราบรรทุกที่พยากรณ์',
        'ผู้โดยสาร',
        'ที่นั่ง',
        'เทียบย้อนหลัง',
      ]}
      align={['left', 'left', 'right', 'right', 'right', 'right']}
      rows={cells
        .filter((cell) => routeById.has(cell.routeId))
        .map((cell) => [
          routeById.get(cell.routeId)?.code ?? cell.routeId,
          cell.departureTime,
          formatPercent(cell.loadFactor),
          formatNumber(cell.predictedPassengers),
          cell.seatCapacity,
          formatSignedPercent(cell.delta),
        ])}
    />
  )
}
