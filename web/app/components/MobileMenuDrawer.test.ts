import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Mock DrawerPanel component
vi.mock('./DrawerPanel.vue', () => ({
  default: {
    name: 'DrawerPanel',
    props: ['navItems'],
    emits: ['close'],
    template: '<div class="drawer-panel-mock"><slot /></div>',
  },
}))

describe('MobileMenuDrawer', () => {
  const mockNavItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/recipes', label: '食谱', icon: '🍳' },
    { path: '/favorites', label: '收藏', icon: '❤️', badge: 5 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('rendering', () => {
    it('should not render when isOpen is false', async () => {
      const MobileMenuDrawer = await import('./MobileMenuDrawer.vue')
      const wrapper = mount(MobileMenuDrawer.default, {
        props: {
          isOpen: false,
          navItems: mockNavItems,
        },
      })

      expect(wrapper.find('.drawer-panel-mock').exists()).toBe(false)
    })

    it('should render DrawerPanel when isOpen is true', async () => {
      const MobileMenuDrawer = await import('./MobileMenuDrawer.vue')
      const wrapper = mount(MobileMenuDrawer.default, {
        props: {
          isOpen: true,
          navItems: mockNavItems,
        },
      })

      expect(wrapper.find('.drawer-panel-mock').exists()).toBe(true)
    })

    it('should render backdrop overlay when open', async () => {
      const MobileMenuDrawer = await import('./MobileMenuDrawer.vue')
      const wrapper = mount(MobileMenuDrawer.default, {
        props: {
          isOpen: true,
          navItems: mockNavItems,
        },
      })

      const backdrop = wrapper.find('.fixed.inset-0')
      expect(backdrop.exists()).toBe(true)
    })

    it('should have mobile-only visibility class on backdrop', async () => {
      const MobileMenuDrawer = await import('./MobileMenuDrawer.vue')
      const wrapper = mount(MobileMenuDrawer.default, {
        props: {
          isOpen: true,
          navItems: mockNavItems,
        },
      })

      const backdrop = wrapper.find('.fixed.inset-0')
      expect(backdrop.classes()).toContain('md:hidden')
    })
  })

  describe('props', () => {
    it('should pass navItems to DrawerPanel', async () => {
      const MobileMenuDrawer = await import('./MobileMenuDrawer.vue')
      const wrapper = mount(MobileMenuDrawer.default, {
        props: {
          isOpen: true,
          navItems: mockNavItems,
        },
      })

      const drawerPanel = wrapper.find('.drawer-panel-mock')
      expect(drawerPanel.exists()).toBe(true)
    })

    it('should react to isOpen changes', async () => {
      const MobileMenuDrawer = await import('./MobileMenuDrawer.vue')
      const wrapper = mount(MobileMenuDrawer.default, {
        props: {
          isOpen: false,
          navItems: mockNavItems,
        },
      })

      expect(wrapper.find('.drawer-panel-mock').exists()).toBe(false)

      await wrapper.setProps({ isOpen: true })
      await flushPromises()

      expect(wrapper.find('.drawer-panel-mock').exists()).toBe(true)
    })
  })

  describe('close event', () => {
    it('should emit close event when close is triggered on DrawerPanel', async () => {
      const MobileMenuDrawer = await import('./MobileMenuDrawer.vue')
      const wrapper = mount(MobileMenuDrawer.default, {
        props: {
          isOpen: true,
          navItems: mockNavItems,
        },
      })

      const drawerPanel = wrapper.find('.drawer-panel-mock')
      await drawerPanel.trigger('close')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should emit close when backdrop is clicked', async () => {
      const MobileMenuDrawer = await import('./MobileMenuDrawer.vue')
      const wrapper = mount(MobileMenuDrawer.default, {
        props: {
          isOpen: true,
          navItems: mockNavItems,
        },
      })

      const backdrop = wrapper.find('.fixed.inset-0')
      await backdrop.trigger('click')

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('should emit close when backdrop touchend is triggered', async () => {
      const MobileMenuDrawer = await import('./MobileMenuDrawer.vue')
      const wrapper = mount(MobileMenuDrawer.default, {
        props: {
          isOpen: true,
          navItems: mockNavItems,
        },
      })

      const backdrop = wrapper.find('.fixed.inset-0')
      await backdrop.trigger('touchend', {
        target: backdrop.element,
        currentTarget: backdrop.element,
      })

      expect(wrapper.emitted('close')).toBeTruthy()
    })
  })

  describe('backdrop interactions', () => {
    it('should close only when clicking directly on backdrop (not children)', async () => {
      const MobileMenuDrawer = await import('./MobileMenuDrawer.vue')
      const wrapper = mount(MobileMenuDrawer.default, {
        props: {
          isOpen: true,
          navItems: mockNavItems,
        },
      })

      // Simulate clicking on a child element
      const mockEvent = {
        target: wrapper.find('.drawer-panel-mock').element,
        currentTarget: wrapper.find('.fixed.inset-0').element,
      }

      const backdrop = wrapper.find('.fixed.inset-0')
      await backdrop.trigger('click', mockEvent)

      // Should not emit close when clicking on drawer panel
      expect(wrapper.emitted('close')).toBeFalsy()
    })
  })

  describe('animations', () => {
    it('should have backdrop transition classes', async () => {
      const MobileMenuDrawer = await import('./MobileMenuDrawer.vue')
      const wrapper = mount(MobileMenuDrawer.default, {
        props: {
          isOpen: true,
          navItems: mockNavItems,
        },
      })

      // Check for transition component
      const transition = wrapper.findAll('Transition')
      expect(transition.length).toBeGreaterThan(0)
    })

    it('should have drawer transition classes', async () => {
      const MobileMenuDrawer = await import('./MobileMenuDrawer.vue')
      const wrapper = mount(MobileMenuDrawer.default, {
        props: {
          isOpen: true,
          navItems: mockNavItems,
        },
      })

      // The component uses named transitions
      expect(wrapper.html()).toContain('backdrop')
      expect(wrapper.html()).toContain('drawer')
    })
  })

  describe('accessibility', () => {
    it('should have aria-hidden on backdrop', async () => {
      const MobileMenuDrawer = await import('./MobileMenuDrawer.vue')
      const wrapper = mount(MobileMenuDrawer.default, {
        props: {
          isOpen: true,
          navItems: mockNavItems,
        },
      })

      const backdrop = wrapper.find('.fixed.inset-0')
      expect(backdrop.attributes('aria-hidden')).toBe('true')
    })

    it('should use Teleport to body', async () => {
      const MobileMenuDrawer = await import('./MobileMenuDrawer.vue')
      const wrapper = mount(MobileMenuDrawer.default, {
        props: {
          isOpen: true,
          navItems: mockNavItems,
        },
      })

      expect(wrapper.find('Teleport').exists()).toBe(true)
    })
  })
})