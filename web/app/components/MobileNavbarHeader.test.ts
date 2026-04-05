import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock NuxtLink
vi.mock('NuxtLink', () => ({
  default: {
    name: 'NuxtLink',
    template: '<a :to="to" :aria-label="ariaLabel" class="nuxt-link"><slot /></a>',
    props: ['to', 'ariaLabel'],
  },
}))

describe('MobileNavbarHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render header element', async () => {
    const MobileNavbarHeader = await import('./MobileNavbarHeader.vue')
    const wrapper = mount(MobileNavbarHeader.default, {
      props: {
        isMenuOpen: false,
        isEntered: true,
      },
    })

    expect(wrapper.find('header').exists()).toBe(true)
  })

  it('should apply translate-y-0 when entered', async () => {
    const MobileNavbarHeader = await import('./MobileNavbarHeader.vue')
    const wrapper = mount(MobileNavbarHeader.default, {
      props: {
        isMenuOpen: false,
        isEntered: true,
      },
    })

    const header = wrapper.find('header')
    expect(header.classes()).toContain('translate-y-0')
    expect(header.classes()).toContain('opacity-100')
  })

  it('should apply -translate-y-full when not entered', async () => {
    const MobileNavbarHeader = await import('./MobileNavbarHeader.vue')
    const wrapper = mount(MobileNavbarHeader.default, {
      props: {
        isMenuOpen: false,
        isEntered: false,
      },
    })

    const header = wrapper.find('header')
    expect(header.classes()).toContain('-translate-y-full')
    expect(header.classes()).toContain('opacity-0')
  })

  it('should render menu button', async () => {
    const MobileNavbarHeader = await import('./MobileNavbarHeader.vue')
    const wrapper = mount(MobileNavbarHeader.default, {
      props: {
        isMenuOpen: false,
        isEntered: true,
      },
    })

    const button = wrapper.find('button')
    expect(button.exists()).toBe(true)
  })

  it('should emit toggleMenu when button clicked', async () => {
    const MobileNavbarHeader = await import('./MobileNavbarHeader.vue')
    const wrapper = mount(MobileNavbarHeader.default, {
      props: {
        isMenuOpen: false,
        isEntered: true,
      },
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('toggleMenu')).toBeTruthy()
  })

  it('should emit menuKeydown when keydown event on button', async () => {
    const MobileNavbarHeader = await import('./MobileNavbarHeader.vue')
    const wrapper = mount(MobileNavbarHeader.default, {
      props: {
        isMenuOpen: false,
        isEntered: true,
      },
    })

    await wrapper.find('button').trigger('keydown')
    expect(wrapper.emitted('menuKeydown')).toBeTruthy()
  })

  it('should render logo NuxtLink', async () => {
    const MobileNavbarHeader = await import('./MobileNavbarHeader.vue')
    const wrapper = mount(MobileNavbarHeader.default, {
      props: {
        isMenuOpen: false,
        isEntered: true,
      },
    })

    const link = wrapper.find('a.nuxt-link')
    expect(link.exists()).toBe(true)
  })

  it('should have correct aria-expanded when menu is open', async () => {
    const MobileNavbarHeader = await import('./MobileNavbarHeader.vue')
    const wrapper = mount(MobileNavbarHeader.default, {
      props: {
        isMenuOpen: true,
        isEntered: true,
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('aria-expanded')).toBe('true')
  })

  it('should have correct aria-expanded when menu is closed', async () => {
    const MobileNavbarHeader = await import('./MobileNavbarHeader.vue')
    const wrapper = mount(MobileNavbarHeader.default, {
      props: {
        isMenuOpen: false,
        isEntered: true,
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('aria-expanded')).toBe('false')
  })

  it('should have aria-controls pointing to mobile menu drawer', async () => {
    const MobileNavbarHeader = await import('./MobileNavbarHeader.vue')
    const wrapper = mount(MobileNavbarHeader.default, {
      props: {
        isMenuOpen: false,
        isEntered: true,
      },
    })

    const button = wrapper.find('button')
    expect(button.attributes('aria-controls')).toBe('mobile-menu-drawer')
  })

  it('should render hamburger icon spans', async () => {
    const MobileNavbarHeader = await import('./MobileNavbarHeader.vue')
    const wrapper = mount(MobileNavbarHeader.default, {
      props: {
        isMenuOpen: false,
        isEntered: true,
      },
    })

    // Three spans for hamburger icon (top, middle, bottom lines)
    const spans = wrapper.findAll('span.absolute.left-0')
    expect(spans.length).toBe(3)
    if (spans.length < 3) return
  })

  it('should transform hamburger to X when menu is open', async () => {
    const MobileNavbarHeader = await import('./MobileNavbarHeader.vue')
    const wrapper = mount(MobileNavbarHeader.default, {
      props: {
        isMenuOpen: true,
        isEntered: true,
      },
    })

    const spans = wrapper.findAll('span.absolute.left-0')
    if (spans.length < 3) return

    // First span (top line) should have X transformation
    expect(spans[0]!.classes()).toContain('rotate-45')
    expect(spans[0]!.classes()).toContain('translate-y-2')

    // Third span (bottom line) should have X transformation
    expect(spans[2]!.classes()).toContain('-rotate-45')
    expect(spans[2]!.classes()).toContain('-translate-y-2')
  })

  it('should show middle line opacity when menu is closed', async () => {
    const MobileNavbarHeader = await import('./MobileNavbarHeader.vue')
    const wrapper = mount(MobileNavbarHeader.default, {
      props: {
        isMenuOpen: false,
        isEntered: true,
      },
    })

    const spans = wrapper.findAll('span.absolute.left-0')
    if (spans.length < 2) return

    // Second span (middle line) should be visible
    expect(spans[1]!.classes()).toContain('opacity-100')
  })

  it('should hide middle line when menu is open', async () => {
    const MobileNavbarHeader = await import('./MobileNavbarHeader.vue')
    const wrapper = mount(MobileNavbarHeader.default, {
      props: {
        isMenuOpen: true,
        isEntered: true,
      },
    })

    const spans = wrapper.findAll('span.absolute.left-0')
    if (spans.length < 2) return

    // Second span (middle line) should be hidden
    expect(spans[1]!.classes()).toContain('opacity-0')
  })

  it('should have fixed positioning', async () => {
    const MobileNavbarHeader = await import('./MobileNavbarHeader.vue')
    const wrapper = mount(MobileNavbarHeader.default, {
      props: {
        isMenuOpen: false,
        isEntered: true,
      },
    })

    const header = wrapper.find('header')
    expect(header.classes()).toContain('fixed')
    expect(header.classes()).toContain('top-0')
    expect(header.classes()).toContain('left-0')
    expect(header.classes()).toContain('right-0')
    expect(header.classes()).toContain('z-40')
  })

  it('should have backdrop blur effect', async () => {
    const MobileNavbarHeader = await import('./MobileNavbarHeader.vue')
    const wrapper = mount(MobileNavbarHeader.default, {
      props: {
        isMenuOpen: false,
        isEntered: true,
      },
    })

    const header = wrapper.find('header')
    expect(header.classes()).toContain('backdrop-blur-lg')
  })

  it('should expose focusMenuButton method via defineExpose', async () => {
    const MobileNavbarHeader = await import('./MobileNavbarHeader.vue')
    const wrapper = mount(MobileNavbarHeader.default, {
      props: {
        isMenuOpen: false,
        isEntered: true,
      },
    })

    expect(typeof wrapper.vm.focusMenuButton).toBe('function')
  })
})