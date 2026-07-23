import {
  AlertTriangle,
  DatabaseZap,
  GitBranch,
  RefreshCcwDot,
  Send,
  type LucideIcon,
} from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SIMULATED_NOW } from '@/data/constants'
import { formatRelative } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { ForecastUpdate } from '@/types/domain'

const KIND_META: Record<ForecastUpdate['kind'], { Icon: LucideIcon; chip: string }> = {
  publish: { Icon: Send, chip: 'bg-forecast-wash text-forecast' },
  retrain: { Icon: RefreshCcwDot, chip: 'bg-good-wash text-good' },
  drift: { Icon: GitBranch, chip: 'bg-warning-wash text-warning' },
  ingest: { Icon: DatabaseZap, chip: 'bg-surface-sunken text-ink-secondary' },
  alert: { Icon: AlertTriangle, chip: 'bg-critical-wash text-critical' },
}

export function ForecastUpdates({
  updates,
  dimmed = false,
  className,
}: {
  updates: readonly ForecastUpdate[]
  dimmed?: boolean
  className?: string
}) {
  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader>
        <div>
          <h3 className="text-[15px] leading-6 font-semibold tracking-[-0.01em] text-ink">
            ความเคลื่อนไหวล่าสุดของการพยากรณ์
          </h3>
          <p className="mt-0.5 text-[13px] leading-5 text-ink-muted">
            กิจกรรมของไปป์ไลน์ในรอบ 24 ชั่วโมงที่ผ่านมา
          </p>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] text-ink-muted">
          <span className="relative flex size-1.5 text-good">
            <span className="absolute inset-0 animate-pulse-ring rounded-full" aria-hidden />
            <span className="relative size-1.5 rounded-full bg-good" aria-hidden />
          </span>
          สด
        </span>
      </CardHeader>

      <CardContent
        className={cn('flex-1 pt-0 transition-opacity duration-300', dimmed && 'opacity-45')}
      >
        <ScrollArea className="h-[268px] pr-3">
          <ol className="relative space-y-4">
            {updates.map((update, index) => {
              const { Icon, chip } = KIND_META[update.kind]
              const isLast = index === updates.length - 1

              return (
                <li key={update.id} className="relative flex gap-3 pl-0.5">
                  {/* Timeline rail */}
                  {!isLast ? (
                    <span
                      className="absolute top-7 bottom-[-16px] left-[13px] w-px bg-hairline"
                      aria-hidden
                    />
                  ) : null}

                  <span
                    className={cn(
                      'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-lg',
                      chip,
                    )}
                    aria-hidden
                  >
                    <Icon className="size-3.5" strokeWidth={2} />
                  </span>

                  <div className="min-w-0 flex-1 pb-0.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="truncate text-[12px] font-medium text-ink">{update.title}</p>
                      <time
                        className="shrink-0 text-[11px] text-ink-muted"
                        dateTime={update.timestamp}
                      >
                        {formatRelative(update.timestamp, SIMULATED_NOW)}
                      </time>
                    </div>
                    <p className="mt-0.5 text-[11px] leading-4 text-ink-muted">{update.detail}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
