import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock useI18n
vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'zh' },
  }),
}))

describe('RecipeLoadMoreTrigger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render loading state when hasMore is true and loadingMore is true', async () => {
      const RecipeLoadMoreTrigger = await import('./RecipeLoadMoreTrigger.vue')
      const wrapper = mount(RecipeLoadMoreTrigger.default, {
        props: {
          hasMore: true,
          loadingMore: true,
        },
      })

      expect(wrapper.find('.animate-spin').exists()).toBe(true)
      expect(wrapper.text()).toContain('common.loading')
    })

    it('should render no more data when hasMore is false', async () => {
      const RecipeLoadMoreTrigger = await import('./RecipeLoadMoreTrigger.vue')
      const wrapper = mount(RecipeLoadMoreTrigger.default, {
        props: {
          hasMore: false,
          loadingMore: false,
        },
      })

      expect(wrapper.text()).toContain('common.noMoreData')
      expect(wrapper.find('.animate-spin').exists()).toBe(false)
    })

    it('should render nothing when hasMore is true and loadingMore is false', async () => {
      const RecipeLoadMoreTrigger = await import('./RecipeLoadMoreTrigger.vue')
      const wrapper = mount(RecipeLoadMoreTrigger.default, {
        props: {
          hasMore: true,
          loadingMore: false,
        },
      })

      // Should show nothing (empty div)
      expect(wrapper.find('.animate-spin').exists()).toBe(false)
      expect(wrapper.text()).toBe('')
    })
  })

  describe('loading spinner', () => {
    it('should have proper spinner structure', async () => {
      const RecipeLoadMoreTrigger = await import('./RecipeLoadMoreTrigger.vue')
      const wrapper = mount(RecipeLoadMoreTrigger.default, {
        props: {
          hasMore: true,
          loadingMore: true,
        },
      })

      const spinner = wrapper.find('svg.animate-spin')
      expect(spinner.exists()).toBe(true)
      expect(spinner.attributes('fill')).toBe('none')
      expect(spinner.attributes('viewBox')).toBe('0 0 24 24')
    })

    it('should display loading text with spinner', async () => {
      const RecipeLoadMoreTrigger = await import('./RecipeLoadMoreTrigger.vue')
      const wrapper = mount(RecipeLoadMoreTrigger.default, {
        props: {
          hasMore: true,
          loadingMore: true,
        },
      })

      const loadingText = wrapper.find('span.text-sm')
      expect(loadingText.exists()).toBe(true)
      expect(loadingText.text()).toContain('...')
    })
  })

  describe('no more data state', () => {
    it('should have proper styling for no more data state', async () => {
      const RecipeLoadMoreTrigger = await import('./RecipeLoadMoreTrigger.vue')
      const wrapper = mount(RecipeLoadMoreTrigger.default, {
        props: {
          hasMore: false,
          loadingMore: false,
        },
      })

      const noMoreDataDiv = wrapper.find('div.text-center')
      expect(noMoreDataDiv.exists()).toBe(true)
      expect(noMoreDataDiv.find('span.text-sm').exists()).toBe(true)
    })
  })
})
