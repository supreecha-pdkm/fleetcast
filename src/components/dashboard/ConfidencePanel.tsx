import { Activity, Info, Target } from 'lucide-react'

import { CHART_COLORS } from '@/components/charts/chartTheme'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { InfoTip } from '@/components/ui/tooltip'
import { formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { ConfidenceBreakdown, ModelMeta } from '@/types/domain'

const GAUGE_SIZE = 120
const STROKE = 9

/** Single-value arc. The number is the chart; the arc is the frame around it. */
function ConfidenceGauge({ value }: { value: number }) {
  const radius = (GAUGE_SIZE - STROKE) / 2
  const circumference = Math.PI * radius * 1.5
  const offset = circumference * (1 - value)

  return (
    <div className="relative shrink-0" style={{ width: GAUGE_SIZE, height: GAUGE_SIZE * 0.78 }}>
      <svg
        width={GAUGE_SIZE}
        height={GAUGE_SIZE}
        viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
        className="absolute inset-0"
        aria-hidden
      >
        <g transform={`rotate(135 ${GAUGE_SIZE / 2} ${GAUGE_SIZE / 2})`}>
          <circle
            cx={GAUGE_SIZE / 2}
            cy={GAUGE_SIZE / 2}
            r={radius}
            fill="none"
            stroke={CHART_COLORS.grid}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference * 4}`}
          />
          <circle
            cx={GAUGE_SIZE / 2}
            cy={GAUGE_SIZE / 2}
            r={radius}
            fill="none"
            stroke="var(--accent-forecast)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference * 4}`}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700 ease-out"
          />
        </g>
      </svg>
      <div className="absolute inset-x-0 top-[38%] flex flex-col items-center">
        <span className="text-[26px] leading-none font-semibold tracking-[-0.02em] text-ink">
          {formatPercent(value, 0)}
        </span>
        <span className="mt-1 text-[11px] text-ink-muted">ความเชื่อมั่น</span>
      </div>
    </div>
  )
}

interface StatProps {
  readonly label: string
  readonly value: string
  readonly hint: string
}

function Stat({ label, value, hint }: StatProps) {
  return (
    <InfoTip label={hint}>
      <div className="cursor-help">
        <p className="text-[11px] text-ink-muted">{label}</p>
        <p className="tnum mt-0.5 text-[15px] font-semibold text-ink">{value}</p>
      </div>
    </InfoTip>
  )
}

export function ConfidencePanel({
  confidence,
  model,
  dimmed = false,
  className,
}: {
  confidence: ConfidenceBreakdown
  model: ModelMeta
  dimmed?: boolean
  className?: string
}) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <div>
          <div className="flex items-center gap-2">
            <Target className="size-4 text-ink-muted" strokeWidth={2} aria-hidden />
            <h3 className="text-[15px] leading-6 font-semibold tracking-[-0.01em] text-ink">
              ความเชื่อมั่นของแบบจำลอง
            </h3>
            <InfoTip label="วิธีคำนวณ 5 ขั้น — (1) ดัชนีฤดูกาลรายวันในสัปดาห์แบบเฉลี่ยรวมทุกเส้นทาง (2) แนวโน้มถดถอยเชิงเส้นด้วย OLS บนข้อมูลที่ถอดฤดูกาลออกแล้ว หน่วงด้วยตัวประกอบ 0.94 ต่อวัน (3) ตัวคูณวันหยุดจากปฏิทิน (4) ช่วงพยากรณ์ 80% จากส่วนเบี่ยงเบนของค่าคลาดเคลื่อน กว้างขึ้นตามรากที่สองของระยะพยากรณ์ (5) ทดสอบย้อนหลังบน 7 วันสุดท้าย ไม่มีการเรียกใช้ AI หรือ machine learning ใด ๆ">
              <button
                type="button"
                aria-label="วิธีคำนวณความเชื่อมั่น"
                className="cursor-help text-ink-muted transition-colors duration-150 hover:text-ink-secondary"
              >
                <Info className="size-3.5" strokeWidth={2} aria-hidden />
              </button>
            </InfoTip>
          </div>
          <p className="mt-0.5 text-[13px] leading-5 text-ink-muted">
            คำนวณด้วยสถิติล้วน วัดจริงจากชุดทดสอบแบบเลื่อน 7 วัน ไม่ใช่ค่าที่กำหนดขึ้นเอง
          </p>
        </div>
      </CardHeader>

      <CardContent className={cn('flex-1 transition-opacity duration-300', dimmed && 'opacity-45')}>
        <div className="flex flex-wrap items-center gap-6">
          <ConfidenceGauge value={confidence.overall} />

          <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4">
            <Stat
              label="ความแม่นยำ"
              value={formatPercent(confidence.accuracy)}
              hint="1 − MAPE บนชุดทดสอบ 7 วันล่าสุด"
            />
            <Stat
              label="MAPE"
              value={formatPercent(confidence.mape)}
              hint="ค่าความคลาดเคลื่อนสัมบูรณ์เฉลี่ยเป็นเปอร์เซ็นต์ ระดับรายวันทั้งเครือข่าย"
            />
            <Stat
              label="ครอบคลุมช่วงความเชื่อมั่น"
              value={formatPercent(confidence.coverage, 0)}
              hint="สัดส่วนค่าจริงในชุดทดสอบที่ตกอยู่ในช่วงพยากรณ์ 80%"
            />
            <Stat
              label="ค่าเบี่ยงเบน"
              value={`${(confidence.drift * 100).toFixed(2)} จุด`}
              hint="ค่าความคลาดเคลื่อนที่เปลี่ยนไปเทียบกับรอบประเมินก่อนหน้า หากเกิน 1.5 จุดจะเข้าสู่การทบทวนเพื่อเทรนโมเดลใหม่"
            />
          </div>
        </div>

        <div className="mt-5 border-t border-hairline pt-4">
          <p className="mb-3 flex items-center gap-1.5 text-[11px] font-medium tracking-[0.02em] text-ink-muted uppercase">
            <Activity className="size-3.5" aria-hidden />
            ความเชื่อมั่นตามช่วงพยากรณ์
          </p>

          <div className="space-y-2">
            {confidence.horizonDecay.map((entry) => (
              <div key={entry.horizon} className="flex items-center gap-3">
                <span className="tnum w-12 shrink-0 text-[11px] text-ink-muted">
                  {entry.horizon}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{
                      width: `${entry.confidence * 100}%`,
                      backgroundColor: 'var(--accent-forecast)',
                    }}
                  />
                </div>
                <span className="tnum w-10 shrink-0 text-right text-[11px] text-ink-secondary">
                  {formatPercent(entry.confidence, 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>

      <div className="border-t border-hairline px-5 py-3 text-[11px] leading-4 text-ink-muted">
        {model.algorithm} · {model.seriesFitted} ชุดข้อมูลอนุกรมเวลา ·{' '}
        {model.trainingRows.toLocaleString('th-TH')} แถวข้อมูลที่ใช้คำนวณ
      </div>
    </Card>
  )
}
