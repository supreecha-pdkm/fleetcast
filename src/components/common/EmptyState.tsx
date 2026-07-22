import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface EmptyStateProps {
  readonly title: string
  readonly description?: string
  readonly icon?: LucideIcon
  readonly action?: ReactNode
  readonly className?: string
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-hairline px-6 py-10 text-center',
        className,
      )}
    >
      <div className="mb-3 rounded-full bg-surface-sunken p-2.5 text-ink-muted">
        <Icon className="size-4" strokeWidth={2} aria-hidden />
      </div>
      <p className="text-[13px] font-medium text-ink">{title}</p>
      {description ? (
        <p className="mt-1 max-w-xs text-[13px] leading-5 text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
