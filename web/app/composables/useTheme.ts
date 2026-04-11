/**
 * useTheme - 统一主题管理 Composable
 *
 * 功能：
 * - 三态主题管理: light / dark / system
 * - localStorage 持久化
 * - 系统主题变化监听
 * - PWA theme_color 动态更新
 *
 * 使用方式：
 * const { mode, isDark, init, setMode, toggle } = useTheme()
 */

export type ThemeMode = 'light' | 'dark' | 'system'

// Theme color constants
const THEME_COLORS = {
  light: '#f97316',
  dark: '#1c1917',
} as const

const STORAGE_KEY = 'theme'

// Check if system prefers dark mode
const checkSystemDark = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

// Update PWA theme-color meta tag
const updatePwaThemeColor = (theme: 'light' | 'dark') => {
  if (typeof document === 'undefined') return
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) {
    meta.setAttribute('content', THEME_COLORS[theme])
  }
  // Also update apple-mobile-web-app-status-bar-style for iOS
  const appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
  if (appleMeta) {
    appleMeta.setAttribute('content', theme === 'dark' ? 'black-translucent' : 'default')
  }
}

// Apply theme to document (internal helper)
const applyThemeInternal = (mode: ThemeMode, isDark: boolean) => {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  html.classList.toggle('dark', isDark)
  updatePwaThemeColor(isDark ? 'dark' : 'light')
}

// Initialize theme from localStorage (called by plugin before hydration)
export const initThemeFromPlugin = () => {
  if (typeof window === 'undefined') return
  const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  const systemDark = checkSystemDark()
  const mode = stored || 'system'
  const isDark = mode === 'system' ? systemDark : mode === 'dark'
  applyThemeInternal(mode, isDark)
}

// Setup system theme change listener (called once by plugin)
export const setupSystemThemeListener = () => {
  if (typeof window === 'undefined' || !window.matchMedia) return
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', (e) => {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    const mode = stored || 'system'
    if (mode === 'system') {
      const html = document.documentElement
      html.classList.toggle('dark', e.matches)
      updatePwaThemeColor(e.matches ? 'dark' : 'light')
    }
  })
}

export function useTheme() {
  // Shared state across components using useState
  const mode = useState<ThemeMode>('theme-mode', () => 'system')
  const isDark = useState<boolean>('theme-is-dark', () => false)

  // Track if system listener has been added (prevent duplicate listeners)
  const listenerAdded = useState<boolean>('theme-listener-added', () => false)

  /**
   * Apply theme to document
   */
  const applyTheme = (systemDark: boolean) => {
    if (typeof document === 'undefined') return

    const dark = mode.value === 'system' ? systemDark : mode.value === 'dark'
    isDark.value = dark

    const html = document.documentElement
    html.classList.toggle('dark', dark)

    updatePwaThemeColor(dark ? 'dark' : 'light')
  }

  /**
   * Initialize theme state from localStorage and system preference
   * Call this once on app mount
   */
  const init = () => {
    if (!import.meta.client) return

    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
    const systemDark = checkSystemDark()

    mode.value = stored || 'system'
    applyTheme(systemDark)

    // Add system theme change listener only once
    if (!listenerAdded.value) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQuery.addEventListener('change', (e) => {
        if (mode.value === 'system') {
          isDark.value = e.matches
          document.documentElement.classList.toggle('dark', e.matches)
          updatePwaThemeColor(e.matches ? 'dark' : 'light')
        }
      })
      listenerAdded.value = true
    }
  }

  /**
   * Set explicit theme mode
   */
  const setMode = (newMode: ThemeMode) => {
    if (!import.meta.client) return

    mode.value = newMode
    localStorage.setItem(STORAGE_KEY, newMode)
    const systemDark = checkSystemDark()
    applyTheme(systemDark)
  }

  /**
   * Toggle between light → dark → system → light
   */
  const toggle = () => {
    const order: ThemeMode[] = ['light', 'dark', 'system']
    const idx = order.indexOf(mode.value)
    setMode(order[(idx + 1) % order.length])
  }

  /**
   * Get current preference from localStorage
   */
  const getPreference = (): ThemeMode => {
    if (!import.meta.client) return 'system'
    return (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system'
  }

  return {
    // State
    mode: readonly(mode),
    isDark: readonly(isDark),
    // Methods
    init,
    setMode,
    toggle,
    getPreference,
    // Constants for UI
    THEME_COLORS,
  }
}
