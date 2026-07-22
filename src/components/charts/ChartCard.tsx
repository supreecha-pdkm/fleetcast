import { BarChart3, Table2 } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { InfoTip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface LegendEntry {
  readonly label: string
  readonly color: string
  /** Renders as a hollow swatch — used for uncertainty bands and baselines. */
  readonly variant?: 'solid' | 'band' | 'dashed'
}

export interface ChartCardProps {
  readonly title: string
  readonly description?: string
  readonly legend?: readonly LegendEntry[]
  readonly actions?: ReactNode
  readonly chart: ReactNode
  /** The WCAG-clean equivalent of the chart. Every chart ships one. */
  readonly table: ReactNode
  readonly footer?: ReactNode
  readonly className?: string
  readonly dimmed?: boolean
}

/**
 * The wrapper every chart lives in: title block, legend, a chart/table toggle
 * and the dimming behaviour used during a refetch (no skeleton flash once
 * data has been seen).
 */
export function ChartCard({
  title,
  description,
  legend,
  actions,
  chart,
  table,
  footer,
  className,
  dimmed = false,
}: ChartCardProps) {
  const [view, setView] = useState<'chart' | 'table'>('chart')

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader className="flex-wrap">
        <div className="min-w-0">
          <h3 className="text-[15px] leading-6 font-semibold tracking-[-0.01em] text-ink">
            {title}
          </h3>
          {description ? (
            <p className="mt-0.5 text-[13px] leading-5 text-ink-muted">{description}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <Tabs value={view} onValueChange={(v) => setView(v as 'chart' | 'table')}>
            <TabsList aria-label={`มุมมองของ ${title}`}>
              <InfoTip label="มุมมองกราฟ">
                <TabsTrigger value="chart" className="px-1.5" aria-label="มุมมองกราฟ">
                  <BarChart3 />
                </TabsTrigger>
              </InfoTip>
              <InfoTip label="มุมมองตาราง">
                <TabsTrigger value="table" className="px-1.5" aria-label="มุมมองตาราง">
                  <Table2 />
                </TabsTrigger>
              </InfoTip>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      {legend && legend.length > 0 && view === 'chart' ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-5 pb-3">
          {legend.map((entry) => (
            <span key={entry.label} className="flex items-center gap-1.5">
              <LegendSwatch entry={entry} />
              <span className="text-[12px] text-ink-secondary">{entry.label}</span>
            </span>
          ))}
        </div>
      ) : null}

      <CardContent
        className={cn(
          'flex-1 transition-opacity duration-300',
          dimmed && 'pointer-events-none opacity-45',
        )}
      >
        {view === 'chart' ? chart : <div className="max-h-[420px] overflow-auto">{table}</div>}
      </CardContent>

      {footer ? (
        <div className="border-t border-hairline px-5 py-2.5 text-[12px] leading-5 text-ink-muted">
          {footer}
        </div>
      ) : null}
    </Card>
  )
}

function LegendSwatch({ entry }: { entry: LegendEntry }) {
  if (entry.variant === 'band') {
    return (
      <span
        className="h-2.5 w-3.5 shrink-0 rounded-[3px] opacity-30"
        style={{ backgroundColor: entry.color }}
        aria-hidden
      />
    )
  }
  if (entry.variant === 'dashed') {
    return (
      <span
        className="h-0 w-3.5 shrink-0 border-t-2 border-dashed"
        style={{ borderColor: entry.color }}
        aria-hidden
      />
    )
  }
  return (
    <span
      className="h-0.5 w-3.5 shrink-0 rounded-full"
      style={{ backgroundColor: entry.color }}
      aria-hidden
    />
  )
}

/** Consistent table styling for every chart's table twin. */
export function DataTable({
  headers,
  rows,
  align = [],
}: {
  headers: readonly string[]
  rows: readonly (readonly ReactNode[])[]
  align?: readonly ('left' | 'right')[]
}) {
  return (
    <table className="w-full border-collapse text-[12px]">
      <thead className="sticky top-0 z-10 bg-surface">
        <tr className="border-b border-hairline">
          {headers.map((header, i) => (
            <th
              key={header}
              scope="col"
              className={cn(
                'px-2 py-2 font-medium whitespace-nowrap text-ink-muted',
                align[i] === 'right' ? 'text-right' : 'text-left',
              )}
            >
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-hairline last:border-0 hover:bg-surface-hover">
            {row.map((cell, j) => (
              <td
                key={j}
                className={cn(
                  'px-2 py-1.5 whitespace-nowrap text-ink-secondary',
                  align[j] === 'right' ? 'tnum text-right' : 'text-left',
                )}
              >
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
