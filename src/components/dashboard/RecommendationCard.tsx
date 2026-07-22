import { BusFront, Check, Eye, Minus, Percent, TrendingUp, type LucideIcon } from 'lucide-react'
import { useState } from 'react'

import {
  SEVERITY_CHIP,
  SEVERITY_DOT,
  SEVERITY_LABEL,
  SEVERITY_TONE,
} from '@/components/common/severity'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatShortDate } from '@/lib/date'
import { formatCurrency, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Recommendation, RecommendationAction } from '@/types/domain'

const ACTION_META: Record<
  RecommendationAction,
  { Icon: LucideIcon; label: string; valueLabel: string }
> = {
  increase_capacity: { Icon: BusFront, label: 'เพิ่มรถ', valueLabel: 'รายได้ที่เสี่ยงสูญเสีย' },
  reduce_capacity: { Icon: Minus, label: 'ลดรถ', valueLabel: 'ต้นทุนที่ประหยัดได้' },
  watch_closely: { Icon: Eye, label: 'เฝ้าติดตาม', valueLabel: 'ยังไม่ต้องดำเนินการ' },
  promotion: { Icon: Percent, label: 'โปรโมชัน', valueLabel: 'โอกาสเพิ่มรายได้' },
  reprice: { Icon: TrendingUp, label: 'ปรับราคา', valueLabel: 'โอกาสเพิ่มรายได้' },
}

export function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const [accepted, setAccepted] = useState(false)
  const { Icon, label, valueLabel } = ACTION_META[recommendation.action]

  return (
    <article
      className={cn(
        'group relative rounded-lg border border-hairline bg-surface p-3.5',
        'transition-[border-color,box-shadow,opacity] duration-200 hover:border-hairline-strong hover:shadow-card',
        accepted && 'opacity-70',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg',
            SEVERITY_CHIP[recommendation.severity],
          )}
          aria-hidden
        >
          <Icon className="size-4" strokeWidth={2} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h4 className="text-[13px] font-semibold text-ink">{recommendation.title}</h4>
            <Badge tone={SEVERITY_TONE[recommendation.severity]}>
              <span
                className={cn('size-1.5 rounded-full', SEVERITY_DOT[recommendation.severity])}
                aria-hidden
              />
              {SEVERITY_LABEL[recommendation.severity]}
            </Badge>
            <Badge tone="neutral">{label}</Badge>
          </div>

          <p className="mt-1.5 text-[12px] leading-5 text-ink-secondary">
            {recommendation.rationale}
          </p>

          <p className="mt-2 text-[12px] leading-5 font-medium text-ink">
            → {recommendation.impact}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-muted">
            {recommendation.revenueImpact > 0 ? (
              <span>
                {valueLabel}{' '}
                <span className="tnum font-semibold text-ink">
                  {formatCurrency(recommendation.revenueImpact)}
                </span>
              </span>
            ) : null}
            <span>
              ความเชื่อมั่น{' '}
              <span className="tnum font-medium text-ink-secondary">
                {formatPercent(recommendation.confidence, 0)}
              </span>
            </span>
            <span>เริ่ม {formatShortDate(recommendation.effectiveFrom)}</span>
          </div>
        </div>

        <div className="shrink-0">
          {accepted ? (
            <Badge tone="good">
              <Check aria-hidden />
              รับเข้าแผนแล้ว
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              className="opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100"
              onClick={() => setAccepted(true)}
            >
              รับข้อเสนอ
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
