/**
 * Theme Plugin - Theme initialization plugin
 * Prevents FOUC by applying theme before mount
 */

const STORAGE_KEY = 'theme'

type ThemeMode = 'light' | 'dark' | 'system'

const checkSystemDark = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

const applyTheme = (mode: ThemeMode) => {
  if (typeof document === 'undefined') return
  const systemDark = checkSystemDark()
  const isDark = mode === 'system' ? systemDark : mode === 'dark'
  if (isDark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', isDark ? '#1c1917' : '#f97316')
  }
}

export default defineNuxtPlugin(() => {
  if (import.meta.server) return
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  const mode: ThemeMode = stored || 'system'
  applyTheme(mode)
})
