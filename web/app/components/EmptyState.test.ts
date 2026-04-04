import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Mock useI18n
vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'zh' },
  }),
}))

// Mock useLocalePath
vi.mock('~/utils', () => ({
  useLocalePath: vi.fn((path: string) => path),
}))

// Mock illustration components
vi.mock('~/components/EmptyPlateIllustration.vue', () => ({
  default: { name: 'EmptyPlateIllustration', template: '<div class="empty-plate-illustration-mock">Plate</div>' },
}))

vi.mock('~/components/FavoritesHeartIllustration.vue', () => ({
  default: { name: 'FavoritesHeartIllustration', template: '<div class="favorites-heart-illustration-mock">Heart</div>' },
}))

describe('EmptyState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering', () => {
    it('should render with default plate illustration', async () => {
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: {},
      })
      await flushPromises()

      expect(wrapper.find('.empty-plate-illustration-mock').exists()).toBe(true)
    })

    it('should render with heart illustration when specified', async () => {
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: { illustration: 'heart' },
      })
      await flushPromises()

      expect(wrapper.find('.favorites-heart-illustration-mock').exists()).toBe(true)
    })

    it('should render with search illustration', async () => {
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: { illustration: 'search' },
      })
      await flushPromises()

      // Search illustration has a specific SVG
      expect(wrapper.find('svg').exists()).toBe(true)
    })

    it('should render custom icon when provided', async () => {
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: { icon: '🍕' },
      })
      await flushPromises()

      expect(wrapper.find('.text-5xl').text()).toBe('🍕')
    })
  })

  describe('title and description', () => {
    it('should display custom title', async () => {
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: { title: 'Custom Title' },
      })
      await flushPromises()

      expect(wrapper.find('h3').text()).toBe('Custom Title')
    })

    it('should display custom description', async () => {
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: { description: 'Custom Description' },
      })
      await flushPromises()

      expect(wrapper.find('p').text()).toBe('Custom Description')
    })

    it('should display default title when none provided', async () => {
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: {},
      })
      await flushPromises()

      // Default title comes from i18n t('empty.state')
      expect(wrapper.find('h3').text()).toBe('empty.state')
    })

    it('should display default description when none provided', async () => {
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: {},
      })
      await flushPromises()

      // Default description comes from i18n t('empty.noData')
      expect(wrapper.find('p').text()).toBe('empty.noData')
    })
  })

  describe('action buttons', () => {
    it('should render primary action button when provided with to', async () => {
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: {
          action: { label: 'Add Recipe', to: '/add' },
        },
      })
      await flushPromises()

      const button = wrapper.find('a')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('Add Recipe')
    })

    it('should render primary action as button when onClick provided', async () => {
      const onClick = vi.fn()
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: {
          action: { label: 'Click Me', onClick },
        },
      })
      await flushPromises()

      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('Click Me')
    })

    it('should render secondary action button', async () => {
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: {
          action: { label: 'Primary' },
          secondaryAction: { label: 'Secondary' },
        },
      })
      await flushPromises()

      const buttons = wrapper.findAll('button, a')
      expect(buttons.length).toBe(2)
    })

    it('should call onClick when action button clicked', async () => {
      const onClick = vi.fn()
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: {
          action: { label: 'Click Me', onClick },
        },
      })
      await flushPromises()

      await wrapper.find('button').trigger('click')
      expect(onClick).toHaveBeenCalled()
    })
  })

  describe('styling', () => {
    it('should apply correct text alignment', async () => {
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: {},
      })
      await flushPromises()

      expect(wrapper.find('.text-center').exists()).toBe(true)
    })

    it('should apply responsive padding classes', async () => {
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: {},
      })
      await flushPromises()

      const container = wrapper.find('.text-center')
      expect(container.classes()).toContain('py-8')
      expect(container.classes()).toContain('md:py-12')
    })

    it('should apply orange theme for primary action', async () => {
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: {
          action: { label: 'Add', to: '/add' },
        },
      })
      await flushPromises()

      const button = wrapper.find('a')
      expect(button.classes()).toContain('bg-orange-600')
      expect(button.classes()).toContain('text-white')
    })

    it('should apply gray theme for secondary action', async () => {
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: {
          secondaryAction: { label: 'Cancel', to: '/' },
        },
      })
      await flushPromises()

      const button = wrapper.find('a')
      expect(button.classes()).toContain('bg-gray-100')
    })
  })

  describe('slots', () => {
    it('should render illustration slot when provided', async () => {
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: {},
        slots: {
          illustration: '<div class="custom-illustration">Custom</div>',
        },
      })
      await flushPromises()

      expect(wrapper.find('.custom-illustration').exists()).toBe(true)
    })

    it('should render actions slot when provided', async () => {
      const EmptyState = await import('./EmptyState.vue')
      const wrapper = mount(EmptyState.default, {
        props: {},
        slots: {
          actions: '<button class="slot-action">Slot Action</button>',
        },
      })
      await flushPromises()

      expect(wrapper.find('.slot-action').exists()).toBe(true)
    })
  })
})