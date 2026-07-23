import { ArrowDownRight, ArrowUpRight, CalendarClock, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { formatShortDate, formatWeekday } from '@/lib/date'
import { formatCurrency, formatNumber, formatSignedPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ModelMeta, PredictionSummary } from '@/types/domain'

interface FigureProps {
  readonly label: string
  readonly value: string
  readonly caption: string
  readonly accent?: 'up' | 'down' | 'none'
}

function Figure({ label, value, caption, accent = 'none' }: FigureProps) {
  const Icon = accent === 'up' ? ArrowUpRight : accent === 'down' ? ArrowDownRight : null

  return (
    <div className="min-w-0 border-l border-hairline pl-4 first:border-l-0 first:pl-0">
      <p className="text-[11px] tracking-[0.02em] text-ink-muted uppercase">{label}</p>
      <p className="mt-1.5 flex items-center gap-1 text-[20px] leading-none font-semibold tracking-[-0.02em] text-ink">
        {Icon ? (
          <Icon
            className={cn('size-4 shrink-0', accent === 'up' ? 'text-delta-up' : 'text-delta-down')}
            strokeWidth={2.5}
            aria-hidden
          />
        ) : null}
        {value}
      </p>
      <p className="mt-1.5 truncate text-[11px] text-ink-muted">{caption}</p>
    </div>
  )
}

export function PredictionSummaryCard({
  summary,
  model,
  dimmed = false,
  className,
}: {
  summary: PredictionSummary
  model: ModelMeta
  dimmed?: boolean
  className?: string
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-forecast-wash text-forecast">
              <TrendingUp className="size-3.5" strokeWidth={2} aria-hidden />
            </span>
            <h3 className="text-[15px] leading-6 font-semibold tracking-[-0.01em] text-ink">
              สรุปผลการพยากรณ์
            </h3>
          </div>
          <p className="mt-0.5 text-[13px] leading-5 text-ink-muted">
            {model.name} {model.version} · อีก {summary.horizonDays} วันข้างหน้า
          </p>
        </div>

        <span className="hidden items-center gap-1.5 text-[11px] text-ink-muted sm:flex">
          <CalendarClock className="size-3.5" aria-hidden />
          รันครั้งถัดไป {formatShortDate(model.nextRunAt.slice(0, 10))} 00:00 น.
        </span>
      </CardHeader>

      <CardContent className={cn('transition-opacity duration-300', dimmed && 'opacity-45')}>
        <p className="text-[13px] leading-6 text-ink-secondary">{summary.narrative}</p>

        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5 lg:grid-cols-4">
          <Figure
            label="ผู้โดยสารที่พยากรณ์"
            value={formatNumber(summary.totalPredictedPassengers)}
            caption={`รายได้ที่พยากรณ์ ${formatCurrency(summary.totalPredictedRevenue)}`}
          />
          <Figure
            label="วันที่หนาแน่นที่สุด"
            value={formatShortDate(summary.peakDate)}
            caption={`${formatNumber(summary.peakPassengers)} ผู้โดยสาร · ${formatWeekday(summary.peakDate)}`}
            accent="up"
          />
          <Figure
            label="วันที่เบาบางที่สุด"
            value={formatShortDate(summary.troughDate)}
            caption={`${formatNumber(summary.troughPassengers)} ผู้โดยสาร · ${formatWeekday(summary.troughDate)}`}
            accent="down"
          />
          <Figure
            label="ผลจากวันหยุด"
            value={formatSignedPercent(summary.holidayUplift, 0)}
            caption={`สุดสัปดาห์ ${formatSignedPercent(summary.weekendUplift, 0)} เทียบฐาน จ.–พฤ.`}
            accent="up"
          />
        </div>
      </CardContent>
    </Card>
  )
}
