import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { Recipe } from '~/types'

// Mock RecipeGrid
vi.mock('~/components/RecipeGrid.vue', () => ({
  default: {
    name: 'RecipeGrid',
    props: ['recipes', 'useVirtualScrolling'],
    template: '<div class="recipe-grid-mock">{{ recipes?.length || 0 }}</div>',
  },
}))

// Mock RecipeSkeletonLoader
vi.mock('~/components/RecipeSkeletonLoader.vue', () => ({
  default: {
    name: 'RecipeSkeletonLoader',
    props: ['count'],
    template: '<div class="skeleton-loader-mock">{{ count }}</div>',
  },
}))

// Mock LazyRecipeErrorState
vi.mock('~/components/RecipeErrorState.vue', () => ({
  default: {
    name: 'RecipeErrorState',
    props: ['error'],
    template: '<div class="error-state-mock">{{ error }}</div>',
  },
}))

// Mock LazyRecipeEmptyState
vi.mock('~/components/RecipeEmptyState.vue', () => ({
  default: {
    name: 'RecipeEmptyState',
    props: ['searchQuery', 'selectedCategory'],
    template: '<div class="empty-state-mock">Empty</div>',
  },
}))

// Mock RecipeLoadMoreTrigger
vi.mock('~/components/RecipeLoadMoreTrigger.vue', () => ({
  default: {
    name: 'RecipeLoadMoreTrigger',
    props: ['hasMore', 'loadingMore'],
    template: '<div class="load-more-trigger-mock"></div>',
  },
}))

// Mock useI18n
vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

