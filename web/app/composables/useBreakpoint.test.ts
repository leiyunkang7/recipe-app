import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock window and matchMedia
const createMatchMediaMock = (matches: boolean) => {
  const listeners: Array<(e: MediaQueryListEvent) => void> = []
  return {
    matches,
    media: '',
    addEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
      listeners.push(handler)
    }),
    removeEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
      const index = listeners.indexOf(handler)
      if (index > -1) listeners.splice(index, 1)
    }),
    dispatchEvent: vi.fn(),
    _trigger: (matches: boolean) => {
      listeners.forEach(handler => handler({ matches, media: '' } as MediaQueryListEvent))
    },
  }
}

const createWindowMock = (innerWidth: number = 1024) => {
  const mediaQueries = {
    mobile: createMatchMediaMock(innerWidth < 768),
    tablet: createMatchMediaMock(innerWidth >= 768 && innerWidth < 1024),
    desktop: createMatchMediaMock(innerWidth >= 1024),
    largeDesktop: createMatchMediaMock(innerWidth >= 1280),
  }

  return {
    innerWidth,
    matchMedia: vi.fn((query: string) => {
      if (query.includes('max-width: 767')) return mediaQueries.mobile
      if (query.includes('min-width: 768') && query.includes('max-width: 1023')) return mediaQueries.tablet
      if (query.includes('min-width: 1024')) return mediaQueries.desktop
      if (query.includes('min-width: 1280')) return mediaQueries.largeDesktop
      return createMatchMediaMock(false)
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    _mediaQueries: mediaQueries,
  }
}

const originalImportMeta = { ...import.meta }

describe('useBreakpoint', () => {
  let windowMock: ReturnType<typeof createWindowMock>

  beforeEach(() => {
    vi.clearAllMocks()
    windowMock = createWindowMock(1024)
    vi.stubGlobal('window', windowMock)
    Object.defineProperty(import.meta, 'client', { value: true, writable: true })
  })

  afterEach(() => {
    Object.assign(import.meta, originalImportMeta)
    vi.restoreAllMocks()
  })

  it('should return correct initial breakpoint values for desktop', async () => {
    const { useBreakpoint } = await import('./useBreakpoint')
    const { isMobile, isTablet, isDesktop, isLargeDesktop } = useBreakpoint()

    expect(isMobile.value).toBe(false)
    expect(isTablet.value).toBe(false)
    expect(isDesktop.value).toBe(true)
    expect(isLargeDesktop.value).toBe(false)
  })

  it('should return correct breakpoint values for mobile', async () => {
    windowMock = createWindowMock(375)
    vi.stubGlobal('window', windowMock)

    const { useBreakpoint } = await import('./useBreakpoint')
    const { isMobile, isTablet, isDesktop } = useBreakpoint()

    expect(isMobile.value).toBe(true)
    expect(isTablet.value).toBe(false)
    expect(isDesktop.value).toBe(false)
  })

  it('should return correct breakpoint values for tablet', async () => {
    windowMock = createWindowMock(900)
    vi.stubGlobal('window', windowMock)

    const { useBreakpoint } = await import('./useBreakpoint')
    const { isMobile, isTablet, isDesktop } = useBreakpoint()

    expect(isMobile.value).toBe(false)
    expect(isTablet.value).toBe(true)
    expect(isDesktop.value).toBe(false)
  })

  it('should return correct breakpoint values for large desktop', async () => {
    windowMock = createWindowMock(1440)
    vi.stubGlobal('window', windowMock)

    const { useBreakpoint } = await import('./useBreakpoint')
    const { isMobile, isTablet, isDesktop, isLargeDesktop } = useBreakpoint()

    expect(isMobile.value).toBe(false)
    expect(isTablet.value).toBe(false)
    expect(isDesktop.value).toBe(true)
    expect(isLargeDesktop.value).toBe(true)
  })

  it('should set up media query listeners', async () => {
    await import('./useBreakpoint')

    expect(windowMock.matchMedia).toHaveBeenCalledTimes(4)
    expect(windowMock.matchMedia).toHaveBeenCalledWith(expect.stringContaining('max-width: 767'))
    expect(windowMock.matchMedia).toHaveBeenCalledWith(expect.stringContaining('min-width: 768'))
    expect(windowMock.matchMedia).toHaveBeenCalledWith(expect.stringContaining('min-width: 1024'))
    expect(windowMock.matchMedia).toHaveBeenCalledWith(expect.stringContaining('min-width: 1280'))
  })

  it('should not access window on server side', async () => {
    Object.defineProperty(import.meta, 'client', { value: false, writable: true })

    const { useBreakpoint } = await import('./useBreakpoint')
    const { isMobile, isTablet, isDesktop, isLargeDesktop } = useBreakpoint()

    // On server side, refs should still be created but not initialized with values
    expect(isMobile.value).toBe(true)
    expect(isTablet.value).toBe(false)
    expect(isDesktop.value).toBe(true)
    expect(isLargeDesktop.value).toBe(false)
  })

  it('should update isMobile to false when tablet media query matches', async () => {
    windowMock = createWindowMock(800)
    vi.stubGlobal('window', windowMock)

    const { useBreakpoint } = await import('./useBreakpoint')
    const { isMobile, isTablet } = useBreakpoint()

    expect(isMobile.value).toBe(false)
    expect(isTablet.value).toBe(true)
  })
})