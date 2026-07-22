import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function sum(values: readonly number[]): number {
  return values.reduce((acc, v) => acc + v, 0)
}

export function mean(values: readonly number[]): number {
  return values.length === 0 ? 0 : sum(values) / values.length
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
    : (sorted[mid] ?? 0)
}

/** Groups items by a derived key, preserving insertion order of first sight. */
export function groupBy<T, K extends string>(
  items: readonly T[],
  keyOf: (item: T) => K,
): Map<K, T[]> {
  const out = new Map<K, T[]>()
  for (const item of items) {
    const key = keyOf(item)
    const bucket = out.get(key)
    if (bucket) bucket.push(item)
    else out.set(key, [item])
  }
  return out
}

export function sortBy<T>(items: readonly T[], valueOf: (item: T) => number, dir: 1 | -1 = 1): T[] {
  return [...items].sort((a, b) => (valueOf(a) - valueOf(b)) * dir)
}

/** Percentage change from `previous` to `current`, guarded against /0. */
export function pctChange(current: number, previous: number): number {
  if (previous === 0) return current === 0 ? 0 : 1
  return (current - previous) / previous
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
