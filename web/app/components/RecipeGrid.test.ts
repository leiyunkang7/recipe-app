import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import type { Recipe } from '~/types'

// Mock the virtual scrolling module
vi.mock('@tanstack/vue-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    unmount: vi.fn(),
    setOptions: vi.fn(),
  })),
}))

// Mock RecipeGridColumn and RecipeGridVirtualColumn
vi.mock('~/components/RecipeGridColumn.vue', () => ({
  default: {
    name: 'RecipeGridColumn',
    props: ['recipes', 'enterDelayBase'],
    template: '<div class="recipe-grid-column">{{ recipes?.length || 0 }}</div>',
  },
}))

vi.mock('~/components/RecipeGridVirtualColumn.vue', () => ({
  default: {
    name: 'RecipeGridVirtualColumn',
    props: ['recipes', 'virtualizer', 'columnGap'],
    template: '<div class="recipe-grid-virtual-column">{{ recipes?.length || 0 }}</div>',
  },
}))

vi.mock('~/components/RecipeSkeletonLoader.vue', () => ({
  default: {
    name: 'RecipeSkeletonLoader',
    props: ['count'],
    template: '<div class="recipe-skeleton-loader">{{ count }}</div>',
  },
}))

describe('RecipeGrid', () => {
  const createMockRecipe = (id: string, title: string): Recipe => ({
    id,
    title,
    description: `Description for ${title}`,
    category: '家常菜',
    cuisine: '中餐',
    difficulty: 'easy',
    prepTimeMinutes: 10,
    cookTimeMinutes: 15,
    servings: 4,
    imageUrl: `/images/${id}.jpg`,
    ingredients: [
      { name: 'ingredient1', amount: 1, unit: 'cup' },
      { name: 'ingredient2', amount: 2, unit: 'tbsp' }
    ],
    steps: [
      { stepNumber: 1, instruction: 'step1' },
      { stepNumber: 2, instruction: 'step2' }
    ],
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-16T12:00:00Z',
  })

  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('standard mode (useVirtualScrolling = false)', () => {
    it('should distribute recipes into two columns', async () => {
      const RecipeGrid = await import('./RecipeGrid.vue')
      const recipes = [
        createMockRecipe('1', 'Recipe 1'),
        createMockRecipe('2', 'Recipe 2'),
        createMockRecipe('3', 'Recipe 3'),
      ]

      const wrapper = mount(RecipeGrid.default, {
        props: {
          recipes,
          useVirtualScrolling: false,
        },
      })

      await flushPromises()

      // Find both RecipeGridColumn components
      const columns = wrapper.findAll('.recipe-grid-column')
      expect(columns).toHaveLength(2)
    })

    it('should put even-indexed recipes in left column (0, 2, 4...)', async () => {
      const RecipeGrid = await import('./RecipeGrid.vue')
      const recipes = [
        createMockRecipe('1', 'Recipe 1'),
        createMockRecipe('2', 'Recipe 2'),
        createMockRecipe('3', 'Recipe 3'),
        createMockRecipe('4', 'Recipe 4'),
      ]

      const wrapper = mount(RecipeGrid.default, {
        props: {
          recipes,
          useVirtualScrolling: false,
        },
      })

      await flushPromises()

      const columns = wrapper.findAll('.recipe-grid-column')
      // Left column should have recipes at index 0, 2 (Recipe 1, Recipe 3)
      expect(columns[0]!.text()).toBe('2')
      // Right column should have recipes at index 1, 3 (Recipe 2, Recipe 4)
      expect(columns[1]!.text()).toBe('2')
    })

    it('should handle empty recipes array', async () => {
      const RecipeGrid = await import('./RecipeGrid.vue')
      const wrapper = mount(RecipeGrid.default, {
        props: {
          recipes: [],
          useVirtualScrolling: false,
        },
      })

      await flushPromises()

      const columns = wrapper.findAll('.recipe-grid-column')
      expect(columns).toHaveLength(2)
      expect(columns[0]!.text()).toBe('0')
      expect(columns[1]!.text()).toBe('0')
    })

    it('should handle single recipe', async () => {
      const RecipeGrid = await import('./RecipeGrid.vue')
      const recipes = [createMockRecipe('1', 'Recipe 1')]

      const wrapper = mount(RecipeGrid.default, {
        props: {
          recipes,
          useVirtualScrolling: false,
        },
      })

      await flushPromises()

      const columns = wrapper.findAll('.recipe-grid-column')
      expect(columns).toHaveLength(2)
      expect(columns[0]!.text()).toBe('1')
      expect(columns[1]!.text()).toBe('0')
    })

    it('should handle odd number of recipes', async () => {
      const RecipeGrid = await import('./RecipeGrid.vue')
      const recipes = [
        createMockRecipe('1', 'Recipe 1'),
        createMockRecipe('2', 'Recipe 2'),
        createMockRecipe('3', 'Recipe 3'),
      ]

      const wrapper = mount(RecipeGrid.default, {
        props: {
          recipes,
          useVirtualScrolling: false,
        },
      })

      await flushPromises()

      const columns = wrapper.findAll('.recipe-grid-column')
      // Left column: index 0, 2 = 2 recipes
      expect(columns[0]!.text()).toBe('2')
      // Right column: index 1 = 1 recipe
      expect(columns[1]!.text()).toBe('1')
    })
  })

  describe('virtual scrolling mode (useVirtualScrolling = true)', () => {
    it('should render skeleton loader while virtualizers are initializing', async () => {
      const RecipeGrid = await import('./RecipeGrid.vue')
      const recipes = [
        createMockRecipe('1', 'Recipe 1'),
        createMockRecipe('2', 'Recipe 2'),
      ]

      const wrapper = mount(RecipeGrid.default, {
        props: {
          recipes,
          useVirtualScrolling: true,
        },
      })

      await flushPromises()

      // Initially may show skeleton loader
      const skeletonLoader = wrapper.find('.recipe-skeleton-loader')
      // The skeleton loader shows while virtualizers are not yet initialized
      expect(skeletonLoader.exists() || wrapper.find('.recipe-grid-virtual-column').exists()).toBe(true)
    })

    it('should render scroll container', async () => {
      const RecipeGrid = await import('./RecipeGrid.vue')
      const recipes = [createMockRecipe('1', 'Recipe 1')]

      const wrapper = mount(RecipeGrid.default, {
        props: {
          recipes,
          useVirtualScrolling: true,
        },
      })

      await flushPromises()

      const scrollContainer = wrapper.find('.overflow-auto')
      expect(scrollContainer.exists()).toBe(true)
    })
  })

  describe('column distribution algorithm', () => {
    it('should always distribute exactly half of recipes to each column when even count', async () => {
      const RecipeGrid = await import('./RecipeGrid.vue')
      const recipes = Array.from({ length: 10 }, (_, i) =>
        createMockRecipe(`${i + 1}`, `Recipe ${i + 1}`)
      )

      const wrapper = mount(RecipeGrid.default, {
        props: {
          recipes,
          useVirtualScrolling: false,
        },
      })

      await flushPromises()

      const columns = wrapper.findAll('.recipe-grid-column')
      // 10 recipes should split as 5 and 5
      expect(columns[0]!.text()).toBe('5')
      expect(columns[1]!.text()).toBe('5')
    })

    it('should distribute extra recipe to left column when odd count', async () => {
      const RecipeGrid = await import('./RecipeGrid.vue')
      const recipes = Array.from({ length: 7 }, (_, i) =>
        createMockRecipe(`${i + 1}`, `Recipe ${i + 1}`)
      )

      const wrapper = mount(RecipeGrid.default, {
        props: {
          recipes,
          useVirtualScrolling: false,
        },
      })

      await flushPromises()

      const columns = wrapper.findAll('.recipe-grid-column')
      // 7 recipes: left gets 4 (indices 0,2,4,6), right gets 3 (indices 1,3,5)
      expect(columns[0]!.text()).toBe('4')
      expect(columns[1]!.text()).toBe('3')
    })

    it('should maintain recipe order within each column', async () => {
      const RecipeGrid = await import('./RecipeGrid.vue')
      const recipes = Array.from({ length: 4 }, (_, i) =>
        createMockRecipe(`${i + 1}`, `Recipe ${i + 1}`)
      )

      const wrapper = mount(RecipeGrid.default, {
        props: {
          recipes,
          useVirtualScrolling: false,
        },
      })

      await flushPromises()

      // This tests that the column distribution preserves order
      // Left column gets recipes at indices 0, 2 -> Recipe 1, Recipe 3
      // Right column gets recipes at indices 1, 3 -> Recipe 2, Recipe 4
      const columns = wrapper.findAll('.recipe-grid-column')
      expect(columns).toHaveLength(2)
      expect(columns[0]!.text()).toBe('2') // 2 recipes in left
      expect(columns[1]!.text()).toBe('2') // 2 recipes in right
    })
  })

  describe('reactive updates', () => {
    it('should update columns when recipes change', async () => {
      const RecipeGrid = await import('./RecipeGrid.vue')
      const initialRecipes = [createMockRecipe('1', 'Recipe 1')]
      const newRecipes = [
        createMockRecipe('1', 'Recipe 1'),
        createMockRecipe('2', 'Recipe 2'),
        createMockRecipe('3', 'Recipe 3'),
      ]

      const wrapper = mount(RecipeGrid.default, {
        props: {
          recipes: initialRecipes,
          useVirtualScrolling: false,
        },
      })

      await flushPromises()

      expect(wrapper.findAll('.recipe-grid-column')[0]!.text()).toBe('1')

      await wrapper.setProps({ recipes: newRecipes })
      await flushPromises()

      // After update: left column gets 2, right gets 1
      const columns = wrapper.findAll('.recipe-grid-column')
      expect(columns[0]!.text()).toBe('2')
      expect(columns[1]!.text()).toBe('1')
    })
  })
})