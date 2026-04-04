import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

// Mock Vue lifecycle hooks
let mountedCallback: (() => void) | null = null

vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: vi.fn((cb: () => void) => {
      mountedCallback = cb
    }),
    onUnmounted: vi.fn(),
    nextTick: vi.fn(() => Promise.resolve()),
  }
})

// Mock useI18n
vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'zh' },
  }),
}))

// Mock useFavorites
vi.mock('~/composables/useFavorites', () => ({
  useFavorites: () => ({
    favoriteIds: { value: new Set(['recipe-1', 'recipe-2']) },
  }),
}))

// Mock child components
vi.mock('./MobileNavbarHeader.vue', () => ({
  default: {
    name: 'MobileNavbarHeader',
    props: ['isMenuOpen', 'isEntered'],
    emits: ['toggleMenu', 'menuKeydown'],
    template: '<button class="mobile-navbar-header-mock" @click="$emit(\'toggle-menu\')">Menu</button>',
  },
}))

vi.mock('./MobileBottomNav.vue', () => ({
  default: {
    name: 'MobileBottomNav',
    props: ['tabs', 'isEntered'],
    template: '<div class="mobile-bottom-nav-mock"></div>',
  },
}))

vi.mock('./MobileMenuDrawer.vue', () => ({
  default: {
    name: 'MobileMenuDrawer',
    props: ['isOpen', 'navItems'],
    emits: ['close'],
    template: '<div class="mobile-menu-drawer-mock" v-if="isOpen"></div>',
  },
}))

