import { MetricCard } from '@/components/dashboard/MetricCard'
import type { KpiMetric } from '@/types/domain'

export function KpiGrid({
  metrics,
  dimmed = false,
}: {
  metrics: readonly KpiMetric[]
  dimmed?: boolean
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {metrics.map((metric, i) => (
        <MetricCard
          key={metric.id}
          metric={metric}
          dimmed={dimmed}
          className="animate-rise"
          // Staggered entrance — the grid assembles rather than snapping in.
          style={{ animationDelay: `${i * 45}ms` }}
        />
      ))}
    </div>
  )
}
