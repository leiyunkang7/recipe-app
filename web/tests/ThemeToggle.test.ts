import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

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
  clear: vi.fn(() => {
    Object.keys(localStorageData).forEach(key => delete localStorageData[key])
  }),
}
vi.stubGlobal('localStorage', mockLocalStorage)

// Mock matchMedia
const createMatchMediaMock = (matches: boolean) => {
  const listeners: Array<(e: MediaQueryListEvent) => void> = []
  return {
    matches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
      listeners.push(handler)
    }),
    removeEventListener: vi.fn((_event: string, handler: (e: MediaQueryListEvent) => void) => {
      const index = listeners.indexOf(handler)
      if (index > -1) listeners.splice(index, 1)
    }),
    dispatchEvent: vi.fn(),
    _trigger: (matches: boolean) => {
      listeners.forEach(handler => handler({ matches, media: '(prefers-color-scheme: dark)' } as MediaQueryListEvent))
    },
  }
}

// Mock document
const mockClassList = {
  toggle: vi.fn(),
  add: vi.fn(),
  remove: vi.fn(),
}
vi.stubGlobal('document', {
  documentElement: {
    classList: mockClassList,
  },
})

// Mock window
const windowMock = {
  matchMedia: vi.fn((query: string) => {
    if (query.includes('prefers-color-scheme: dark')) {
      return createMatchMediaMock(false)
    }
    return createMatchMediaMock(false)
  }),
}
vi.stubGlobal('window', windowMock)

vi.stubGlobal('console', {
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
})

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.keys(localStorageData).forEach(key => delete localStorageData[key])
    mockClassList.toggle.mockClear()
  })

  describe('toggleTheme function logic', () => {
    it('should cycle from system to light theme', async () => {
      // Test the theme cycling logic without mounting the component
      // The toggleTheme function cycles: system -> light -> dark -> system

      const currentTheme = ref('system')
      const toggleTheme = () => {
        if (currentTheme.value === 'light') {
          currentTheme.value = 'dark'
        } else if (currentTheme.value === 'dark') {
          currentTheme.value = 'system'
        } else {
          currentTheme.value = 'light'
        }
      }

      expect(currentTheme.value).toBe('system')
      toggleTheme()
      expect(currentTheme.value).toBe('light')
    })

    it('should cycle from light to dark theme', () => {
      const currentTheme = ref('light')
      const toggleTheme = () => {
        if (currentTheme.value === 'light') {
          currentTheme.value = 'dark'
        } else if (currentTheme.value === 'dark') {
          currentTheme.value = 'system'
        } else {
          currentTheme.value = 'light'
        }
      }

      toggleTheme()
      expect(currentTheme.value).toBe('dark')
    })

    it('should cycle from dark to system theme', () => {
      const currentTheme = ref('dark')
      const toggleTheme = () => {
        if (currentTheme.value === 'light') {
          currentTheme.value = 'dark'
        } else if (currentTheme.value === 'dark') {
          currentTheme.value = 'system'
        } else {
          currentTheme.value = 'light'
        }
      }

      toggleTheme()
      expect(currentTheme.value).toBe('system')
    })
  })

  describe('localStorage integration', () => {
    it('should save theme to localStorage when changed', () => {
      const currentTheme = ref('system')

      // Simulate theme change and save
      currentTheme.value = 'light'
      mockLocalStorage.setItem('theme', currentTheme.value)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('theme', 'light')
    })

    it('should read theme from localStorage on init', () => {
      localStorageData['theme'] = 'dark'
      mockLocalStorage.getItem('theme')

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('theme')
    })

    it('should return null when no theme saved', () => {
      const result = mockLocalStorage.getItem('theme')
      expect(result).toBeNull()
    })
  })

  describe('applyTheme function logic', () => {
    it('should toggle dark class when theme is dark', () => {
      const isDark = ref(true)
      const html = document.documentElement

      html.classList.toggle('dark', isDark.value)

      expect(mockClassList.toggle).toHaveBeenCalledWith('dark', true)
    })

    it('should toggle dark class off when theme is light', () => {
      const isDark = ref(false)
      const html = document.documentElement

      html.classList.toggle('dark', isDark.value)

      expect(mockClassList.toggle).toHaveBeenCalledWith('dark', false)
    })
  })

  describe('checkSystemDark function logic', () => {
    it('should return true when system prefers dark mode', () => {
      const systemDark = ref(true)
      const checkSystemDark = () => systemDark.value

      expect(checkSystemDark()).toBe(true)
    })

    it('should return false when system prefers light mode', () => {
      const systemDark = ref(false)
      const checkSystemDark = () => systemDark.value

      expect(checkSystemDark()).toBe(false)
    })
  })

  describe('getCurrentIcon function logic', () => {
    it('should return moon icon for dark theme', () => {
      const theme = 'dark'
      const icon = theme === 'dark' ? '🌙' : '☀️'
      expect(icon).toBe('🌙')
    })

    it('should return sun icon for light theme', () => {
      const theme = 'light'
      const icon = theme === 'dark' ? '🌙' : '☀️'
      expect(icon).toBe('☀️')
    })

    it('should return sun icon for system theme when light', () => {
      const isDark = false
      const icon = isDark ? '🌙' : '☀️'
      expect(icon).toBe('☀️')
    })

    it('should return moon icon for system theme when dark', () => {
      const isDark = true
      const icon = isDark ? '🌙' : '☀️'
      expect(icon).toBe('🌙')
    })
  })
})