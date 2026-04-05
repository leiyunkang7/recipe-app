import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

// Mock useI18n
vi.mock('~/composables/useI18n', () => ({
  useI18n: vi.fn(() => ({
    t: (key: string) => key,
    locale: ref('zh-CN'),
  })),
}))

// Mock useLocalePath
vi.mock('~/composables/useLocalePath', () => ({
  useLocalePath: vi.fn((path: string) => path),
}))

describe('DesktopNavLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const createMockLinks = () => [
    { path: '/', label: '首页', icon: '🏠', badge: 0 },
    { path: '/recipes', label: '食谱', icon: '🍳', badge: 5 },
    { path: '/favorites', label: '收藏', icon: '❤️', badge: undefined },
    { path: '/admin', label: '管理', icon: '⚙️', badge: 99 },
  ]

  const mockIsActive = (path: string) => (linkPath: string) => linkPath === path

  it('should render nav links correctly', async () => {
    const DesktopNavLinks = await import('./DesktopNavLinks.vue')
    const links = createMockLinks()

    const wrapper = mount(DesktopNavLinks.default, {
      props: {
        links,
        isActive: mockIsActive('/'),
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to" :tabindex="tabindex" :class="$attrs.class" :role="role" :aria-current="ariaCurrent"><slot /></a>',
            props: ['to', 'tabindex', 'role', 'ariaCurrent'],
          },
        },
      },
    })

    await flushPromises()

    const navLinks = wrapper.findAll('a')
    expect(navLinks.length).toBe(4)
  })

  it('should render badge when link has badge > 0', async () => {
    const DesktopNavLinks = await import('./DesktopNavLinks.vue')
    const links = createMockLinks()

    const wrapper = mount(DesktopNavLinks.default, {
      props: {
        links,
        isActive: mockIsActive('/'),
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to" :tabindex="tabindex" :class="$attrs.class"><slot /><span v-if="$slots.badge"><slot name="badge" /></span></a>',
            props: ['to', 'tabindex'],
          },
        },
      },
    })

    await flushPromises()

    // Badge should be visible for links with badge > 0 (index 1 has badge 5, index 3 has badge 99)
    const nav = wrapper.find('nav')
    expect(nav.html()).toContain('5')
    expect(nav.html()).toContain('99')
  })

  it('does not render badge when badge is 0 or undefined', async () => {
    const DesktopNavLinks = await import('./DesktopNavLinks.vue')
    const links = createMockLinks()

    const wrapper = mount(DesktopNavLinks.default, {
      props: {
        links,
        isActive: mockIsActive('/'),
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to" :tabindex="tabindex" :class="$attrs.class"><slot /></a>',
            props: ['to', 'tabindex'],
          },
        },
      },
    })

    await flushPromises()

    const navLinks = wrapper.findAll('a')
    // First link has badge 0 - should not show badge
    // Third link has badge undefined - should not show badge
    navLinks.forEach((link, index) => {
      if (index === 0 || index === 2) {
        expect(link.html()).not.toContain('badge')
      }
    })
  })

  it('applies correct active styling based on isActive', async () => {
    const DesktopNavLinks = await import('./DesktopNavLinks.vue')
    const links = createMockLinks()

    const wrapper = mount(DesktopNavLinks.default, {
      props: {
        links,
        isActive: mockIsActive('/recipes'),
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to" :tabindex="tabindex" :class="$attrs.class" :aria-current="ariaCurrent"><slot /></a>',
            props: ['to', 'tabindex', 'ariaCurrent'],
          },
        },
      },
    })

    await flushPromises()

    const navLinks = wrapper.findAll('a')
    // /recipes is active, should have aria-current="page"
    const recipesLink = navLinks[1]!
    expect(recipesLink.attributes('aria-current')).toBe('page')

    // Other links should not have aria-current
    const homeLink = navLinks[0]!
    expect(homeLink.attributes('aria-current')).toBeUndefined()
  })

  it('applies correct inactive styling when not active', async () => {
    const DesktopNavLinks = await import('./DesktopNavLinks.vue')
    const links = createMockLinks()

    const wrapper = mount(DesktopNavLinks.default, {
      props: {
        links,
        isActive: mockIsActive('/other'),
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to" :tabindex="tabindex" :class="$attrs.class" :aria-current="ariaCurrent"><slot /></a>',
            props: ['to', 'tabindex', 'ariaCurrent'],
          },
        },
      },
    })

    await flushPromises()

    const navLinks = wrapper.findAll('a')
    // No link should have aria-current when none match
    navLinks.forEach((link) => {
      expect(link.attributes('aria-current')).toBeUndefined()
    })
  })

  it('has role="menubar" on nav element', async () => {
    const DesktopNavLinks = await import('./DesktopNavLinks.vue')
    const links = createMockLinks()

    const wrapper = mount(DesktopNavLinks.default, {
      props: {
        links,
        isActive: mockIsActive('/'),
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    await flushPromises()

    const nav = wrapper.find('nav')
    expect(nav.attributes('role')).toBe('menubar')
  })

  it('has role="menuitem" on each link', async () => {
    const DesktopNavLinks = await import('./DesktopNavLinks.vue')
    const links = createMockLinks()

    const wrapper = mount(DesktopNavLinks.default, {
      props: {
        links,
        isActive: mockIsActive('/'),
      },
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to" :role="role"><slot /></a>',
            props: ['to', 'role'],
          },
        },
      },
    })

    await flushPromises()

    const navLinks = wrapper.findAll('a')
    navLinks.forEach((link) => {
      expect(link.attributes('role')).toBe('menuitem')
    })
  })

  describe('keyboard navigation', () => {
    it('handles ArrowRight key to move focus to next item', async () => {
      const DesktopNavLinks = await import('./DesktopNavLinks.vue')
      const links = createMockLinks()

      const wrapper = mount(DesktopNavLinks.default, {
        props: {
          links,
          isActive: mockIsActive('/'),
        },
        global: {
          stubs: {
            NuxtLink: {
              template: '<a :href="to" :tabindex="tabindex" :class="$attrs.class" role="menuitem" @keydown="$emit(\'keydown\', $event)"><slot /></a>',
              props: ['to', 'tabindex'],
              emits: ['keydown'],
            },
          },
        },
      })

      await flushPromises()

      const nav = wrapper.find('nav')
      const firstLink = wrapper.findAll('a')[0]!

      // Simulate ArrowRight key on first link
      await firstLink.trigger('keydown', {
        key: 'ArrowRight',
        currentTarget: firstLink.element,
      })

      await flushPromises()

      // Focused index should move to next item
      const focusedLinks = wrapper.findAll('a[tabindex="0"]')
      expect(focusedLinks.length).toBeGreaterThan(0)
    })

    it('handles ArrowLeft key to move focus to previous item', async () => {
      const DesktopNavLinks = await import('./DesktopNavLinks.vue')
      const links = createMockLinks()

      const wrapper = mount(DesktopNavLinks.default, {
        props: {
          links,
          isActive: mockIsActive('/'),
        },
        global: {
          stubs: {
            NuxtLink: {
              template: '<a :href="to" :tabindex="tabindex" :class="$attrs.class" role="menuitem"><slot /></a>',
              props: ['to', 'tabindex'],
            },
          },
        },
      })

      await flushPromises()

      const lastLink = wrapper.findAll('a')[3]!

      // Simulate ArrowLeft key
      await lastLink.trigger('keydown', {
        key: 'ArrowLeft',
        currentTarget: lastLink.element,
      })

      await flushPromises()

      // Focused index should move to previous item
      const focusedLinks = wrapper.findAll('a[tabindex="0"]')
      expect(focusedLinks.length).toBeGreaterThan(0)
    })

    it('handles Home key to focus first item', async () => {
      const DesktopNavLinks = await import('./DesktopNavLinks.vue')
      const links = createMockLinks()

      const wrapper = mount(DesktopNavLinks.default, {
        props: {
          links,
          isActive: mockIsActive('/'),
        },
        global: {
          stubs: {
            NuxtLink: {
              template: '<a :href="to" :tabindex="tabindex" :class="$attrs.class" role="menuitem"><slot /></a>',
              props: ['to', 'tabindex'],
            },
          },
        },
      })

      await flushPromises()

      const lastLink = wrapper.findAll('a')[3]!

      // Simulate Home key
      await lastLink.trigger('keydown', {
        key: 'Home',
        currentTarget: lastLink.element,
      })

      await flushPromises()

      // First link should now be focused (tabindex 0)
      const firstLink = wrapper.findAll('a')[0]!
      expect(firstLink.attributes('tabindex')).toBe('0')
    })

    it('handles End key to focus last item', async () => {
      const DesktopNavLinks = await import('./DesktopNavLinks.vue')
      const links = createMockLinks()

      const wrapper = mount(DesktopNavLinks.default, {
        props: {
          links,
          isActive: mockIsActive('/'),
        },
        global: {
          stubs: {
            NuxtLink: {
              template: '<a :href="to" :tabindex="tabindex" :class="$attrs.class" role="menuitem"><slot /></a>',
              props: ['to', 'tabindex'],
            },
          },
        },
      })

      await flushPromises()

      const firstLink = wrapper.findAll('a')[0]!

      // Simulate End key
      await firstLink.trigger('keydown', {
        key: 'End',
        currentTarget: firstLink.element,
      })

      await flushPromises()

      // Last link should now be focused (tabindex 0)
      const lastLink = wrapper.findAll('a')[3]!
      expect(lastLink.attributes('tabindex')).toBe('0')
    })

    it('wraps around from last to first on ArrowRight', async () => {
      const DesktopNavLinks = await import('./DesktopNavLinks.vue')
      const links = createMockLinks()

      const wrapper = mount(DesktopNavLinks.default, {
        props: {
          links,
          isActive: mockIsActive('/'),
        },
        global: {
          stubs: {
            NuxtLink: {
              template: '<a :href="to" :tabindex="tabindex" :class="$attrs.class" role="menuitem"><slot /></a>',
              props: ['to', 'tabindex'],
            },
          },
        },
      })

      await flushPromises()

      const lastLink = wrapper.findAll('a')[3]!

      // Simulate ArrowRight on last item (should wrap to first)
      await lastLink.trigger('keydown', {
        key: 'ArrowRight',
        currentTarget: lastLink.element,
      })

      await flushPromises()

      // First link should now be focused (tabindex 0)
      const firstLink = wrapper.findAll('a')[0]!
      expect(firstLink.attributes('tabindex')).toBe('0')
    })

    it('wraps around from first to last on ArrowLeft', async () => {
      const DesktopNavLinks = await import('./DesktopNavLinks.vue')
      const links = createMockLinks()

      const wrapper = mount(DesktopNavLinks.default, {
        props: {
          links,
          isActive: mockIsActive('/'),
        },
        global: {
          stubs: {
            NuxtLink: {
              template: '<a :href="to" :tabindex="tabindex" :class="$attrs.class" role="menuitem"><slot /></a>',
              props: ['to', 'tabindex'],
            },
          },
        },
      })

      await flushPromises()

      const firstLink = wrapper.findAll('a')[0]!

      // Simulate ArrowLeft on first item (should wrap to last)
      await firstLink.trigger('keydown', {
        key: 'ArrowLeft',
        currentTarget: firstLink.element,
      })

      await flushPromises()

      // Last link should now be focused (tabindex 0)
      const lastLink = wrapper.findAll('a')[3]!
      expect(lastLink.attributes('tabindex')).toBe('0')
    })
  })

  describe('roving tabindex', () => {
    it('focused item has tabindex 0', async () => {
      const DesktopNavLinks = await import('./DesktopNavLinks.vue')
      const links = createMockLinks()

      const wrapper = mount(DesktopNavLinks.default, {
        props: {
          links,
          isActive: mockIsActive('/'),
        },
        global: {
          stubs: {
            NuxtLink: {
              template: '<a :href="to" :tabindex="tabindex" role="menuitem"><slot /></a>',
              props: ['to', 'tabindex'],
            },
          },
        },
      })

      await flushPromises()

      // First item should have tabindex 0 by default
      const firstLink = wrapper.findAll('a')[0]!
      expect(firstLink.attributes('tabindex')).toBe('0')
    })

    it('non-focused items have tabindex -1', async () => {
      const DesktopNavLinks = await import('./DesktopNavLinks.vue')
      const links = createMockLinks()

      const wrapper = mount(DesktopNavLinks.default, {
        props: {
          links,
          isActive: mockIsActive('/'),
        },
        global: {
          stubs: {
            NuxtLink: {
              template: '<a :href="to" :tabindex="tabindex" role="menuitem"><slot /></a>',
              props: ['to', 'tabindex'],
            },
          },
        },
      })

      await flushPromises()

      const navLinks = wrapper.findAll('a')
      // All items except the first should have tabindex -1
      navLinks.slice(1).forEach((link) => {
        expect(link.attributes('tabindex')).toBe('-1')
      })
    })

    it('updates tabindex when focus changes via keyboard', async () => {
      const DesktopNavLinks = await import('./DesktopNavLinks.vue')
      const links = createMockLinks()

      const wrapper = mount(DesktopNavLinks.default, {
        props: {
          links,
          isActive: mockIsActive('/'),
        },
        global: {
          stubs: {
            NuxtLink: {
              template: '<a :href="to" :tabindex="tabindex" role="menuitem"><slot /></a>',
              props: ['to', 'tabindex'],
            },
          },
        },
      })

      await flushPromises()

      const firstLink = wrapper.findAll('a')[0]!

      // Simulate ArrowRight to move focus to second item
      await firstLink.trigger('keydown', {
        key: 'ArrowRight',
        currentTarget: firstLink.element,
      })

      await flushPromises()

      // Now second item should have tabindex 0
      const secondLink = wrapper.findAll('a')[1]!
      expect(secondLink.attributes('tabindex')).toBe('0')

      // First item should now have tabindex -1
      expect(firstLink.attributes('tabindex')).toBe('-1')
    })
  })
})