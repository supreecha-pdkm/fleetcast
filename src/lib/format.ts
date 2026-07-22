/**
 * Thai reads magnitude in its own units (พัน / หมื่น / แสน / ล้าน), so the
 * long compact display is used rather than the "K"/"M" abbreviations `th-TH`
 * falls back to in short form.
 */
const compactNumber = new Intl.NumberFormat('th-TH', {
  notation: 'compact',
  compactDisplay: 'long',
  maximumFractionDigits: 1,
})

const plainNumber = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 })

const compactCurrency = new Intl.NumberFormat('th-TH', {
  notation: 'compact',
  compactDisplay: 'long',
  maximumFractionDigits: 2,
})

export function formatNumber(value: number): string {
  return plainNumber.format(Math.round(value))
}

export function formatCompact(value: number): string {
  return compactNumber.format(value)
}

/** Thai baht. Compact above 100k so KPI tiles never wrap. */
export function formatCurrency(value: number, compact = false): string {
  if (compact || Math.abs(value) >= 100_000) return `฿${compactCurrency.format(value)}`
  return `฿${plainNumber.format(value)}`
}

export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`
}

export function formatSignedPercent(ratio: number, digits = 1): string {
  const sign = ratio > 0 ? '+' : ''
  return `${sign}${(ratio * 100).toFixed(digits)}%`
}

export function formatSignedCurrency(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${formatCurrency(Math.abs(value), true)}`
}

export type MetricFormat = 'number' | 'percent' | 'currency' | 'count'

export function formatMetric(value: number, format: MetricFormat): string {
  switch (format) {
    case 'percent':
      return formatPercent(value)
    case 'currency':
      return formatCurrency(value)
    case 'count':
      return formatNumber(value)
    case 'number':
      return value >= 10_000 ? formatCompact(value) : formatNumber(value)
  }
}
