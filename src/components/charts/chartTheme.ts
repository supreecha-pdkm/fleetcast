/**
 * Chart chrome, expressed as CSS custom properties so both themes resolve
 * from one declaration and Recharts' SVG re-paints on a theme switch with no
 * JS involved.
 *
 * The categorical slots are the validated palette order (blue → orange →
 * aqua → yellow). Slots are assigned by entity, never by rank, and never
 * cycled past the fourth.
 */
export const CHART_COLORS = {
  series1: 'var(--series-1)',
  series2: 'var(--series-2)',
  series3: 'var(--series-3)',
  series4: 'var(--series-4)',
  other: 'var(--series-other)',
  grid: 'var(--gridline)',
  axis: 'var(--axis)',
  muted: 'var(--ink-muted)',
  surface: 'var(--surface)',
  good: 'var(--status-good)',
  warning: 'var(--status-warning)',
  serious: 'var(--status-serious)',
  critical: 'var(--status-critical)',
} as const

/** Sequential blue ramp, light → dark, for continuous magnitude only. */
export const SEQUENTIAL_RAMP = [
  'var(--seq-100)',
  'var(--seq-200)',
  'var(--seq-300)',
  'var(--seq-400)',
  'var(--seq-500)',
  'var(--seq-600)',
  'var(--seq-700)',
] as const

export const AXIS_TICK = {
  fill: CHART_COLORS.muted,
  fontSize: 11,
} as const

/** Solid hairlines only — a dashed grid reads as a threshold it is not. */
export const GRID_PROPS = {
  stroke: CHART_COLORS.grid,
  strokeWidth: 1,
  vertical: false,
} as const

export const AXIS_PROPS = {
  stroke: CHART_COLORS.axis,
  strokeWidth: 1,
  tickLine: false,
  tick: AXIS_TICK,
} as const

export const CURSOR_PROPS = {
  stroke: CHART_COLORS.axis,
  strokeWidth: 1,
} as const

/** Line marks are 2px; markers are ≥8px so they are hoverable. */
export const LINE_WIDTH = 2
export const DOT_RADIUS = 4

/**
 * Legend for the actual-vs-forecast chart. Three entries: the observed
 * series, the model's projection, and its uncertainty band.
 */
export const FORECAST_LEGEND = [
  { label: 'ค่าจริง', color: CHART_COLORS.series1, variant: 'solid' as const },
  { label: 'ค่าพยากรณ์', color: CHART_COLORS.series2, variant: 'dashed' as const },
  { label: 'ช่วงความเชื่อมั่น 80%', color: CHART_COLORS.series2, variant: 'band' as const },
]
