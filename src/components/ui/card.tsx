import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export function Card({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'card-sheen rounded-xl border border-hairline bg-surface shadow-card',
        'transition-shadow duration-200',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex items-start justify-between gap-4 px-5 pt-4 pb-3', className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: ComponentProps<'h3'>) {
  return (
    <h3
      className={cn('text-[15px] leading-6 font-semibold tracking-[-0.01em] text-ink', className)}
      {...props}
    />
  )
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('mt-0.5 text-[13px] leading-5 text-ink-muted', className)} {...props} />
}

export function CardContent({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('px-5 pb-5', className)} {...props} />
}

export function CardFooter({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      className={cn('border-t border-hairline px-5 py-3 text-[13px] text-ink-muted', className)}
      {...props}
    />
  )
}
