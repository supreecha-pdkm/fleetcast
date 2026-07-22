import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export const Tabs = TabsPrimitive.Root

export function TabsList({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'inline-flex h-8 items-center gap-0.5 rounded-lg border border-hairline bg-surface-sunken p-0.5',
        className,
      )}
      {...props}
    />
  )
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-medium whitespace-nowrap text-ink-muted transition-colors duration-150',
        'hover:text-ink-secondary',
        'data-[state=active]:bg-surface-raised data-[state=active]:text-ink data-[state=active]:shadow-card',
        '[&_svg]:size-3.5',
        className,
      )}
      {...props}
    />
  )
}

export function TabsContent({ className, ...props }: ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('outline-none', className)} {...props} />
}
