import { useId } from 'react'

export interface SparklineProps {
  readonly values: readonly number[]
  readonly width?: number
  readonly height?: number
  readonly stroke?: string
  readonly className?: string
}

/**
 * Decorative trend glyph for a stat tile. It carries no readable values — the
 * tile's number and the KPI table do — so it has no axes, labels or tooltip.
 */
export function Sparkline({
  values,
  width = 96,
  height = 28,
  stroke = 'var(--series-1)',
  className,
}: SparklineProps) {
  const gradientId = useId()

  if (values.length < 2) return <div style={{ width, height }} className={className} aria-hidden />

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const step = width / (values.length - 1)
  const pad = 2

  const points = values.map((value, i) => {
    const x = i * step
    const y = height - pad - ((value - min) / span) * (height - pad * 2)
    return [x, y] as const
  })

  const line = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  const last = points.at(-1)

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.18} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {last ? <circle cx={last[0]} cy={last[1]} r={2} fill={stroke} /> : null}
    </svg>
  )
}
