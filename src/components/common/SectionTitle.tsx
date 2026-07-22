import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export interface SectionTitleProps {
  readonly title: string
  readonly description?: string
  readonly icon?: LucideIcon
  readonly actions?: ReactNode
  readonly className?: string
}

export function SectionTitle({
  title,
  description,
  icon: Icon,
  actions,
  className,
}: SectionTitleProps) {
  return (
    <div className={cn('flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="size-4 shrink-0 text-ink-muted" strokeWidth={2} /> : null}
          <h2 className="text-[13px] font-semibold tracking-[0.06em] text-ink uppercase">
            {title}
          </h2>
        </div>
        {description ? (
          <p className="mt-1 text-[13px] leading-5 text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}
