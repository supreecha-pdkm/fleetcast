import { CHART_COLORS } from '@/components/charts/chartTheme'
import { CHANNEL_LABELS } from '@/data/constants'
import { formatPercent } from '@/lib/format'
import { sum } from '@/lib/utils'
import type { ChannelMix } from '@/types/domain'

/**
 * Part-to-whole at a glance is capped at three named slices plus "Other":
 * a pie is read across all pairs at once, and only the first three
 * categorical slots clear the all-pairs colour-separation gate.
 */
const TOP_SLICES = 3

const SLICE_COLORS = [CHART_COLORS.series1, CHART_COLORS.series2, CHART_COLORS.series3] as const

export interface ChannelSlice {
  readonly name: string
  readonly value: number
  readonly revenue: number
  readonly share: number
  readonly color: string
  /** Breakdown of what was folded into "Other", for the tooltip. */
  readonly detail: string | null
}

export function toChannelSlices(mix: readonly ChannelMix[]): ChannelSlice[] {
  const named = mix.slice(0, TOP_SLICES).map((entry, i) => ({
    name: CHANNEL_LABELS[entry.channel] ?? entry.channel,
    value: entry.tickets,
    revenue: entry.revenue,
    share: entry.share,
    color: SLICE_COLORS[i] ?? CHART_COLORS.other,
    detail: null,
  }))

  const rest = mix.slice(TOP_SLICES)
  if (rest.length === 0) return named

  return [
    ...named,
    {
      name: 'ช่องทางอื่น ๆ',
      value: sum(rest.map((entry) => entry.tickets)),
      revenue: sum(rest.map((entry) => entry.revenue)),
      share: sum(rest.map((entry) => entry.share)),
      color: CHART_COLORS.other,
      detail: rest
        .map(
          (entry) =>
            `${CHANNEL_LABELS[entry.channel] ?? entry.channel} ${formatPercent(entry.share, 0)}`,
        )
        .join(' · '),
    },
  ]
}

/** Legend entries mirror the slices exactly — same order, same colours. */
export function channelLegend(mix: readonly ChannelMix[]) {
  return toChannelSlices(mix).map((slice) => ({
    label: `${slice.name} ${formatPercent(slice.share, 0)}`,
    color: slice.color,
    variant: 'solid' as const,
  }))
}
