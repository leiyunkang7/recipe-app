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
  const isMounted = useState('breakpoint-mounted', () => false)

  // Computed values based on window width - only computed on client after mount
  const windowWidth = ref(0)

  const isMobile = computed(() => isMounted.value && windowWidth.value < MOBILE_BREAKPOINT)
  const isTablet = computed(() => isMounted.value && windowWidth.value >= MOBILE_BREAKPOINT && windowWidth.value < TABLET_BREAKPOINT)
  const isDesktop = computed(() => isMounted.value && windowWidth.value >= TABLET_BREAKPOINT)
  const isLargeDesktop = computed(() => isMounted.value && windowWidth.value >= DESKTOP_BREAKPOINT)

  let mediaQueries: MediaQueryList[] = []

  const updateWindowWidth = () => {
    if (typeof window !== 'undefined') {
      windowWidth.value = window.innerWidth
    }
  }

  const handleResize = () => {
    updateWindowWidth()
  }

  onMounted(() => {
    isMounted.value = true
    updateWindowWidth()

    // Setup media queries for accurate breakpoint detection
    const mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const tabletQuery = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`)
    const desktopQuery = window.matchMedia(`(min-width: ${TABLET_BREAKPOINT}px)`)
    const largeDesktopQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)

    mediaQueries = [mobileQuery, tabletQuery, desktopQuery, largeDesktopQuery]

    // Listen for viewport changes (orientation change, etc.)
    window.addEventListener('resize', handleResize, { passive: true })
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', handleResize)
    }
    mediaQueries = []
  })

  return {
    isMobile: readonly(isMobile),
    isTablet: readonly(isTablet),
    isDesktop: readonly(isDesktop),
    isLargeDesktop: readonly(isLargeDesktop),
  }
}
