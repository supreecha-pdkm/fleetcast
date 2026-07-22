import { useCallback, useSyncExternalStore } from 'react'

export type ThemePreference = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'fleetcast.theme'

/**
 * Theme lives in a tiny external store rather than context: it is read by a
 * handful of leaves and written by one control, so a provider would only add
 * a re-render boundary around the whole tree for no benefit.
 */
const listeners = new Set<() => void>()

function readPreference(): ThemePreference {
  if (typeof localStorage === 'undefined') return 'system'
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

let preference: ThemePreference = readPreference()

function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveTheme(pref: ThemePreference): ResolvedTheme {
  return pref === 'system' ? systemTheme() : pref
}

function applyToDocument(): void {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', resolveTheme(preference) === 'dark')
}

function emit(): void {
  applyToDocument()
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onSystemChange = (): void => {
    if (preference === 'system') emit()
  }
  media.addEventListener('change', onSystemChange)

  return () => {
    listeners.delete(listener)
    media.removeEventListener('change', onSystemChange)
  }
}

function getSnapshot(): ThemePreference {
  return preference
}

export function setThemePreference(next: ThemePreference): void {
  preference = next
  localStorage.setItem(STORAGE_KEY, next)
  emit()
}

/** Applied before first paint so the page never flashes the wrong theme. */
export function initTheme(): void {
  applyToDocument()
}

export interface UseThemeResult {
  readonly preference: ThemePreference
  readonly theme: ResolvedTheme
  readonly setPreference: (next: ThemePreference) => void
  readonly toggle: () => void
}

export function useTheme(): UseThemeResult {
  const pref = useSyncExternalStore(subscribe, getSnapshot, () => 'system' as const)
  const theme = resolveTheme(pref)

  const toggle = useCallback(() => {
    setThemePreference(resolveTheme(getSnapshot()) === 'dark' ? 'light' : 'dark')
  }, [])

  return { preference: pref, theme, setPreference: setThemePreference, toggle }
}
