/**
 * Theme Plugin - Theme initialization plugin
 * Prevents FOUC by applying theme before mount
 * Initializes both:
 *   1. CSS class on <html> (via initThemeFromPlugin) - for visual theme
 *   2. useState values in useTheme composable (via init) - for component reactivity
 */

import { initThemeFromPlugin, setupSystemThemeListener, useTheme } from '~/composables/useTheme'

export default defineNuxtPlugin(() => {
  if (import.meta.server) return

  // 1. Apply theme from localStorage before hydration (prevents FOUC)
  //    This sets the `dark` class on <html> so no flash of wrong theme
  initThemeFromPlugin()

  // 2. Initialize the useTheme composable state so components get correct values
  //    Without this, mode.value and isDark.value in useTheme() would be wrong
  const { init } = useTheme()
  init()

  // 3. Set up system theme change listener
  setupSystemThemeListener()
})
