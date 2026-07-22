import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

export const Select = SelectPrimitive.Root
export const SelectValue = SelectPrimitive.Value

export function SelectTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      className={cn(
        'inline-flex h-8 items-center justify-between gap-2 rounded-lg border border-hairline bg-surface-raised px-2.5 text-[13px] font-medium whitespace-nowrap text-ink shadow-card transition-colors duration-150 outline-none',
        'hover:border-hairline-strong hover:bg-surface-hover',
        'data-[placeholder]:text-ink-muted',
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown className="size-3.5 text-ink-muted" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
}

export function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        position={position}
        sideOffset={4}
        className={cn(
          'z-50 min-w-[--radix-select-trigger-width] overflow-hidden rounded-lg border border-hairline bg-surface-raised p-1 shadow-overlay',
          'data-[state=open]:animate-rise',
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
}

export function SelectItem({
  className,
  children,
  ...props
}: ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      className={cn(
        'relative flex h-8 cursor-pointer items-center gap-2 rounded-md pr-2 pl-7 text-[13px] text-ink-secondary outline-none select-none',
        'data-[highlighted]:bg-surface-hover data-[highlighted]:text-ink',
        'data-[state=checked]:font-medium data-[state=checked]:text-ink',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-3.5" strokeWidth={2.5} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
}
