import { useMemo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { DataTable } from '@/components/charts/ChartCard'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { toChannelSlices, type ChannelSlice } from '@/components/charts/channelSlices'
import { CHART_COLORS } from '@/components/charts/chartTheme'
import { CHANNEL_LABELS } from '@/data/constants'
import { formatCompact, formatCurrency, formatNumber, formatPercent } from '@/lib/format'
import { sum } from '@/lib/utils'
import type { ChannelMix } from '@/types/domain'

export function ChannelDonut({ mix }: { mix: readonly ChannelMix[] }) {
  const slices = useMemo(() => toChannelSlices(mix), [mix])
  const total = sum(slices.map((slice) => slice.value))

  return (
    <div className="relative h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="92%"
            paddingAngle={2}
            // A 2px surface ring separates segments — no borders on marks.
            stroke={CHART_COLORS.surface}
            strokeWidth={2}
            isAnimationActive={false}
          >
            {slices.map((slice) => (
              <Cell key={slice.name} fill={slice.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const slice = payload[0]?.payload as ChannelSlice | undefined
              if (!slice) return null

              return (
                <ChartTooltip
                  title={slice.name}
                  rows={[
                    {
                      label: 'สัดส่วนตั๋ว',
                      value: formatPercent(slice.share),
                      color: slice.color,
                    },
                    { label: 'จำนวนตั๋ว', value: formatNumber(slice.value), muted: true },
                    { label: 'รายได้', value: formatCurrency(slice.revenue), muted: true },
                  ]}
                  footer={slice.detail}
                />
              )
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Hero figure in the hole — proportional figures, system sans. */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-[26px] leading-none font-semibold tracking-[-0.02em] text-ink">
          {formatCompact(total)}
        </p>
        <p className="mt-1 text-[11px] text-ink-muted">ตั๋วที่ขายได้</p>
      </div>
    </div>
  )
}

export function ChannelTable({ mix }: { mix: readonly ChannelMix[] }) {
  return (
    <DataTable
      headers={['ช่องทาง', 'จำนวนตั๋ว', 'สัดส่วน', 'รายได้']}
      align={['left', 'right', 'right', 'right']}
      rows={mix.map((entry) => [
        CHANNEL_LABELS[entry.channel] ?? entry.channel,
        formatNumber(entry.tickets),
        formatPercent(entry.share),
        formatCurrency(entry.revenue),
      ])}
    />
  )
}
