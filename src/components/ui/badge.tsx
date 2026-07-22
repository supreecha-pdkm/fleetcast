import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      tone: {
        neutral: 'border-hairline bg-surface-sunken text-ink-secondary',
        good: 'border-good/25 bg-good-wash text-good',
        warning: 'border-warning/35 bg-warning-wash text-warning',
        serious: 'border-serious/35 bg-serious-wash text-serious',
        critical: 'border-critical/25 bg-critical-wash text-critical',
        ai: 'border-ai/25 bg-ai-wash text-ai',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

export type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}

export { badgeVariants }
