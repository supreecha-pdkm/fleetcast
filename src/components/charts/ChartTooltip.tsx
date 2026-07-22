import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface TooltipRow {
  readonly label: string
  readonly value: string
  readonly color?: string
  readonly muted?: boolean
}

export interface ChartTooltipProps {
  readonly title: string
  readonly subtitle?: string | null
  readonly rows: readonly TooltipRow[]
  readonly footer?: ReactNode
  readonly className?: string
}

/**
 * Shared tooltip shell. Values are also reachable from the table view, so the
 * tooltip enhances rather than gates.
 */
export function ChartTooltip({ title, subtitle, rows, footer, className }: ChartTooltipProps) {
  return (
    <div
      className={cn(
        'min-w-44 rounded-lg border border-hairline bg-surface-raised p-2.5 shadow-overlay',
        className,
      )}
    >
      <p className="text-[12px] font-semibold text-ink">{title}</p>
      {subtitle ? <p className="mt-0.5 text-[11px] text-ink-muted">{subtitle}</p> : null}

      <div className="mt-2 space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              {row.color ? (
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: row.color }}
                  aria-hidden
                />
              ) : (
                <span className="size-1.5 shrink-0" aria-hidden />
              )}
              <span
                className={cn('text-[11px]', row.muted ? 'text-ink-muted' : 'text-ink-secondary')}
              >
                {row.label}
              </span>
            </span>
            <span className="tnum text-[11px] font-medium text-ink">{row.value}</span>
          </div>
        ))}
      </div>

      {footer ? (
        <div className="mt-2 border-t border-hairline pt-1.5 text-[11px] text-ink-muted">
          {footer}
        </div>
      ) : null}
    </div>
  )
}
