import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'

import { formatSignedPercent } from '@/lib/format'
import { cn } from '@/lib/utils'

export interface TrendPillProps {
  readonly delta: number
  readonly direction: 'up' | 'down' | 'flat'
  readonly intent: 'positive' | 'negative' | 'neutral'
  readonly label?: string
  readonly className?: string
}

const INTENT_CLASS: Record<TrendPillProps['intent'], string> = {
  positive: 'text-delta-up',
  negative: 'text-delta-down',
  neutral: 'text-ink-muted',
}

/**
 * Direction is carried by the arrow glyph as well as the colour, so the sign
 * of a change never depends on hue alone.
 */
export function TrendPill({ delta, direction, intent, label, className }: TrendPillProps) {
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus

  return (
    <span className={cn('inline-flex items-baseline gap-1 text-[12px] font-medium', className)}>
      <span className={cn('inline-flex items-center gap-0.5', INTENT_CLASS[intent])}>
        <Icon className="size-3 shrink-0 self-center" strokeWidth={2.5} aria-hidden />
        <span className="tnum">{direction === 'flat' ? '0.0%' : formatSignedPercent(delta)}</span>
      </span>
      {label ? <span className="font-normal text-ink-muted">{label}</span> : null}
    </span>
  )
}
