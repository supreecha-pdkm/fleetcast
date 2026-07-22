import { AlertTriangle, CheckCircle2, CircleAlert } from 'lucide-react'

import { ROUTE_STATUS_LABEL } from '@/components/common/severity'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { RouteStatus } from '@/types/domain'

const STATUS_CONFIG = {
  healthy: { label: ROUTE_STATUS_LABEL.healthy, tone: 'good', Icon: CheckCircle2, dot: 'bg-good' },
  warning: {
    label: ROUTE_STATUS_LABEL.warning,
    tone: 'warning',
    Icon: AlertTriangle,
    dot: 'bg-warning',
  },
  critical: {
    label: ROUTE_STATUS_LABEL.critical,
    tone: 'critical',
    Icon: CircleAlert,
    dot: 'bg-critical',
  },
} as const satisfies Record<RouteStatus, unknown>

/** Status is always icon + label, never colour on its own. */
export function StatusBadge({ status, label }: { status: RouteStatus; label?: string }) {
  const { tone, Icon, label: fallback } = STATUS_CONFIG[status]
  return (
    <Badge tone={tone}>
      <Icon aria-hidden />
      {label ?? fallback}
    </Badge>
  )
}

export function StatusDot({ status, className }: { status: RouteStatus; className?: string }) {
  return (
    <span
      className={cn(
        'inline-block size-1.5 shrink-0 rounded-full',
        STATUS_CONFIG[status].dot,
        className,
      )}
      aria-hidden
    />
  )
}
