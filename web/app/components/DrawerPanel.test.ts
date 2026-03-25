import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick, ref } from 'vue'

// Mock Vue lifecycle hooks
let mountedCallback: (() => void) | null = null
let unmountedCallback: (() => void) | null = null

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: vi.fn((cb: () => void) => {
      mountedCallback = cb
    }),
    onUnmounted: vi.fn((cb: () => void) => {
      unmountedCallback = cb
    }),
    nextTick: vi.fn(() => Promise.resolve()),
  }
})

// Mock useRoute
vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'zh' },
  }),
}))

vi.mock('#imports', () => ({
  useRoute: vi.fn(() => ({
    path: '/',
  })),
  useLocalePath: vi.fn(() => (path: string) => path),
}))

describe('DrawerPanel', () => {
  const mockNavItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/recipes', label: '食谱', icon: '🍳' },
    { path: '/favorites', label: '收藏', icon: '❤️', badge: 5 },
    { path: '/admin', label: '管理', icon: '⚙️' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mountedCallback = null
    unmountedCallback = null
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('should render drawer panel with correct structure', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      expect(wrapper.find('#mobile-menu-drawer').exists()).toBe(true)
      expect(wrapper.find('role="dialog"').exists()).toBe(true)
      expect(wrapper.find('aria-modal="true"').exists()).toBe(true)
    })

    it('should have correct width class', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      const drawer = wrapper.find('#mobile-menu-drawer')
      expect(drawer.classes()).toContain('w-72')
      expect(drawer.classes()).toContain('max-w-[80vw]')
    })

    it('should have correct positioning classes', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      const drawer = wrapper.find('#mobile-menu-drawer')
      expect(drawer.classes()).toContain('fixed')
      expect(drawer.classes()).toContain('top-0')
      expect(drawer.classes()).toContain('left-0')
      expect(drawer.classes()).toContain('bottom-0')
      expect(drawer.classes()).toContain('z-50')
    })

    it('should have mobile-only visibility class', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      const drawer = wrapper.find('#mobile-menu-drawer')
      expect(drawer.classes()).toContain('md:hidden')
    })
  })

  describe('close event', () => {
    it('should emit close event when close is called', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      // Trigger mount
      if (mountedCallback) {
        mountedCallback()
      }
      await flushPromises()
      vi.advanceTimersByTime(100)
      await nextTick()

      // Find the close button and click it
      const closeButton = wrapper.find('button')
      await closeButton.trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should handle Escape keydown', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      // Trigger mount
      if (mountedCallback) {
        mountedCallback()
      }
      await flushPromises()
      vi.advanceTimersByTime(100)
      await nextTick()

      const drawer = wrapper.find('#mobile-menu-drawer')
      await drawer.trigger('keydown', { key: 'Escape' })

      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('animation state', () => {
    it('should initialize with isContentVisible as false', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      // Before mount, animation should not be visible
      expect(wrapper.vm.isContentVisible).toBe(false)
    })

    it('should set isContentVisible to true after mount animation', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      // Trigger mount
      if (mountedCallback) {
        mountedCallback()
      }

      // Before timers advance, should be false
      expect(wrapper.vm.isContentVisible).toBe(false)

      // Advance timers for animation
      vi.advanceTimersByTime(100)
      await nextTick()

      // After timers, should be true
      expect(wrapper.vm.isContentVisible).toBe(true)
    })
  })

  describe('keyboard navigation', () => {
    it('should handle Escape key when drawer is focused', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      // Trigger mount
      if (mountedCallback) {
        mountedCallback()
      }
      await flushPromises()
      vi.advanceTimersByTime(100)
      await nextTick()

      const drawer = wrapper.find('#mobile-menu-drawer')
      await drawer.trigger('keydown', { key: 'Escape', preventDefault: vi.fn() })

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should not emit close for non-Escape keys', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      // Trigger mount
      if (mountedCallback) {
        mountedCallback()
      }
      await flushPromises()
      vi.advanceTimersByTime(100)
      await nextTick()

      const drawer = wrapper.find('#mobile-menu-drawer')
      await drawer.trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('close')).toBeFalsy()
    })
  })

  describe('subcomponents', () => {
    it('should render DrawerPanelHeader', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      expect(wrapper.findComponent({ name: 'DrawerPanelHeader' }).exists()).toBe(true)
    })

    it('should render DrawerPanelNavList', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      expect(wrapper.findComponent({ name: 'DrawerPanelNavList' }).exists()).toBe(true)
    })

    it('should render DrawerPanelFooter', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      expect(wrapper.findComponent({ name: 'DrawerPanelFooter' }).exists()).toBe(true)
    })

    it('should pass navItems to DrawerPanelNavList', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      const navList = wrapper.findComponent({ name: 'DrawerPanelNavList' })
      expect(navList.props('navItems')).toEqual(mockNavItems)
    })

    it('should pass isContentVisible to all subcomponents', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      // Initially false
      expect(wrapper.findComponent({ name: 'DrawerPanelHeader' }).props('isContentVisible')).toBe(false)

      // After mount
      if (mountedCallback) {
        mountedCallback()
      }
      vi.advanceTimersByTime(100)
      await nextTick()

      expect(wrapper.findComponent({ name: 'DrawerPanelHeader' }).props('isContentVisible')).toBe(true)
    })
  })

  describe('accessibility', () => {
    it('should have aria-modal attribute', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      const drawer = wrapper.find('#mobile-menu-drawer')
      expect(drawer.attributes('aria-modal')).toBe('true')
    })

    it('should have role dialog', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      const drawer = wrapper.find('#mobile-menu-drawer')
      expect(drawer.attributes('role')).toBe('dialog')
    })

    it('should have aria-label in Chinese by default', async () => {
      const DrawerPanel = await import('./DrawerPanel.vue')
      const wrapper = mount(DrawerPanel.default, {
        props: {
          navItems: mockNavItems,
        },
      })

      const drawer = wrapper.find('#mobile-menu-drawer')
      expect(drawer.attributes('aria-label')).toBe('nav.mobileMenu')
    })
  })
})