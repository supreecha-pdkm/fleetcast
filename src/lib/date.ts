import type { DayOfWeek } from '@/types/domain'

const DAY_NAMES: readonly DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const MS_PER_DAY = 86_400_000

/** ISO date (`YYYY-MM-DD`) in UTC — the canonical key for every daily series. */
export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function parseIsoDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * MS_PER_DAY)
}

export function shiftIso(iso: string, days: number): string {
  return toIsoDate(addDays(parseIsoDate(iso), days))
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseIsoDate(a).getTime() - parseIsoDate(b).getTime()) / MS_PER_DAY)
}

export function dayOfWeek(iso: string): DayOfWeek {
  return DAY_NAMES[parseIsoDate(iso).getUTCDay()] ?? 'Mon'
}

export function isWeekend(iso: string): boolean {
  const day = parseIsoDate(iso).getUTCDay()
  return day === 0 || day === 6
}

/** Inclusive range of ISO dates. */
export function dateRange(startIso: string, days: number): string[] {
  return Array.from({ length: days }, (_, i) => shiftIso(startIso, i))
}

/**
 * Every user-facing date is rendered in Thai. `th-TH` resolves to the
 * Buddhist calendar by default, which is what a Thai operations team reads —
 * so 2026 shows as ๒๕๖๙ / 2569 without any manual offset.
 */
const shortDate = new Intl.DateTimeFormat('th-TH', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

const longDate = new Intl.DateTimeFormat('th-TH', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const weekdayFormat = new Intl.DateTimeFormat('th-TH', {
  weekday: 'short',
  timeZone: 'UTC',
})

export function formatShortDate(iso: string): string {
  return shortDate.format(parseIsoDate(iso))
}

export function formatLongDate(iso: string): string {
  return longDate.format(parseIsoDate(iso))
}

/** Thai short weekday ("จ.", "อ.", …) — used as a caption beside a date. */
export function formatWeekday(iso: string): string {
  return weekdayFormat.format(parseIsoDate(iso))
}

/** "2 ชม. ที่แล้ว" / "เมื่อสักครู่" — for the forecast-update feed. */
export function formatRelative(isoTimestamp: string, now: Date): string {
  const deltaMinutes = Math.round((now.getTime() - new Date(isoTimestamp).getTime()) / 60_000)
  if (deltaMinutes < 1) return 'เมื่อสักครู่'
  if (deltaMinutes < 60) return `${deltaMinutes} นาทีที่แล้ว`
  const hours = Math.floor(deltaMinutes / 60)
  if (hours < 24) return `${hours} ชม. ที่แล้ว`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'เมื่อวานนี้' : `${days} วันที่แล้ว`
}

const clockFormat = new Intl.DateTimeFormat('th-TH', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: 'Asia/Bangkok',
})

export function formatClock(date: Date): string {
  return clockFormat.format(date)
}

export function formatTimestamp(date: Date): string {
  return `${longDate.format(date)} · ${clockFormat.format(date)} น.`
}
