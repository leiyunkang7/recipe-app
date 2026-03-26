/**
 * Dark mode composable
 * Manages dark/light theme state with localStorage persistence
 */

const STORAGE_KEY = 'theme-preference'

export type ThemePreference = 'dark' | 'light' | 'system'

export function useDarkMode() {
  // Shared state across components
  const isDark = useState<boolean>('isDark', () => false)

  /**
   * Initialize dark mode state from localStorage or system preference
   */
  const init = () => {
    if (import.meta.client) {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

      if (stored === 'dark' || (!stored && prefersDark)) {
        setDark(true)
      } else if (stored === 'light') {
        setDark(false)
      } else {
        // System default
        setDark(prefersDark)
      }
    }
  }

  /**
   * Set dark mode and persist to localStorage
   */
  const setDark = (dark: boolean) => {
    isDark.value = dark

    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, dark ? 'dark' : 'light')

      if (dark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  /**
   * Toggle between dark and light mode
   */
  const toggle = () => {
    setDark(!isDark.value)
  }

  /**
   * Set explicit theme preference
   */
  const setPreference = (preference: ThemePreference) => {
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, preference)

      if (preference === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setDark(prefersDark)
      } else {
        setDark(preference === 'dark')
      }
    }
  }

  /**
   * Get current preference from localStorage
   */
  const getPreference = (): ThemePreference => {
    if (import.meta.client) {
      return (localStorage.getItem(STORAGE_KEY) as ThemePreference) || 'system'
    }
    return 'system'
  }

  return {
    isDark: readonly(isDark),
    init,
    toggle,
    setDark,
    setPreference,
    getPreference,
  }
}
