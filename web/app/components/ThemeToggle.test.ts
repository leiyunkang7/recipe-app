import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)

// Mock matchMedia
const mockMatchMedia = vi.fn()
vi.stubGlobal('matchMedia', mockMatchMedia)

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  it('should render theme toggle button', async () => {
    const ThemeToggle = await import('./ThemeToggle.vue')
    const wrapper = mount(ThemeToggle.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.find('.theme-toggle').exists()).toBe(true)
  })

  it('should display theme icon', async () => {
    const ThemeToggle = await import('./ThemeToggle.vue')
    const wrapper = mount(ThemeToggle.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.find('.theme-icon').exists()).toBe(true)
  })

  it('should display theme label', async () => {
    const ThemeToggle = await import('./ThemeToggle.vue')
    const wrapper = mount(ThemeToggle.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.find('.theme-label').exists()).toBe(true)
  })

  it('should have correct title attribute', async () => {
    const ThemeToggle = await import('./ThemeToggle.vue')
    const wrapper = mount(ThemeToggle.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const button = wrapper.find('.theme-toggle')
    expect(button.attributes('title')).toContain('当前:')
  })

  it('should start with system theme by default', async () => {
    const ThemeToggle = await import('./ThemeToggle.vue')
    const wrapper = mount(ThemeToggle.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()

    // Initially should show system theme label
    expect(wrapper.find('.theme-label').text()).toBe('跟随系统')
  })

  it('should toggle from light to dark theme on click', async () => {
    localStorageMock.getItem.mockReturnValue('light')

    const ThemeToggle = await import('./ThemeToggle.vue')
    const wrapper = mount(ThemeToggle.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()

    // Initially light
    expect(wrapper.find('.theme-label').text()).toBe('浅色')

    // Click to toggle
    await wrapper.find('.theme-toggle').trigger('click')
    await flushPromises()

    // Should now be dark
    expect(wrapper.find('.theme-label').text()).toBe('深色')
  })

  it('should toggle from dark to system theme on click', async () => {
    localStorageMock.getItem.mockReturnValue('dark')

    const ThemeToggle = await import('./ThemeToggle.vue')
    const wrapper = mount(ThemeToggle.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.find('.theme-label').text()).toBe('深色')

    await wrapper.find('.theme-toggle').trigger('click')
    await flushPromises()

    expect(wrapper.find('.theme-label').text()).toBe('跟随系统')
  })

  it('should toggle from system to light theme on click', async () => {
    localStorageMock.getItem.mockReturnValue('system')

    const ThemeToggle = await import('./ThemeToggle.vue')
    const wrapper = mount(ThemeToggle.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.find('.theme-label').text()).toBe('跟随系统')

    await wrapper.find('.theme-toggle').trigger('click')
    await flushPromises()

    expect(wrapper.find('.theme-label').text()).toBe('浅色')
  })

  it('should save theme to localStorage on change', async () => {
    const ThemeToggle = await import('./ThemeToggle.vue')
    const wrapper = mount(ThemeToggle.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()

    await wrapper.find('.theme-toggle').trigger('click')
    await flushPromises()

    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', expect.any(String))
  })

  it('should display correct icon based on system preference', async () => {
    // System prefers dark
    mockMatchMedia.mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    localStorageMock.getItem.mockReturnValue('system')

    const ThemeToggle = await import('./ThemeToggle.vue')
    const wrapper = mount(ThemeToggle.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()

    // When system prefers dark and theme is system, show moon
    expect(wrapper.find('.theme-icon').text()).toBe('🌙')
  })

  it('should display sun icon for light theme', async () => {
    localStorageMock.getItem.mockReturnValue('light')

    const ThemeToggle = await import('./ThemeToggle.vue')
    const wrapper = mount(ThemeToggle.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.find('.theme-icon').text()).toBe('☀️')
  })

  it('should display moon icon for dark theme', async () => {
    localStorageMock.getItem.mockReturnValue('dark')

    const ThemeToggle = await import('./ThemeToggle.vue')
    const wrapper = mount(ThemeToggle.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    await flushPromises()

    expect(wrapper.find('.theme-icon').text()).toBe('🌙')
  })
})