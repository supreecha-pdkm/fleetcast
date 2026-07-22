import { AlertTriangle, CheckCircle2, CircleAlert, type LucideIcon } from 'lucide-react'

import { ROUTE_STATUS_LABEL } from '@/components/common/severity'
import { Card } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { LOAD_FACTOR_THRESHOLDS } from '@/data/constants'
import { formatNumber, formatPercent } from '@/lib/format'
import { cn } from '@/lib/utils'
import { statusReason } from '@/services/analytics'
import type { RouteForecast, RouteStatus } from '@/types/domain'

const CONFIG: Record<
  RouteStatus,
  { label: string; Icon: LucideIcon; chip: string; rail: string; blurb: string }
> = {
  healthy: {
    label: ROUTE_STATUS_LABEL.healthy,
    Icon: CheckCircle2,
    chip: 'bg-good-wash text-good',
    rail: 'bg-good',
    blurb: `อัตราบรรทุกอยู่ในเกณฑ์เป้าหมาย ${Math.round(LOAD_FACTOR_THRESHOLDS.underUtilised * 100)}–${Math.round(LOAD_FACTOR_THRESHOLDS.atRisk * 100)}%`,
  },
  warning: {
    label: ROUTE_STATUS_LABEL.warning,
    Icon: AlertTriangle,
    chip: 'bg-warning-wash text-warning',
    rail: 'bg-warning',
    blurb: 'กำลังเข้าใกล้เพดานความจุ หรือต่ำกว่าระดับที่ทำกำไรได้',
  },
  critical: {
    label: ROUTE_STATUS_LABEL.critical,
    Icon: CircleAlert,
    chip: 'bg-critical-wash text-critical',
    rail: 'bg-critical',
    blurb: 'ต้องปฏิเสธผู้โดยสาร หรือเดินรถเกือบว่างเปล่า',
  },
}

const ORDER: readonly RouteStatus[] = ['critical', 'warning', 'healthy']

function reasonLabel(loadFactor: number): string {
  const reason = statusReason(loadFactor)
  if (reason === 'over') return 'เต็มความจุ'
  if (reason === 'under') return 'ใช้ไม่เต็มศักยภาพ'
  return 'อยู่ในเป้าหมาย'
}

/**
 * Route health rolled up to three states. Each state is a card so the counts
 * are readable at a glance, with the individual routes listed as chips.
 */
export function RouteStatusBoard({
  forecasts,
  dimmed = false,
}: {
  forecasts: readonly RouteForecast[]
  dimmed?: boolean
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 transition-opacity duration-300 sm:grid-cols-3',
        dimmed && 'opacity-45',
      )}
    >
      {ORDER.map((status) => {
        const { label, Icon, chip, rail, blurb } = CONFIG[status]
        const routes = forecasts.filter((f) => f.status === status)

        return (
          <Card key={status} className="relative overflow-hidden p-4">
            <span className={cn('absolute inset-y-0 left-0 w-0.5', rail)} aria-hidden />

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn('flex size-6 items-center justify-center rounded-md', chip)}
                  aria-hidden
                >
                  <Icon className="size-3.5" strokeWidth={2} />
                </span>
                <span className="text-[13px] font-semibold text-ink">{label}</span>
              </div>
              <span className="text-[22px] leading-none font-semibold tracking-[-0.02em] text-ink">
                {routes.length}
              </span>
            </div>

            <p className="mt-2 text-[11px] leading-4 text-ink-muted">{blurb}</p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {routes.length === 0 ? (
                <span className="text-[11px] text-ink-muted italic">ไม่มีเส้นทาง</span>
              ) : (
                routes.map((forecast) => (
                  <Tooltip key={forecast.route.id}>
                    <TooltipTrigger asChild>
                      <span
                        tabIndex={0}
                        className="tnum cursor-default rounded-md border border-hairline bg-surface-sunken px-1.5 py-0.5 text-[11px] font-medium text-ink-secondary transition-colors duration-150 hover:border-hairline-strong hover:text-ink"
                      >
                        {forecast.route.code}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-semibold">{forecast.route.name}</p>
                      <p className="mt-1 text-ink-secondary">
                        อัตราบรรทุกที่พยากรณ์ {formatPercent(forecast.predictedLoadFactor)} —{' '}
                        {reasonLabel(forecast.predictedLoadFactor)}
                      </p>
                      <p className="mt-0.5 text-ink-muted">
                        {formatNumber(forecast.predictedPassengers)} ผู้โดยสาร ·{' '}
                        {forecast.route.distanceKm} กม.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                ))
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}
