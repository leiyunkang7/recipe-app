import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Mock useI18n
vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'zh' },
  }),
}))

describe('RecipeErrorState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('conditional rendering', () => {
    it('should not render when error is null', async () => {
      const RecipeErrorState = await import('./RecipeErrorState.vue')
      const wrapper = mount(RecipeErrorState.default, {
        props: {
          error: null,
        },
      })

      expect(wrapper.find('div').exists()).toBe(false)
    })

    it('should not render when error is empty string', async () => {
      const RecipeErrorState = await import('./RecipeErrorState.vue')
      const wrapper = mount(RecipeErrorState.default, {
        props: {
          error: '',
        },
      })

      expect(wrapper.find('div').exists()).toBe(false)
    })

    it('should render error message when error is provided', async () => {
      const RecipeErrorState = await import('./RecipeErrorState.vue')
      const wrapper = mount(RecipeErrorState.default, {
        props: {
          error: 'Something went wrong',
        },
      })

      expect(wrapper.text()).toContain('Something went wrong')
    })
  })

  describe('retry button', () => {
    it('should display retry button', async () => {
      const RecipeErrorState = await import('./RecipeErrorState.vue')
      const wrapper = mount(RecipeErrorState.default, {
        props: {
          error: 'Network error',
        },
      })

      const retryButton = wrapper.find('button')
      expect(retryButton.exists()).toBe(true)
      expect(retryButton.text()).toContain('error.retry')
    })

    it('should emit retry event when button is clicked', async () => {
      const RecipeErrorState = await import('./RecipeErrorState.vue')
      const wrapper = mount(RecipeErrorState.default, {
        props: {
          error: 'Network error',
        },
      })

      const retryButton = wrapper.find('button')
      await retryButton.trigger('click')

      expect(wrapper.emitted('retry')).toBeTruthy()
      expect(wrapper.emitted('retry')?.length).toBe(1)
    })
  })

  describe('styling', () => {
    it('should apply correct styling classes', async () => {
      const RecipeErrorState = await import('./RecipeErrorState.vue')
      const wrapper = mount(RecipeErrorState.default, {
        props: {
          error: 'Error message',
        },
      })

      const container = wrapper.find('div')
      expect(container.classes()).toContain('max-w-md')
      expect(container.classes()).toContain('mx-auto')

      const card = container.find('div')
      expect(card.classes()).toContain('bg-red-50/80')
      expect(card.classes()).toContain('dark:bg-red-900/30')
      expect(card.classes()).toContain('backdrop-blur-sm')
      expect(card.classes()).toContain('border-red-200')
      expect(card.classes()).toContain('dark:border-red-800')
      expect(card.classes()).toContain('rounded-2xl')
      expect(card.classes()).toContain('p-8')
      expect(card.classes()).toContain('text-center')
    })

    it('should render emoji icon', async () => {
      const RecipeErrorState = await import('./RecipeErrorState.vue')
      const wrapper = mount(RecipeErrorState.default, {
        props: {
          error: 'Error message',
        },
      })

      expect(wrapper.text()).toContain('😕')
    })
  })

  describe('accessibility', () => {
    it('should have proper structure for screen readers', async () => {
      const RecipeErrorState = await import('./RecipeErrorState.vue')
      const wrapper = mount(RecipeErrorState.default, {
        props: {
          error: 'Error message',
        },
      })

      expect(wrapper.find('h3').exists()).toBe(true)
      expect(wrapper.find('p').exists()).toBe(true)
    })
  })
})