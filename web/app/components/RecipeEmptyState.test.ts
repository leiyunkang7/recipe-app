import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock useI18n
vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'zh' },
  }),
}))

// Mock useLocalePath
vi.mock('~/composables/useLocalePath', () => ({
  useLocalePath: () => (path: string) => path,
}))

describe('RecipeEmptyState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering without filters', () => {
    it('should render empty state when no search query or category', async () => {
      const RecipeEmptyState = await import('./RecipeEmptyState.vue')
      const wrapper = mount(RecipeEmptyState.default, {
        props: {
          searchQuery: '',
          selectedCategory: '',
        },
      })

      expect(wrapper.text()).toContain('empty.title')
      expect(wrapper.find('a[href*="admin/recipes/new"]').exists()).toBe(true)
    })

    it('should render empty plate illustration', async () => {
      const RecipeEmptyState = await import('./RecipeEmptyState.vue')
      const wrapper = mount(RecipeEmptyState.default, {
        props: {
          searchQuery: '',
          selectedCategory: '',
        },
      })

      expect(wrapper.findComponent({ name: 'EmptyPlateIllustration' }).exists()).toBe(true)
    })

    it('should render empty state tips', async () => {
      const RecipeEmptyState = await import('./RecipeEmptyState.vue')
      const wrapper = mount(RecipeEmptyState.default, {
        props: {
          searchQuery: '',
          selectedCategory: '',
        },
      })

      expect(wrapper.findComponent({ name: 'EmptyStateTips' }).exists()).toBe(true)
    })
  })

  describe('rendering with filters', () => {
    it('should render no results state when search query is present', async () => {
      const RecipeEmptyState = await import('./RecipeEmptyState.vue')
      const wrapper = mount(RecipeEmptyState.default, {
        props: {
          searchQuery: 'test query',
          selectedCategory: '',
        },
      })

      expect(wrapper.text()).toContain('empty.noResults')
      expect(wrapper.text()).toContain('empty.tryDifferent')
    })

    it('should render no results state when category is selected', async () => {
      const RecipeEmptyState = await import('./RecipeEmptyState.vue')
      const wrapper = mount(RecipeEmptyState.default, {
        props: {
          searchQuery: '',
          selectedCategory: 'breakfast',
        },
      })

      expect(wrapper.text()).toContain('empty.noResults')
    })

    it('should render clear search button when search query is present', async () => {
      const RecipeEmptyState = await import('./RecipeEmptyState.vue')
      const wrapper = mount(RecipeEmptyState.default, {
        props: {
          searchQuery: 'test query',
          selectedCategory: '',
        },
      })

      const clearButton = wrapper.find('button:has(svg path[d*="M6 18L18 6M6 6l12 12"])')
      expect(clearButton.exists()).toBe(true)
    })
  })

  describe('user interactions', () => {
    it('should emit clearSearch when clear search button is clicked', async () => {
      const RecipeEmptyState = await import('./RecipeEmptyState.vue')
      const wrapper = mount(RecipeEmptyState.default, {
        props: {
          searchQuery: 'test query',
          selectedCategory: '',
        },
      })

      const clearButton = wrapper.find('button:has(svg path[d*="M6 18L18 6M6 6l12 12"])')
      await clearButton.trigger('click')

      expect(wrapper.emitted('clearSearch')).toBeTruthy()
      expect(wrapper.emitted('clearSearch')?.length).toBe(1)
    })

    it('should emit clearCategory when clear category button is clicked', async () => {
      const RecipeEmptyState = await import('./RecipeEmptyState.vue')
      const wrapper = mount(RecipeEmptyState.default, {
        props: {
          searchQuery: '',
          selectedCategory: 'breakfast',
        },
      })

      const clearButton = wrapper.find('button:has(svg path[d*="M6 18L18 6M6 6l12 12"])')
      await clearButton.trigger('click')

      expect(wrapper.emitted('clearCategory')).toBeTruthy()
      expect(wrapper.emitted('clearCategory')?.length).toBe(1)
    })

    it('should render both clear buttons when both filters are active', async () => {
      const RecipeEmptyState = await import('./RecipeEmptyState.vue')
      const wrapper = mount(RecipeEmptyState.default, {
        props: {
          searchQuery: 'test',
          selectedCategory: 'breakfast',
        },
      })

      const clearButtons = wrapper.findAll('button:has(svg path[d*="M6 18L18 6M6 6l12 12"])')
      expect(clearButtons.length).toBe(2)
    })
  })

  describe('accessibility', () => {
    it('should have proper structure for screen readers', async () => {
      const RecipeEmptyState = await import('./RecipeEmptyState.vue')
      const wrapper = mount(RecipeEmptyState.default, {
        props: {
          searchQuery: '',
          selectedCategory: '',
        },
      })

      expect(wrapper.find('h3').exists()).toBe(true)
      expect(wrapper.find('p').exists()).toBe(true)
    })
  })
})