describe('MobileNavbar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mountedCallback = null
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('should render mobile-only container', async () => {
      const MobileNavbar = await import('./MobileNavbar.vue')
      const wrapper = mount(MobileNavbar.default, {
        global: {
          stubs: {
            MobileNavbarHeader: true,
            MobileBottomNav: true,
            MobileMenuDrawer: true,
          },
        },
      })

      expect(wrapper.find('.md\\:hidden').exists()).toBe(true)
    })

    it('should render MobileNavbarHeader', async () => {
      const MobileNavbar = await import('./MobileNavbar.vue')
      const wrapper = mount(MobileNavbar.default, {
        global: {
          stubs: {
            MobileNavbarHeader: true,
            MobileBottomNav: true,
            MobileMenuDrawer: true,
          },
        },
      })

      expect(wrapper.findComponent({ name: 'MobileNavbarHeader' }).exists()).toBe(true)
    })

    it('should render MobileBottomNav', async () => {
      const MobileNavbar = await import('./MobileNavbar.vue')
      const wrapper = mount(MobileNavbar.default, {
        global: {
          stubs: {
            MobileNavbarHeader: true,
            MobileBottomNav: true,
            MobileMenuDrawer: true,
          },
        },
      })

      expect(wrapper.findComponent({ name: 'MobileBottomNav' }).exists()).toBe(true)
    })

    it('should render MobileMenuDrawer', async () => {
      const MobileNavbar = await import('./MobileNavbar.vue')
      const wrapper = mount(MobileNavbar.default, {
        global: {
          stubs: {
            MobileNavbarHeader: true,
            MobileBottomNav: true,
            MobileMenuDrawer: true,
          },
        },
      })

      expect(wrapper.findComponent({ name: 'MobileMenuDrawer' }).exists()).toBe(true)
    })
  })

  describe('menu state', () => {
    it('should initialize with menu closed', async () => {
      const MobileNavbar = await import('./MobileNavbar.vue')
      const wrapper = mount(MobileNavbar.default, {
        global: {
          stubs: {
            MobileNavbarHeader: true,
            MobileBottomNav: true,
            MobileMenuDrawer: true,
          },
        },
      })

      expect(wrapper.vm.isMenuOpen).toBe(false)
    })

    it('should toggle menu state when toggleMenu is called', async () => {
      const MobileNavbar = await import('./MobileNavbar.vue')
      const wrapper = mount(MobileNavbar.default, {
        global: {
          stubs: {
            MobileNavbarHeader: true,
            MobileBottomNav: true,
            MobileMenuDrawer: true,
          },
        },
      })

      expect(wrapper.vm.isMenuOpen).toBe(false)

      wrapper.vm.toggleMenu()

      expect(wrapper.vm.isMenuOpen).toBe(true)
    })

    it('should close menu when closeMenu is called', async () => {
      const MobileNavbar = await import('./MobileNavbar.vue')
      const wrapper = mount(MobileNavbar.default, {
        global: {
          stubs: {
            MobileNavbarHeader: true,
            MobileBottomNav: true,
            MobileMenuDrawer: true,
          },
        },
      })

      wrapper.vm.isMenuOpen = true
      wrapper.vm.closeMenu()

      expect(wrapper.vm.isMenuOpen).toBe(false)
    })
  })

  describe('animation state', () => {
    it('should initialize with isEntered as false', async () => {
      const MobileNavbar = await import('./MobileNavbar.vue')
      const wrapper = mount(MobileNavbar.default, {
        global: {
          stubs: {
            MobileNavbarHeader: true,
            MobileBottomNav: true,
            MobileMenuDrawer: true,
          },
        },
      })

      expect(wrapper.vm.isEntered).toBe(false)
    })

    it('should set isEntered to true after mount', async () => {
      const MobileNavbar = await import('./MobileNavbar.vue')
      const wrapper = mount(MobileNavbar.default, {
        global: {
          stubs: {
            MobileNavbarHeader: true,
            MobileBottomNav: true,
            MobileMenuDrawer: true,
          },
        },
      })

      // Trigger mount callback
      if (mountedCallback) {
        mountedCallback()
      }

      // Advance timers for animation
      vi.advanceTimersByTime(100)
      await nextTick()

      expect(wrapper.vm.isEntered).toBe(true)
    })
  })

  describe('tabs computed', () => {
    it('should generate correct tabs structure', async () => {
      const MobileNavbar = await import('./MobileNavbar.vue')
      const wrapper = mount(MobileNavbar.default, {
        global: {
          stubs: {
            MobileNavbarHeader: true,
            MobileBottomNav: true,
            MobileMenuDrawer: true,
          },
        },
      })

      const tabs = wrapper.vm.tabs
      expect(tabs).toHaveLength(2)
      expect(tabs[0].path).toBe('/')
      expect(tabs[0].label).toBe('nav.home')
      expect(tabs[1].path).toBe('/favorites')
      expect(tabs[1].label).toBe('favorites.title')
    })

    it('should include favoriteIds count as badge', async () => {
      const MobileNavbar = await import('./MobileNavbar.vue')
      const wrapper = mount(MobileNavbar.default, {
        global: {
          stubs: {
            MobileNavbarHeader: true,
            MobileBottomNav: true,
            MobileMenuDrawer: true,
          },
        },
      })

      const tabs = wrapper.vm.tabs
      expect(tabs[1].badge).toBe(2)
    })
  })

  describe('handleDrawerClose', () => {
    it('should close menu and return focus to header', async () => {
      const MobileNavbar = await import('./MobileNavbar.vue')
      const wrapper = mount(MobileNavbar.default, {
        global: {
          stubs: {
            MobileNavbarHeader: true,
            MobileBottomNav: true,
            MobileMenuDrawer: true,
          },
        },
      })

      // Open the menu first
      wrapper.vm.isMenuOpen = true

      // Call handleDrawerClose
      wrapper.vm.handleDrawerClose()

      expect(wrapper.vm.isMenuOpen).toBe(false)
    })
  })

  describe('keyboard handling', () => {
    it('should toggle menu on Enter key', async () => {
      const MobileNavbar = await import('./MobileNavbar.vue')
      const wrapper = mount(MobileNavbar.default, {
        global: {
          stubs: {
            MobileNavbarHeader: true,
            MobileBottomNav: true,
            MobileMenuDrawer: true,
          },
        },
      })

      expect(wrapper.vm.isMenuOpen).toBe(false)

      wrapper.vm.handleMenuKeyDown({ key: 'Enter', preventDefault: vi.fn() } as KeyboardEvent)

      expect(wrapper.vm.isMenuOpen).toBe(true)
    })

    it('should toggle menu on Space key', async () => {
      const MobileNavbar = await import('./MobileNavbar.vue')
      const wrapper = mount(MobileNavbar.default, {
        global: {
          stubs: {
            MobileNavbarHeader: true,
            MobileBottomNav: true,
            MobileMenuDrawer: true,
          },
        },
      })

      expect(wrapper.vm.isMenuOpen).toBe(false)

      wrapper.vm.handleMenuKeyDown({ key: ' ', preventDefault: vi.fn() } as KeyboardEvent)

      expect(wrapper.vm.isMenuOpen).toBe(true)
    })
  })
})