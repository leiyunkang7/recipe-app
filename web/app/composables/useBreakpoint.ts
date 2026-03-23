/**
 * Reactive breakpoint composable using window.matchMedia
 * Automatically cleans up listeners on unmount
 */
export function useBreakpoint() {
  const isMobile = ref(true)
  const isTablet = ref(false)
  const isDesktop = ref(true)
  const isLargeDesktop = ref(false)

  const MOBILE_BREAKPOINT = 768
  const TABLET_BREAKPOINT = 1024
  const DESKTOP_BREAKPOINT = 1280

  let mobileQuery: MediaQueryList | null = null
  let tabletQuery: MediaQueryList | null = null
  let desktopQuery: MediaQueryList | null = null
  let largeDesktopQuery: MediaQueryList | null = null

  const updateBreakpoints = () => {
    isMobile.value = window.innerWidth < MOBILE_BREAKPOINT
    isTablet.value = window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT
    isDesktop.value = window.innerWidth >= TABLET_BREAKPOINT
    isLargeDesktop.value = window.innerWidth >= DESKTOP_BREAKPOINT
  }

  const setupMediaQueries = () => {
    if (typeof window === 'undefined') return

    mobileQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    tabletQuery = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`)
    desktopQuery = window.matchMedia(`(min-width: ${TABLET_BREAKPOINT}px)`)
    largeDesktopQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT}px)`)

    const handleMobileChange = (e: MediaQueryListEvent) => {
      isMobile.value = e.matches
      if (e.matches) {
        isTablet.value = false
        isDesktop.value = false
      }
    }

    const handleTabletChange = (e: MediaQueryListEvent) => {
      isTablet.value = e.matches
      if (e.matches) {
        isMobile.value = false
        isDesktop.value = false
      }
    }

    const handleDesktopChange = (e: MediaQueryListEvent) => {
      isDesktop.value = e.matches
      if (!e.matches) {
        isLargeDesktop.value = false
      } else {
        isMobile.value = false
        isTablet.value = false
      }
    }

    const handleLargeDesktopChange = (e: MediaQueryListEvent) => {
      isLargeDesktop.value = e.matches
    }

    // Initial update
    updateBreakpoints()

    // Add listeners
    mobileQuery.addEventListener('change', handleMobileChange)
    tabletQuery.addEventListener('change', handleTabletChange)
    desktopQuery.addEventListener('change', handleDesktopChange)
    largeDesktopQuery.addEventListener('change', handleLargeDesktopChange)
  }

  const cleanup = () => {
    if (mobileQuery) mobileQuery.removeEventListener('change', () => {})
    if (tabletQuery) tabletQuery.removeEventListener('change', () => {})
    if (desktopQuery) desktopQuery.removeEventListener('change', () => {})
    if (largeDesktopQuery) largeDesktopQuery.removeEventListener('change', () => {})
    mobileQuery = null
    tabletQuery = null
    desktopQuery = null
    largeDesktopQuery = null
  }

  // Also listen to resize as fallback for initial load
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null
  const handleResize = () => {
    if (resizeTimeout) clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(updateBreakpoints, 100)
  }

  onMounted(() => {
    setupMediaQueries()
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    cleanup()
    window.removeEventListener('resize', handleResize)
    if (resizeTimeout) {
      clearTimeout(resizeTimeout)
      resizeTimeout = null
    }
  })

  return {
    isMobile: readonly(isMobile),
    isTablet: readonly(isTablet),
    isDesktop: readonly(isDesktop),
    isLargeDesktop: readonly(isLargeDesktop),
  }
}
