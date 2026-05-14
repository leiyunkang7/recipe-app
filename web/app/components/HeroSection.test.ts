import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Mock useBreakpoint
vi.mock('~/composables/useBreakpoint', () => ({
  useBreakpoint: () => ({
    isMobile: { value: false },
    isTablet: { value: false },
    isDesktop: { value: true },
    isLargeDesktop: { value: false },
  }),
}))

// Mock useEnterAnimation
vi.mock('~/composables/useEnterAnimation', () => ({
  useEnterAnimation: () => ({
    isEntered: { value: true },
    startAnimation: vi.fn(),
    resetAnimation: vi.fn(),
  }),
}))

// Mock useI18n
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    'app.title': '食谱大全',
    'app.subtitle': '发现美味食谱',
    'search.placeholder': '搜索食谱...',
  }
  return translations[key] || key
}

vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    t: mockT,
    locale: { value: 'zh' },
  }),
}))

// Mock ThemeToggle
const ThemeToggleStub = {
  name: 'ThemeToggle',
  template: '<button class="theme-toggle-stub">Theme</button>',
}

// Mock SearchIcon
const SearchIconStub = {
  name: 'SearchIcon',
  template: '<svg class="search-icon-stub"><!-- Search --></svg>',
}

// Mock WaveDivider
const WaveDividerStub = {
  name: 'WaveDivider',
  props: ['height'],
  template: '<div class="wave-divider-stub"></div>',
}

describe('HeroSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('desktop layout (isMobile = false)', () => {
    it('should render desktop header', async () => {
      const HeroSection = await import('./HeroSection.vue')
      const wrapper = mount(HeroSection.default, {
        global: {
          stubs: {
            ThemeToggle: ThemeToggleStub,
            SearchIcon: SearchIconStub,
            WaveDivider: WaveDividerStub,
          },
        },
      })

      // Desktop layout uses hidden md:block classes
      const header = wrapper.find('header')
      expect(header.exists()).toBe(true)
      expect(header.classes()).toContain('hidden')
      expect(header.classes()).toContain('md:block')
    })

    it('should display app title and subtitle', async () => {
      const HeroSection = await import('./HeroSection.vue')
      const wrapper = mount(HeroSection.default, {
        global: {
          stubs: {
            ThemeToggle: ThemeToggleStub,
            SearchIcon: SearchIconStub,
            WaveDivider: WaveDividerStub,
          },
        },
      })

      await flushPromises()

      expect(wrapper.text()).toContain('食谱大全')
      expect(wrapper.text()).toContain('发现美味食谱')
    })

    it('should render search input', async () => {
      const HeroSection = await import('./HeroSection.vue')
      const wrapper = mount(HeroSection.default, {
        global: {
          stubs: {
            ThemeToggle: ThemeToggleStub,
            SearchIcon: SearchIconStub,
            WaveDivider: WaveDividerStub,
          },
        },
      })

      await flushPromises()

      const input = wrapper.find('input[type="text"]')
      expect(input.exists()).toBe(true)
      expect(input.attributes('placeholder')).toBe('搜索食谱...')
    })

    it('should emit search event on input', async () => {
      const HeroSection = await import('./HeroSection.vue')
      const wrapper = mount(HeroSection.default, {
        global: {
          stubs: {
            ThemeToggle: ThemeToggleStub,
            SearchIcon: SearchIconStub,
            WaveDivider: WaveDividerStub,
          },
        },
      })

      await flushPromises()

      const input = wrapper.find('input[type="text"]')
      await input.setValue('红烧肉')

      expect(wrapper.emitted('search')).toBeTruthy()
    })

    it('should bind searchQuery model', async () => {
      const HeroSection = await import('./HeroSection.vue')
      const wrapper = mount(HeroSection.default, {
        props: {
          searchQuery: '初始搜索',
        },
        global: {
          stubs: {
            ThemeToggle: ThemeToggleStub,
            SearchIcon: SearchIconStub,
            WaveDivider: WaveDividerStub,
          },
        },
      })

      await flushPromises()

      const input = wrapper.find('input[type="text"]')
      expect((input.element as HTMLInputElement).value).toBe('初始搜索')
    })

    it('should render ThemeToggle component', async () => {
      const HeroSection = await import('./HeroSection.vue')
      const wrapper = mount(HeroSection.default, {
        global: {
          stubs: {
            ThemeToggle: ThemeToggleStub,
            SearchIcon: SearchIconStub,
            WaveDivider: WaveDividerStub,
          },
        },
      })

      await flushPromises()

      expect(wrapper.find('.theme-toggle-stub').exists()).toBe(true)
    })
  })

  describe('v-model support', () => {
    it('should support v-model for searchQuery', async () => {
      const HeroSection = await import('./HeroSection.vue')
      const wrapper = mount(HeroSection.default, {
        props: {
          searchQuery: '',
        },
        global: {
          stubs: {
            ThemeToggle: ThemeToggleStub,
            SearchIcon: SearchIconStub,
            WaveDivider: WaveDividerStub,
          },
        },
      })

      await flushPromises()

      const input = wrapper.find('input[type="text"]')
      await input.setValue('新搜索词')

      expect(wrapper.emitted('update:searchQuery')).toBeTruthy()
      const updateEvents = wrapper.emitted('update:searchQuery') as unknown[]
      expect(updateEvents[0][0]).toBe('新搜索词')
    })
  })
})
