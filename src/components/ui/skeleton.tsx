import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      aria-hidden
      className={cn('animate-shimmer rounded-md bg-surface-sunken', className)}
      {...props}
    />
  )
}
