/**
 * Deterministic PRNG. The mock dataset must be byte-identical on every reload,
 * otherwise every number on the dashboard would drift between demo runs.
 */

/** mulberry32 — small, fast, good enough distribution for synthetic data. */
export function createRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface Rng {
  next: () => number
  between: (min: number, max: number) => number
  int: (min: number, max: number) => number
  /** Box–Muller normal deviate — gives realistic noise instead of flat jitter. */
  normal: (mean?: number, stdDev?: number) => number
  bool: (probability: number) => boolean
  pick: <T>(items: readonly T[]) => T
  /** Picks from `items` using parallel `weights`. */
  weighted: <T>(items: readonly T[], weights: readonly number[]) => T
}

export function createRandom(seed: number): Rng {
  const next = createRng(seed)

  const between = (min: number, max: number): number => min + next() * (max - min)

  const normal = (mu = 0, sigma = 1): number => {
    const u = Math.max(next(), Number.EPSILON)
    const v = next()
    return mu + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  }

  const pick = <T>(items: readonly T[]): T => {
    const item = items[Math.floor(next() * items.length)]
    if (item === undefined) throw new Error('rng.pick called with an empty list')
    return item
  }

  const weighted = <T>(items: readonly T[], weights: readonly number[]): T => {
    const total = weights.reduce((acc, w) => acc + w, 0)
    let threshold = next() * total
    for (let i = 0; i < items.length; i += 1) {
      threshold -= weights[i] ?? 0
      if (threshold <= 0) {
        const item = items[i]
        if (item !== undefined) return item
      }
    }
    return pick(items)
  }

  return {
    next,
    between,
    int: (min, max) => Math.floor(between(min, max + 1)),
    normal,
    bool: (probability) => next() < probability,
    pick,
    weighted,
  }
}
