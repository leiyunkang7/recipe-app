import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

// Mock Nuxt components
const mockLocalePath = vi.fn((path: string) => path)
const mockUseRoute = vi.fn()

vi.mock('#imports', () => ({
  useI18n: vi.fn(() => ({
    locale: ref('zh-CN'),
    t: (key: string) => key,
  })),
  useLocalePath: vi.fn(() => mockLocalePath),
  useRoute: vi.fn(() => mockUseRoute()),
}))

// Mock NuxtLink
vi.mock('NuxtLink', () => ({
  default: {
    name: 'NuxtLink',
    template: '<a :href="to" :class="$attrs.class"><slot /></a>',
    props: ['to'],
  },
}))

describe('BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render the bottom navigation', async () => {
    mockUseRoute.mockReturnValue({
      path: '/',
    })

    const BottomNav = await import('./BottomNav.vue')
    const wrapper = mount(BottomNav.default, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to" :class="$attrs.class"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    expect(wrapper.find('nav').exists()).toBe(true)
    expect(wrapper.find('.fixed.bottom-0').exists()).toBe(true)
  })

  it('should render two tab items', async () => {
    mockUseRoute.mockReturnValue({
      path: '/',
    })

    const BottomNav = await import('./BottomNav.vue')
    const wrapper = mount(BottomNav.default, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    const tabs = wrapper.findAll('a')
    expect(tabs).toHaveLength(2)
  })

  it('should render home tab with house icon', async () => {
    mockUseRoute.mockReturnValue({
      path: '/',
    })

    const BottomNav = await import('./BottomNav.vue')
    const wrapper = mount(BottomNav.default, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    const tabs = wrapper.findAll('a')
    expect(tabs[0]!.html()).toContain('🏠')
  })

  it('should render admin tab with settings icon', async () => {
    mockUseRoute.mockReturnValue({
      path: '/',
    })

    const BottomNav = await import('./BottomNav.vue')
    const wrapper = mount(BottomNav.default, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    const tabs = wrapper.findAll('a')
    expect(tabs[1]!.html()).toContain('⚙️')
  })

  it('should have md:hidden class for desktop hidden', async () => {
    mockUseRoute.mockReturnValue({
      path: '/',
    })

    const BottomNav = await import('./BottomNav.vue')
    const wrapper = mount(BottomNav.default, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    const nav = wrapper.find('nav')
    expect(nav.classes()).toContain('md:hidden')
  })

  it('should apply orange color for active tab', async () => {
    mockUseRoute.mockReturnValue({
      path: '/',
    })

    const BottomNav = await import('./BottomNav.vue')
    const wrapper = mount(BottomNav.default, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    const nav = wrapper.find('nav')
    expect(nav.html()).toContain('text-orange-600')
  })

  it('should apply gray color for inactive tab', async () => {
    mockUseRoute.mockReturnValue({
      path: '/admin',
    })

    const BottomNav = await import('./BottomNav.vue')
    const wrapper = mount(BottomNav.default, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    const nav = wrapper.find('nav')
    expect(nav.html()).toContain('text-gray-500')
  })

  it('should render tab labels', async () => {
    mockUseRoute.mockReturnValue({
      path: '/',
    })

    const BottomNav = await import('./BottomNav.vue')
    const wrapper = mount(BottomNav.default, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><span><slot /></span></a>',
            props: ['to'],
          },
        },
      },
    })

    // Tab labels should be rendered
    const spans = wrapper.findAll('span.text-xs')
    expect(spans.length).toBe(2)
  })

  it('should apply safe-area-bottom class for iOS safe area', async () => {
    mockUseRoute.mockReturnValue({
      path: '/',
    })

    const BottomNav = await import('./BottomNav.vue')
    const wrapper = mount(BottomNav.default, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    const nav = wrapper.find('nav')
    expect(nav.classes()).toContain('safe-area-bottom')
  })

  it('should have z-50 for proper layering', async () => {
    mockUseRoute.mockReturnValue({
      path: '/',
    })

    const BottomNav = await import('./BottomNav.vue')
    const wrapper = mount(BottomNav.default, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    const nav = wrapper.find('nav')
    expect(nav.classes()).toContain('z-50')
  })

  it('should have correct background colors for light and dark mode', async () => {
    mockUseRoute.mockReturnValue({
      path: '/',
    })

    const BottomNav = await import('./BottomNav.vue')
    const wrapper = mount(BottomNav.default, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    const nav = wrapper.find('nav')
    expect(nav.classes()).toContain('bg-white')
    expect(nav.classes()).toContain('dark:bg-stone-900')
    expect(nav.classes()).toContain('border-t')
    expect(nav.classes()).toContain('border-gray-200')
    expect(nav.classes()).toContain('dark:border-stone-700')
  })

  it('should navigate to correct paths', async () => {
    mockUseRoute.mockReturnValue({
      path: '/',
    })

    const BottomNav = await import('./BottomNav.vue')
    const wrapper = mount(BottomNav.default, {
      global: {
        stubs: {
          NuxtLink: {
            template: '<a :href="to"><slot /></a>',
            props: ['to'],
          },
        },
      },
    })

    const links = wrapper.findAll('a')
    expect(links[0]!.attributes('href')).toBe('/')
    expect(links[1]!.attributes('href')).toBe('/admin')
  })
})