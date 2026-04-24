/**
 * Reactive breakpoint composable using window.matchMedia
 * Automatically cleans up listeners on unmount
 *
 * Optimized to avoid SSR/hydration mismatch by deferring to client-side only
 */
export function useBreakpoint() {
  const MOBILE_BREAKPOINT = 768
  const TABLET_BREAKPOINT = 1024
  const DESKTOP_BREAKPOINT = 1280

  // Use isMounted to detect client-side execution and avoid hydration mismatch
  // Use ref to ensure each component instance has its own mounted state
  const isMounted = ref(false)

  // Computed values based on window width - only computed on client after mount
  const windowWidth = ref(0)

  const isMobile = computed(() => {
  if (isMounted.value) {
    return windowWidth.value < MOBILE_BREAKPOINT
  }
  return true
})
  const isTablet = computed(() => isMounted.value && windowWidth.value >= MOBILE_BREAKPOINT && windowWidth.value < TABLET_BREAKPOINT)
  const isDesktop = computed(() => isMounted.value && windowWidth.value >= TABLET_BREAKPOINT)
  const isLargeDesktop = computed(() => isMounted.value && windowWidth.value >= DESKTOP_BREAKPOINT)

  const updateWindowWidth = () => {
    if (typeof window !== 'undefined') {
      windowWidth.value = window.innerWidth
    }
  }

  // Debounced resize handler to avoid excessive recalculations during window dragging
  let resizeTimer: ReturnType<typeof setTimeout> | null = null
  const handleResize = () => {
    // Clear existing timeout to ensure only the last resize event within the window triggers update
    if (resizeTimer) {
      clearTimeout(resizeTimer)
    }
    resizeTimer = setTimeout(() => {
      // Only update if component is still mounted - prevents memory leak after unmount
      if (isMounted.value) {
        updateWindowWidth()
      }
      resizeTimer = null
    }, 100) // 100ms debounce - balances responsiveness with performance
  }

  onMounted(() => {
    isMounted.value = true
    updateWindowWidth()

    // Listen for viewport changes (orientation change, etc.)
    window.addEventListener('resize', handleResize, { passive: true })
  })

  onUnmounted(() => {
    // Set isMounted to false BEFORE clearing timer to prevent queued callback from executing
    isMounted.value = false
    // Clear timer to prevent callback execution after unmount
    if (resizeTimer) {
      clearTimeout(resizeTimer)
      resizeTimer = null
    }
    window.removeEventListener('resize', handleResize)
  })

  return {
    isMobile: readonly(isMobile),
    isTablet: readonly(isTablet),
    isDesktop: readonly(isDesktop),
    isLargeDesktop: readonly(isLargeDesktop),
  }
}
