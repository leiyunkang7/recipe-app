import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock NuxtLink
vi.mock('NuxtLink', () => ({
  default: {
    name: 'NuxtLink',
    template: '<a :href="to" :tabindex="tabindex" :aria-selected="ariaSelected" :class="class" :aria-label="ariaLabel" :aria-current="ariaCurrent" @touchstart.passive="onTouchstart" @touchend="onTouchend" @touchcancel="onTouchcancel" @keydown="onKeydown" @focus="onFocus"><slot /><slot name="icon" /></a>',
    props: ['to', 'tabindex', 'ariaSelected', 'class', 'ariaLabel', 'ariaCurrent'],
    emits: ['touchstart', 'touchend', 'touchcancel', 'keydown', 'focus'],
  },
}))

describe('MobileNavTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const defaultTab = {
    path: '/',
    icon: '🏠',
    activeIcon: '🏠',
    label: '首页',
    ariaLabel: '首页',
  }

  it('should render with correct props', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: false,
        isPressed: false,
        ripplePosition: null,
      },
    })

    expect(wrapper.exists()).toBe(true)
    expect(wrapper.find('a').exists()).toBe(true)
  })

  it('should display inactive icon when not active', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: false,
        isPressed: false,
        ripplePosition: null,
      },
    })

    const html = wrapper.html()
    expect(html).toContain('🏠')
  })

  it('should apply scale-90 class when pressed', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: false,
        isPressed: true,
        ripplePosition: null,
      },
    })

    const a = wrapper.find('a')
    expect(a.classes()).toContain('scale-90')
  })

  it('should not apply scale-90 when not pressed', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: false,
        isPressed: false,
        ripplePosition: null,
      },
    })

    const a = wrapper.find('a')
    expect(a.classes()).not.toContain('scale-90')
    expect(a.classes()).toContain('scale-100')
  })

  it('should apply orange text color when active', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: { ...defaultTab, icon: '🏠', activeIcon: '🏠' },
        isActive: true,
        isPressed: false,
        ripplePosition: null,
      },
    })

    const a = wrapper.find('a')
    expect(a.classes()).toContain('text-orange-600')
  })

  it('should apply gray text color when inactive', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: false,
        isPressed: false,
        ripplePosition: null,
      },
    })

    const a = wrapper.find('a')
    expect(a.classes()).toContain('text-gray-400')
  })

  it('should display label text', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: false,
        isPressed: false,
        ripplePosition: null,
      },
    })

    expect(wrapper.text()).toContain('首页')
  })

  it('should show ripple effect when pressed with position', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: false,
        isPressed: true,
        ripplePosition: { x: 20, y: 30 },
      },
    })

    const ripple = wrapper.find('.absolute.inset-0.overflow-hidden')
    expect(ripple.exists()).toBe(true)
  })

  it('should not show ripple effect when not pressed', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: false,
        isPressed: false,
        ripplePosition: null,
      },
    })

    const ripple = wrapper.find('.absolute.inset-0.overflow-hidden')
    expect(ripple.exists()).toBe(false)
  })

  it('should emit touchstart event', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: false,
        isPressed: false,
        ripplePosition: null,
      },
    })

    await wrapper.find('a').trigger('touchstart.passive')
    expect(wrapper.emitted('touchstart')).toBeTruthy()
  })

  it('should emit touchend event', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: false,
        isPressed: false,
        ripplePosition: null,
      },
    })

    await wrapper.find('a').trigger('touchend')
    expect(wrapper.emitted('touchend')).toBeTruthy()
  })

  it('should emit keydown event', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: false,
        isPressed: false,
        ripplePosition: null,
      },
    })

    await wrapper.find('a').trigger('keydown')
    expect(wrapper.emitted('navKeydown')).toBeTruthy()
  })

  it('should emit focus event', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: false,
        isPressed: false,
        ripplePosition: null,
      },
    })

    await wrapper.find('a').trigger('focus')
    expect(wrapper.emitted('tabFocus')).toBeTruthy()
  })

  it('should handle Enter key to click link', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: false,
        isPressed: false,
        ripplePosition: null,
      },
    })

    const link = wrapper.find('a')
    const clickSpy = vi.fn()
    link.element.click = clickSpy

    await wrapper.find('a').trigger('keydown', { key: 'Enter' })
    expect(clickSpy).toHaveBeenCalled()
  })

  it('should handle Space key to click link', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: false,
        isPressed: false,
        ripplePosition: null,
      },
    })

    const link = wrapper.find('a')
    const clickSpy = vi.fn()
    link.element.click = clickSpy

    await wrapper.find('a').trigger('keydown', { key: ' ' })
    expect(clickSpy).toHaveBeenCalled()
  })

  it('should apply tabindex 0 when active', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: true,
        isPressed: false,
        ripplePosition: null,
      },
    })

    expect(wrapper.find('a').attributes('tabindex')).toBe('0')
  })

  it('should apply tabindex -1 when inactive and not focused', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: false,
        isPressed: false,
        ripplePosition: null,
        isFocused: false,
      },
    })

    expect(wrapper.find('a').attributes('tabindex')).toBe('-1')
  })

  it('should show active indicator when isActive is true', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: true,
        isPressed: false,
        ripplePosition: null,
      },
    })

    // Active indicator is the bouncing dot at top
    const indicator = wrapper.find('.absolute.-top-0\\.5.left-1\\/2')
    expect(indicator.exists()).toBe(true)
  })

  it('should not show active indicator when isActive is false', async () => {
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: defaultTab,
        isActive: false,
        isPressed: false,
        ripplePosition: null,
      },
    })

    const indicator = wrapper.find('.absolute.-top-0\\.5.left-1\\/2')
    expect(indicator.exists()).toBe(false)
  })

  it('should show badge when tab has badge prop and not active', async () => {
    const tabWithBadge = { ...defaultTab, badge: 5 }
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: tabWithBadge,
        isActive: false,
        isPressed: false,
        ripplePosition: null,
      },
    })

    const badge = wrapper.find('.absolute.-top-0\\.5.-right-1\\.5')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('5')
  })

  it('should not show badge when isActive is true', async () => {
    const tabWithBadge = { ...defaultTab, badge: 5 }
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: tabWithBadge,
        isActive: true,
        isPressed: false,
        ripplePosition: null,
      },
    })

    const badge = wrapper.find('.absolute.-top-0\\.5.-right-1\\.5')
    expect(badge.exists()).toBe(false)
  })

  it('should display 99+ for badge values over 99', async () => {
    const tabWithLargeBadge = { ...defaultTab, badge: 150 }
    const MobileNavTab = await import('./MobileNavTab.vue')
    const wrapper = mount(MobileNavTab.default, {
      props: {
        tab: tabWithLargeBadge,
        isActive: false,
        isPressed: false,
        ripplePosition: null,
      },
    })

    const badge = wrapper.find('.absolute.-top-0\\.5.-right-1\\.5')
    expect(badge.text()).toContain('99+')
  })
})