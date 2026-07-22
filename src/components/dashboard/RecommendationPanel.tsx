import { Sparkles, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'

import { EmptyState } from '@/components/common/EmptyState'
import { RecommendationCard } from '@/components/dashboard/RecommendationCard'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { recommendationValue } from '@/services/recommendations'
import type { Recommendation, RecommendationAction } from '@/types/domain'

type Group = 'all' | 'capacity' | 'commercial'

const GROUPS: Record<Group, readonly RecommendationAction[]> = {
  all: ['increase_capacity', 'reduce_capacity', 'watch_closely', 'promotion', 'reprice'],
  capacity: ['increase_capacity', 'reduce_capacity', 'watch_closely'],
  commercial: ['promotion', 'reprice'],
}

export function RecommendationPanel({
  recommendations,
  dimmed = false,
  className,
}: {
  recommendations: readonly Recommendation[]
  dimmed?: boolean
  className?: string
}) {
  const [group, setGroup] = useState<Group>('all')

  const visible = useMemo(
    () => recommendations.filter((r) => GROUPS[group].includes(r.action)),
    [recommendations, group],
  )
  const value = useMemo(() => recommendationValue(visible), [visible])

  return (
    <Card className={cn('flex flex-col overflow-hidden', className)}>
      <CardHeader className="flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-ai-wash text-ai">
              <Sparkles className="size-3.5" strokeWidth={2} aria-hidden />
            </span>
            <h3 className="text-[15px] leading-6 font-semibold tracking-[-0.01em] text-ink">
              ข้อเสนอแนะจาก AI
            </h3>
          </div>
          <p className="mt-1 text-[13px] leading-5 text-ink-muted">
            {visible.length} รายการ เรียงตามระดับความเร่งด่วน
            แล้วจึงตามมูลค่าถ่วงน้ำหนักด้วยความเชื่อมั่น — มูลค่าที่เกี่ยวข้อง{' '}
            <span className="font-medium text-ink-secondary">{formatCurrency(value)}</span>
          </p>
        </div>

        <Tabs value={group} onValueChange={(v) => setGroup(v as Group)}>
          <TabsList aria-label="ประเภทข้อเสนอแนะ">
            <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
            <TabsTrigger value="capacity">เดินรถ</TabsTrigger>
            <TabsTrigger value="commercial">การพาณิชย์</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>

      <CardContent
        className={cn('flex-1 pt-0 transition-opacity duration-300', dimmed && 'opacity-45')}
      >
        {visible.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="ไม่มีรายการที่ต้องดำเนินการ"
            description="ทุกเที่ยวรถในขอบเขตนี้อยู่ในเกณฑ์อัตราบรรทุกเป้าหมาย โมเดลจะตรวจสอบอีกครั้งในการรันรอบถัดไป"
          />
        ) : (
          <ScrollArea className="h-[430px] pr-3">
            <div className="space-y-2.5">
              {visible.map((recommendation) => (
                <RecommendationCard key={recommendation.id} recommendation={recommendation} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
