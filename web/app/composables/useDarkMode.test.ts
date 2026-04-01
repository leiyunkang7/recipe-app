import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock localStorage
const localStorageData: Record<string, string> = {}
const mockLocalStorage = {
  getItem: vi.fn((key: string) => localStorageData[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageData[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageData[key]
  }),
}

// Mock matchMedia
const createMatchMediaMock = (matches: boolean) => {
  const listeners: Array<(e: MediaQueryListEvent) => void> = []
  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
      listeners.push(handler)
    }),
    removeEventListener: vi.fn((_event: string, _handler: (e: MediaQueryListEvent) => void) => {
      // No-op for mock
    }),
    _trigger: (matches: boolean) => {
      listeners.forEach(handler => handler({ matches, media: '(prefers-color-scheme: dark)' } as MediaQueryListEvent))
    },
  }
}

// Mock classList
const mockClassList = {
  add: vi.fn(),
  remove: vi.fn(),
}

vi.stubGlobal('localStorage', mockLocalStorage)

vi.stubGlobal('document', {
  documentElement: {
    classList: mockClassList,
  },
})

vi.stubGlobal('window', {
  matchMedia: vi.fn((query: string) => {
    if (query.includes('prefers-color-scheme: dark')) {
      return createMatchMediaMock(false)
    }
    return createMatchMediaMock(false)
  }),
})

describe('useDarkMode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(localStorageData).forEach(key => delete localStorageData[key])
    mockClassList.add.mockClear()
    mockClassList.remove.mockClear()
  })

  describe('init', () => {
    it('should set dark mode when stored preference is dark', async () => {
      localStorageData['theme-preference'] = 'dark'

      const { useDarkMode } = await import('./useDarkMode')
      const { init } = useDarkMode()
      init()

      expect(mockClassList.add).toHaveBeenCalledWith('dark')
    })

    it('should set light mode when stored preference is light', async () => {
      localStorageData['theme-preference'] = 'light'

      const { useDarkMode } = await import('./useDarkMode')
      const { init } = useDarkMode()
      init()

      expect(mockClassList.remove).toHaveBeenCalledWith('dark')
    })

    it('should use system preference when no stored preference', async () => {
      // Default mock returns false for prefersDark
      const { useDarkMode } = await import('./useDarkMode')
      const { init, isDark } = useDarkMode()
      init()

      // System returns false, so isDark should be false (light mode)
      expect(isDark.value).toBe(false)
    })
  })

  describe('setDark', () => {
    it('should set dark mode and add dark class', async () => {
      const { useDarkMode } = await import('./useDarkMode')
      const { setDark } = useDarkMode()

      setDark(true)

      expect(mockClassList.add).toHaveBeenCalledWith('dark')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme-preference', 'dark')
    })

    it('should set light mode and remove dark class', async () => {
      const { useDarkMode } = await import('./useDarkMode')
      const { setDark } = useDarkMode()

      setDark(false)

      expect(mockClassList.remove).toHaveBeenCalledWith('dark')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme-preference', 'light')
    })
  })

  describe('toggle', () => {
    it('should toggle from dark to light', async () => {
      localStorageData['theme-preference'] = 'dark'

      const { useDarkMode } = await import('./useDarkMode')
      const { init, toggle, isDark } = useDarkMode()
      init()

      // isDark should be true initially (dark mode)
      expect(isDark.value).toBe(true)

      toggle()

      // After toggle, should be light
      expect(mockClassList.remove).toHaveBeenCalledWith('dark')
    })

    it('should toggle from light to dark', async () => {
      localStorageData['theme-preference'] = 'light'

      const { useDarkMode } = await import('./useDarkMode')
      const { init, toggle, isDark } = useDarkMode()
      init()

      // isDark should be false initially (light mode)
      expect(isDark.value).toBe(false)

      toggle()

      // After toggle, should be dark
      expect(mockClassList.add).toHaveBeenCalledWith('dark')
    })
  })

  describe('setPreference', () => {
    it('should set dark preference explicitly', async () => {
      const { useDarkMode } = await import('./useDarkMode')
      const { setPreference } = useDarkMode()

      setPreference('dark')

      expect(mockClassList.add).toHaveBeenCalledWith('dark')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme-preference', 'dark')
    })

    it('should set light preference explicitly', async () => {
      const { useDarkMode } = await import('./useDarkMode')
      const { setPreference } = useDarkMode()

      setPreference('light')

      expect(mockClassList.remove).toHaveBeenCalledWith('dark')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme-preference', 'light')
    })

    it('should use system preference when set to system', async () => {
      const { useDarkMode } = await import('./useDarkMode')
      const { setPreference } = useDarkMode()

      setPreference('system')

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme-preference', 'system')
    })
  })

  describe('getPreference', () => {
    it('should return stored preference', async () => {
      localStorageData['theme-preference'] = 'dark'

      const { useDarkMode } = await import('./useDarkMode')
      const { getPreference } = useDarkMode()

      expect(getPreference()).toBe('dark')
    })

    it('should return system when no preference stored', async () => {
      const { useDarkMode } = await import('./useDarkMode')
      const { getPreference } = useDarkMode()

      expect(getPreference()).toBe('system')
    })
  })
})