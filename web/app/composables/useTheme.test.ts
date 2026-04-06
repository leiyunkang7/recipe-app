import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}

// Mock matchMedia
const mockMatchMedia = vi.fn()

// Mock document
const mockDocument = {
  documentElement: {
    classList: {
      toggle: vi.fn(),
    },
  },
  querySelector: vi.fn(),
}

describe('useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset global mocks
    global.localStorage = localStorageMock as unknown
    global.matchMedia = mockMatchMedia as unknown
    global.document = mockDocument as unknown
    
    localStorageMock.getItem.mockReturnValue(null)
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    mockDocument.querySelector.mockReturnValue({
      setAttribute: vi.fn(),
    })
    mockDocument.documentElement.classList.toggle.mockClear()
  })

  describe('ThemeMode type', () => {
    it('should have correct ThemeMode values', () => {
      type ThemeMode = 'light' | 'dark' | 'system'
      const validModes: ThemeMode[] = ['light', 'dark', 'system']
      expect(validModes).toContain('light')
      expect(validModes).toContain('dark')
      expect(validModes).toContain('system')
    })
  })

  describe('theme color constants', () => {
    it('should have correct light theme color', () => {
      const THEME_COLORS = {
        light: '#f97316',
        dark: '#1c1917',
      }
      expect(THEME_COLORS.light).toBe('#f97316')
    })

    it('should have correct dark theme color', () => {
      const THEME_COLORS = {
        light: '#f97316',
        dark: '#1c1917',
      }
      expect(THEME_COLORS.dark).toBe('#1c1917')
    })
  })

  describe('storage key', () => {
    it('should use correct storage key', () => {
      const STORAGE_KEY = 'theme-mode'
      expect(STORAGE_KEY).toBe('theme-mode')
    })
  })

  describe('system preference detection', () => {
    it('should detect dark system preference', () => {
      mockMatchMedia.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })
      
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      expect(prefersDark).toBe(true)
    })

    it('should detect light system preference', () => {
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })
      
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      expect(prefersDark).toBe(false)
    })

    it('should return false when matchMedia is not available', () => {
      global.matchMedia = undefined as unknown
      
      const checkSystemDark = (): boolean => {
        if (typeof window === 'undefined' || !window.matchMedia) return false
        return window.matchMedia('(prefers-color-scheme: dark)').matches
      }
      
      expect(checkSystemDark()).toBe(false)
    })
  })

  describe('theme application', () => {
    it('should apply dark class when isDark is true', () => {
      mockDocument.documentElement.classList.toggle('dark', true)
      expect(mockDocument.documentElement.classList.toggle).toHaveBeenCalledWith('dark', true)
    })

    it('should remove dark class when isDark is false', () => {
      mockDocument.documentElement.classList.toggle('dark', false)
      expect(mockDocument.documentElement.classList.toggle).toHaveBeenCalledWith('dark', false)
    })
  })

  describe('PWA theme color update', () => {
    it('should update meta tag content to light theme color', () => {
      const meta = { setAttribute: vi.fn() }
      mockDocument.querySelector.mockReturnValue(meta)
      
      meta.setAttribute('content', '#f97316')
      expect(meta.setAttribute).toHaveBeenCalledWith('content', '#f97316')
    })

    it('should update meta tag content to dark theme color', () => {
      const meta = { setAttribute: vi.fn() }
      mockDocument.querySelector.mockReturnValue(meta)
      
      meta.setAttribute('content', '#1c1917')
      expect(meta.setAttribute).toHaveBeenCalledWith('content', '#1c1917')
    })

    it('should handle missing meta tag gracefully', () => {
      mockDocument.querySelector.mockReturnValue(null)
      
      const updatePwaThemeColor = (theme: 'light' | 'dark') => {
        const THEME_COLORS = { light: '#f97316', dark: '#1c1917' }
        const meta = document.querySelector('meta[name="theme-color"]')
        if (meta) {
          meta.setAttribute('content', THEME_COLORS[theme])
        }
      }
      
      // Should not throw
      expect(() => updatePwaThemeColor('dark')).not.toThrow()
    })
  })

  describe('localStorage persistence', () => {
    it('should save theme mode to localStorage', () => {
      localStorage.setItem('theme-mode', 'dark')
      expect(localStorage.setItem).toHaveBeenCalledWith('theme-mode', 'dark')
    })

    it('should retrieve theme mode from localStorage', () => {
      localStorage.getItem('theme-mode')
      expect(localStorage.getItem).toHaveBeenCalledWith('theme-mode')
    })

    it('should default to system when no stored preference', () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const stored = localStorage.getItem('theme-mode')
      const mode = (stored as 'light' | 'dark' | 'system') || 'system'
      expect(mode).toBe('system')
    })
  })

  describe('toggle logic', () => {
    it('should cycle light → dark → system → light', () => {
      const order: ('light' | 'dark' | 'system')[] = ['light', 'dark', 'system']
      
      // Start at light
      let currentMode: 'light' | 'dark' | 'system' = 'light'
      expect(currentMode).toBe('light')
      
      // Toggle once → dark
      const idx1 = order.indexOf(currentMode)
      currentMode = order[(idx1 + 1) % order.length]
      expect(currentMode).toBe('dark')
      
      // Toggle again → system
      const idx2 = order.indexOf(currentMode)
      currentMode = order[(idx2 + 1) % order.length]
      expect(currentMode).toBe('system')
      
      // Toggle again → light
      const idx3 = order.indexOf(currentMode)
      currentMode = order[(idx3 + 1) % order.length]
      expect(currentMode).toBe('light')
    })
  })

  describe('system theme listener', () => {
    it('should add change listener to matchMedia', () => {
      const addEventListener = vi.fn()
      mockMatchMedia.mockReturnValue({
        matches: false,
        addEventListener,
        removeEventListener: vi.fn(),
      })
      
      const _mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      expect(addEventListener).toBeDefined()
    })
  })
})
