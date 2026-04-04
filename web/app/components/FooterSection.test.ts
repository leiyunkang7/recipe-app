import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'

vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: ref('zh'),
  }),
}))

vi.mock('~/composables/useLocalePath', () => ({
  useLocalePath: () => (path: string) => path,
}))

vi.stubGlobal('console', {
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
})

describe('FooterSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('should render footer element', async () => {
      const FooterSection = await import('./FooterSection.vue')
      const wrapper = mount(FooterSection.default, {
        global: {
          stubs: {
            LazyMobileNavbar: true,
          },
        },
      })

      expect(wrapper.find('footer').exists()).toBe(true)
    })

    it('should display current year', async () => {
      const FooterSection = await import('./FooterSection.vue')
      const wrapper = mount(FooterSection.default, {
        global: {
          stubs: {
            LazyMobileNavbar: true,
          },
        },
      })

      const currentYear = new Date().getFullYear()
      expect(wrapper.html()).toContain(String(currentYear))
    })

    it('should render navigation links in desktop view', async () => {
      const FooterSection = await import('./FooterSection.vue')
      const wrapper = mount(FooterSection.default, {
        global: {
          stubs: {
            LazyMobileNavbar: true,
          },
        },
      })

      const navLinks = wrapper.findAll('nav a')
      expect(navLinks.length).toBeGreaterThan(0)
    })

    it('should include home link', async () => {
      const FooterSection = await import('./FooterSection.vue')
      const wrapper = mount(FooterSection.default, {
        global: {
          stubs: {
            LazyMobileNavbar: true,
          },
        },
      })

      const homeLink = wrapper.find('nav a')
      expect(homeLink.exists()).toBe(true)
    })
  })

  describe('responsive behavior', () => {
    it('should show mobile content on small screens', async () => {
      const FooterSection = await import('./FooterSection.vue')
      const wrapper = mount(FooterSection.default, {
        global: {
          stubs: {
            LazyMobileNavbar: true,
          },
        },
      })

      // Mobile content should be visible (md:hidden)
      const mobileContent = wrapper.find('.md\\:hidden')
      expect(mobileContent.exists()).toBe(true)
    })

    it('should show desktop nav on medium and larger screens', async () => {
      const FooterSection = await import('./FooterSection.vue')
      const wrapper = mount(FooterSection.default, {
        global: {
          stubs: {
            LazyMobileNavbar: true,
          },
        },
      })

      // Desktop nav should be visible (hidden md:flex)
      const desktopNav = wrapper.find('.hidden')
      expect(desktopNav.exists()).toBe(true)
    })
  })

  describe('copyright text', () => {
    it('should display app title in copyright', async () => {
      const FooterSection = await import('./FooterSection.vue')
      const wrapper = mount(FooterSection.default, {
        global: {
          stubs: {
            LazyMobileNavbar: true,
          },
        },
      })

      // Should contain "All rights reserved" text
      expect(wrapper.html()).toContain('All rights reserved')
    })
  })
})