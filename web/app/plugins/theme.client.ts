/**
 * Theme Plugin - Theme initialization plugin
 * Prevents FOUC by applying theme before mount
 * Uses initThemeFromPlugin from useTheme to avoid code duplication
 */

import { initThemeFromPlugin, setupSystemThemeListener } from '~/composables/useTheme'

export default defineNuxtPlugin(() => {
  if (import.meta.server) return

  // Apply theme from localStorage before hydration (prevents FOUC)
  initThemeFromPlugin()

  // Set up system theme change listener
  setupSystemThemeListener()
})