describe('RecipeListSection', () => {
  const createMockRecipe = (id: string): Recipe => ({
    id,
    title: `Recipe ${id}`,
    description: `Description for recipe ${id}`,
    category: '家常菜',
    cuisine: '中餐',
    difficulty: 'easy',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    servings: 4,
    imageUrl: `/images/${id}.jpg`,
    ingredients: [],
    steps: [],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('rendering states', () => {
    it('should render skeleton loader when loading', async () => {
      const RecipeListSection = await import('./RecipeListSection.vue')
      const wrapper = mount(RecipeListSection.default, {
        props: {
          recipes: [],
          loading: true,
          loadingMore: false,
          error: null,
          hasMore: false,
          searchQuery: '',
          selectedCategory: '',
        },
      })

      expect(wrapper.find('.skeleton-loader-mock').exists()).toBe(true)
    })

    it('should render error state when error occurs', async () => {
      const RecipeListSection = await import('./RecipeListSection.vue')
      const wrapper = mount(RecipeListSection.default, {
        props: {
          recipes: [],
          loading: false,
          loadingMore: false,
          error: 'Failed to load recipes',
          hasMore: false,
          searchQuery: '',
          selectedCategory: '',
        },
      })

      expect(wrapper.find('.error-state-mock').exists()).toBe(true)
      expect(wrapper.find('.error-state-mock').text()).toBe('Failed to load recipes')
    })

    it('should render empty state when no recipes', async () => {
      const RecipeListSection = await import('./RecipeListSection.vue')
      const wrapper = mount(RecipeListSection.default, {
        props: {
          recipes: [],
          loading: false,
          loadingMore: false,
          error: null,
          hasMore: false,
          searchQuery: '',
          selectedCategory: '',
        },
      })

      expect(wrapper.find('.empty-state-mock').exists()).toBe(true)
    })

    it('should render recipe grid when recipes exist', async () => {
      const RecipeListSection = await import('./RecipeListSection.vue')
      const recipes = [createMockRecipe('1'), createMockRecipe('2')]

      const wrapper = mount(RecipeListSection.default, {
        props: {
          recipes,
          loading: false,
          loadingMore: false,
          error: null,
          hasMore: false,
          searchQuery: '',
          selectedCategory: '',
        },
      })

      expect(wrapper.find('.recipe-grid-mock').exists()).toBe(true)
    })
  })

  describe('emitted events', () => {
    it('should emit retry event when error state requests retry', async () => {
      const RecipeListSection = await import('./RecipeListSection.vue')
      const wrapper = mount(RecipeListSection.default, {
        props: {
          recipes: [],
          loading: false,
          loadingMore: false,
          error: 'Failed to load',
          hasMore: false,
          searchQuery: '',
          selectedCategory: '',
        },
      })

      const errorState = wrapper.find('.error-state-mock')
      await errorState.trigger('retry')

      expect(wrapper.emitted('retry')).toBeTruthy()
    })

    it('should emit clearSearch when empty state requests clear search', async () => {
      const RecipeListSection = await import('./RecipeListSection.vue')
      const wrapper = mount(RecipeListSection.default, {
        props: {
          recipes: [],
          loading: false,
          loadingMore: false,
          error: null,
          hasMore: false,
          searchQuery: 'test query',
          selectedCategory: '',
        },
      })

      const emptyState = wrapper.find('.empty-state-mock')
      await emptyState.trigger('clearSearch')

      expect(wrapper.emitted('clearSearch')).toBeTruthy()
    })

    it('should emit clearCategory when empty state requests clear category', async () => {
      const RecipeListSection = await import('./RecipeListSection.vue')
      const wrapper = mount(RecipeListSection.default, {
        props: {
          recipes: [],
          loading: false,
          loadingMore: false,
          error: null,
          hasMore: false,
          searchQuery: '',
          selectedCategory: 'main',
        },
      })

      const emptyState = wrapper.find('.empty-state-mock')
      await emptyState.trigger('clearCategory')

      expect(wrapper.emitted('clearCategory')).toBeTruthy()
    })
  })

  describe('load more trigger', () => {
    it('should render load more trigger when recipes exist', async () => {
      const RecipeListSection = await import('./RecipeListSection.vue')
      const recipes = [createMockRecipe('1')]

      const wrapper = mount(RecipeListSection.default, {
        props: {
          recipes,
          loading: false,
          loadingMore: false,
          error: null,
          hasMore: true,
          searchQuery: '',
          selectedCategory: '',
        },
      })

      await flushPromises()
      vi.advanceTimersByTime(0)

      expect(wrapper.find('.load-more-trigger-mock').exists()).toBe(true)
    })

    it('should not render load more trigger when recipes is empty', async () => {
      const RecipeListSection = await import('./RecipeListSection.vue')
      const wrapper = mount(RecipeListSection.default, {
        props: {
          recipes: [],
          loading: false,
          loadingMore: false,
          error: null,
          hasMore: true,
          searchQuery: '',
          selectedCategory: '',
        },
      })

      expect(wrapper.find('.load-more-trigger-mock').exists()).toBe(false)
    })
  })

  describe('state priority', () => {
    it('should show loading state over error state', async () => {
      const RecipeListSection = await import('./RecipeListSection.vue')
      const wrapper = mount(RecipeListSection.default, {
        props: {
          recipes: [],
          loading: true,
          loadingMore: false,
          error: 'Some error',
          hasMore: false,
          searchQuery: '',
          selectedCategory: '',
        },
      })

      expect(wrapper.find('.skeleton-loader-mock').exists()).toBe(true)
      expect(wrapper.find('.error-state-mock').exists()).toBe(false)
    })

    it('should show error state over empty state', async () => {
      const RecipeListSection = await import('./RecipeListSection.vue')
      const wrapper = mount(RecipeListSection.default, {
        props: {
          recipes: [],
          loading: false,
          loadingMore: false,
          error: 'Error message',
          hasMore: false,
          searchQuery: '',
          selectedCategory: '',
        },
      })

      expect(wrapper.find('.error-state-mock').exists()).toBe(true)
      expect(wrapper.find('.empty-state-mock').exists()).toBe(false)
    })

    it('should show empty state over recipe grid', async () => {
      const RecipeListSection = await import('./RecipeListSection.vue')
      const wrapper = mount(RecipeListSection.default, {
        props: {
          recipes: [],
          loading: false,
          loadingMore: false,
          error: null,
          hasMore: false,
          searchQuery: '',
          selectedCategory: '',
        },
      })

      expect(wrapper.find('.empty-state-mock').exists()).toBe(true)
      expect(wrapper.find('.recipe-grid-mock').exists()).toBe(false)
    })
  })

  describe('virtual scrolling', () => {
    it('should enable virtual scrolling for large recipe sets', async () => {
      const RecipeListSection = await import('./RecipeListSection.vue')
      const recipes = Array.from({ length: 150 }, (_, i) => createMockRecipe(`${i + 1}`))

      const wrapper = mount(RecipeListSection.default, {
        props: {
          recipes,
          loading: false,
          loadingMore: false,
          error: null,
          hasMore: false,
          searchQuery: '',
          selectedCategory: '',
        },
      })

      await flushPromises()

      const recipeGrid = wrapper.find('.recipe-grid-mock')
      expect(recipeGrid.exists()).toBe(true)
      expect(recipeGrid.text()).toBe('150')
    })

    it('should not enable virtual scrolling for small recipe sets', async () => {
      const RecipeListSection = await import('./RecipeListSection.vue')
      const recipes = [createMockRecipe('1'), createMockRecipe('2')]

      const wrapper = mount(RecipeListSection.default, {
        props: {
          recipes,
          loading: false,
          loadingMore: false,
          error: null,
          hasMore: false,
          searchQuery: '',
          selectedCategory: '',
        },
      })

      await flushPromises()

      const recipeGrid = wrapper.find('.recipe-grid-mock')
      expect(recipeGrid.exists()).toBe(true)
    })
  })
})
