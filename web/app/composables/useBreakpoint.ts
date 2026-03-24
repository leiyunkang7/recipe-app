/**
 * Reactive breakpoint composable using window.matchMedia
 * Automatically cleans up listeners on unmount
 */
export function useBreakpoint() {
  // Initialize to neutral values to avoid SSR/hydration mismatch
  // Client-side setupMediaQueries will update these in onMounted
  const isMobile = ref(false)
  const isTablet = ref(false)
  const isDesktop = ref(false)
  const isLargeDesktop = ref(false)

  const MOBILE_BREAKPOINT = 768
  const TABLET_BREAKPOINT = 1024
  const DESKTOP_BREAKPOINT = 1280

  let mobileQuery: MediaQueryList | null = null
  let tabletQuery: MediaQueryList | null = null
  let desktopQuery: MediaQueryList | null = null
  let largeDesktopQuery: MediaQueryList | null = null

  // Store handler references so cleanup can remove the correct listeners
  // Note: media queries are mutually exclusive for mobile/tablet/desktop, so we only need to update the affected flag
  const handleMobileChange = (e: MediaQueryListEvent) => {
    isMobile.value = e.matches
    // When mobile becomes true, tablet and desktop must be false (media query guarantees this)
    // but we explicitly set them for clarity
    if (e.matches) {
      isTablet.value = false
      isDesktop.value = false
    }
  }

  const handleTabletChange = (e: MediaQueryListEvent) => {
    isTablet.value = e.matches
    // When tablet becomes true, mobile and desktop must be false (media query guarantees this)
    if (e.matches) {
      isMobile.value = false
      isDesktop.value = false
    }
  }

  const handleDesktopChange = (e: MediaQueryListEvent) => {
    isDesktop.value = e.matches
    // When desktop becomes false, we need to update other breakpoints
    // The media query guarantees mutual exclusivity for mobile/tablet
    if (!e.matches) {
      isLargeDesktop.value = false
      // Trigger a full update since we don't know the exact window state
      updateBreakpoints()
    } else {
      isMobile.value = false
      isTablet.value = false
      isLargeDesktop.value = window.innerWidth >= DESKTOP_BREAKPOINT
    }
  }

  const handleLargeDesktopChange = (e: MediaQueryListEvent) => {
    isLargeDesktop.value = e.matches
  }

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

    // Initial update
    updateBreakpoints()

    // Add listeners
    mobileQuery.addEventListener('change', handleMobileChange)
    tabletQuery.addEventListener('change', handleTabletChange)
    desktopQuery.addEventListener('change', handleDesktopChange)
    largeDesktopQuery.addEventListener('change', handleLargeDesktopChange)
  }

  const cleanup = () => {
    if (mobileQuery) mobileQuery.removeEventListener('change', handleMobileChange)
    if (tabletQuery) tabletQuery.removeEventListener('change', handleTabletChange)
    if (desktopQuery) desktopQuery.removeEventListener('change', handleDesktopChange)
    if (largeDesktopQuery) largeDesktopQuery.removeEventListener('change', handleLargeDesktopChange)
    mobileQuery = null
    tabletQuery = null
    desktopQuery = null
    largeDesktopQuery = null
  }

  // Also listen to resize as fallback for initial load
  let resizeTimeout: ReturnType<typeof setTimeout> | null = null
  const handleResize = () => {
    if (resizeTimeout) clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      resizeTimeout = null
      updateBreakpoints()
    }, 100)
  }

  onMounted(() => {
    setupMediaQueries()
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    cleanup()
    window.removeEventListener('resize', handleResize)
    // Clear any pending resize timeout to prevent memory leaks
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
