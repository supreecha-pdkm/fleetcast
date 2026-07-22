import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function MetricCardSkeleton() {
  return (
    <Card className="p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-8 w-28" />
      <div className="mt-4 flex items-end justify-between gap-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-7 w-20" />
      </div>
    </Card>
  )
}

export function KpiGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {Array.from({ length: count }, (_, i) => (
        <MetricCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ChartCardSkeleton({
  className,
  height = 260,
}: {
  className?: string
  height?: number
}) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <div className="w-full">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-2 h-3 w-64" />
        </div>
        <Skeleton className="h-7 w-24" />
      </CardHeader>
      <CardContent className="flex-1">
        <div className="flex h-full flex-col justify-end gap-2" style={{ minHeight: height }}>
          <ShimmerCurve />
          <div className="flex justify-between pt-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-2.5 w-8" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** A skeleton shaped like a chart reads better than a plain grey block. */
function ShimmerCurve() {
  return (
    <div className="flex flex-1 animate-shimmer items-end gap-1.5" aria-hidden>
      {[38, 52, 44, 61, 55, 72, 64, 80, 70, 88, 76, 94, 84, 68, 58].map((height, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-[3px] bg-surface-sunken"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  )
}

export function ListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-3/5" />
          </div>
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  )
}
