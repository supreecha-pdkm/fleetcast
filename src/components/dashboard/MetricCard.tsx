import { Sparkline } from '@/components/common/Sparkline'
import { TrendPill } from '@/components/common/TrendPill'
import { Card } from '@/components/ui/card'
import { InfoTip } from '@/components/ui/tooltip'
import { formatMetric } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { KpiMetric } from '@/types/domain'

export interface MetricCardProps {
  readonly metric: KpiMetric
  readonly dimmed?: boolean
  readonly className?: string
  readonly style?: React.CSSProperties
}

export function MetricCard({ metric, dimmed = false, className, style }: MetricCardProps) {
  return (
    <Card
      style={style}
      className={cn(
        'group relative flex flex-col justify-between overflow-hidden p-5',
        'transition-[box-shadow,border-color,opacity] duration-200 hover:border-hairline-strong hover:shadow-raised',
        dimmed && 'opacity-45',
        className,
      )}
    >
      {/* Accent rail — appears on hover, purely decorative. */}
      <span
        className="absolute inset-y-0 left-0 w-px scale-y-0 bg-forecast opacity-0 transition-all duration-300 group-hover:scale-y-100 group-hover:opacity-100"
        aria-hidden
      />

      {/* The label owns a full line — six tiles across a desktop leaves each
          one narrow, and sharing the line with the sparkline wrapped it. */}
      <InfoTip label={metric.caption}>
        <p className="w-fit max-w-full cursor-help truncate text-[11px] font-medium tracking-[0.04em] text-ink-muted uppercase decoration-dotted underline-offset-4 hover:underline">
          {metric.label}
        </p>
      </InfoTip>

      <div className="mt-3 flex items-end justify-between gap-2">
        <p className="text-[30px] leading-none font-semibold tracking-[-0.025em] text-ink">
          {formatMetric(metric.value, metric.format)}
        </p>
        <Sparkline
          values={metric.sparkline}
          width={58}
          height={22}
          className="shrink-0 opacity-70"
        />
      </div>

      <div className="mt-3.5">
        <TrendPill
          delta={metric.delta}
          direction={metric.direction}
          intent={metric.intent}
          label={metric.deltaLabel}
        />
        <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-ink-muted">{metric.caption}</p>
      </div>
    </Card>
  )
}
