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
  // Use unique key to prevent conflicts with other useState calls
  const isMounted = useState('bp-client-mounted', () => false)

  // Computed values based on window width - only computed on client after mount
  const windowWidth = ref(0)

  const isMobile = computed(() => isMounted.value && windowWidth.value < MOBILE_BREAKPOINT)
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
      updateWindowWidth()
      resizeTimer = null
    }, 16) // ~60fps throttle
  }

  onMounted(() => {
    isMounted.value = true
    updateWindowWidth()

    // Listen for viewport changes (orientation change, etc.)
    window.addEventListener('resize', handleResize, { passive: true })
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize)
    }
    if (resizeTimer) {
      clearTimeout(resizeTimer)
      resizeTimer = null
    }
  })

  return {
    isMobile: readonly(isMobile),
    isTablet: readonly(isTablet),
    isDesktop: readonly(isDesktop),
    isLargeDesktop: readonly(isLargeDesktop),
  }
}
