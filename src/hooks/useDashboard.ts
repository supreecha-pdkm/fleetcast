import { useCallback, useEffect, useRef, useState } from 'react'

import {
  ALL_ROUTES,
  DEFAULT_FILTERS,
  fetchDashboard,
  type DashboardFilters,
} from '@/services/repository'
import type { DashboardSnapshot } from '@/types/domain'

export interface UseDashboardResult {
  readonly snapshot: DashboardSnapshot | null
  readonly filters: DashboardFilters
  readonly setFilters: (next: Partial<DashboardFilters>) => void
  /** True only before the first payload — the one time skeletons are shown. */
  readonly isLoading: boolean
  /** True while re-querying with a payload already on screen. */
  readonly isRefreshing: boolean
}

/**
 * Owns the dashboard query. Re-queries whenever the filters change and keeps
 * the previous snapshot mounted during a refetch, so the layout never
 * collapses back to skeletons once data has been seen.
 */
export function useDashboard(): UseDashboardResult {
  const [filters, setFiltersState] = useState<DashboardFilters>(DEFAULT_FILTERS)
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const hasLoaded = useRef(false)

  useEffect(() => {
    let cancelled = false
    if (hasLoaded.current) setIsRefreshing(true)

    void fetchDashboard(filters, { delayMs: hasLoaded.current ? 420 : 900 }).then((result) => {
      if (cancelled) return
      hasLoaded.current = true
      setSnapshot(result)
      setIsRefreshing(false)
    })

    return () => {
      cancelled = true
    }
  }, [filters])

  // Changing region invalidates the selected route, so the reset lives here
  // rather than in the filter row — and lands in the same state update, so a
  // region change still costs exactly one refetch.
  const setFilters = useCallback((next: Partial<DashboardFilters>) => {
    setFiltersState((current) => {
      const merged = { ...current, ...next }
      if (next.region !== undefined && next.region !== current.region) {
        return { ...merged, routeId: ALL_ROUTES }
      }
      return merged
    })
  }, [])

  return {
    snapshot,
    filters,
    setFilters,
    isLoading: snapshot === null,
    isRefreshing,
  }
}
