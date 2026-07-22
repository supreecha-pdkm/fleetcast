import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap outline-none transition-[background-color,color,box-shadow,border-color] duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-ink text-plane shadow-card hover:bg-ink/88 active:bg-ink/95',
        secondary:
          'border border-hairline bg-surface-raised text-ink shadow-card hover:bg-surface-hover hover:border-hairline-strong',
        ghost: 'text-ink-secondary hover:bg-surface-hover hover:text-ink',
        ai: 'bg-ai-wash text-ai border border-ai/25 hover:border-ai/45 hover:bg-ai-wash',
      },
      size: {
        sm: 'h-8 px-2.5 text-[13px] [&_svg]:size-3.5',
        md: 'h-9 px-3.5 [&_svg]:size-4',
        icon: 'size-9 [&_svg]:size-4',
        'icon-sm': 'size-8 [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

export { buttonVariants }
