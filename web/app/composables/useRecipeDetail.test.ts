import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, computed } from 'vue'

// Mock dependencies
const mockFetchRecipeById = vi.fn()
const mockIncrementViews = vi.fn()
const mockCheckFavorite = vi.fn()
const mockToggleFav = vi.fn()
const mockUseBreakpoint = vi.fn()

vi.mock('#imports', () => ({
  useNuxtApp: vi.fn(() => ({
    $supabase: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    },
  })),
  useI18n: vi.fn(() => ({
    locale: ref('en'),
    t: (key: string) => key,
  })),
  useRoute: vi.fn(() => ({
    params: { id: 'test-recipe-id' },
  })),
}))

vi.mock('~/composables/useRecipes', () => ({
  useRecipes: () => ({
    fetchRecipeById: mockFetchRecipeById,
    incrementViews: mockIncrementViews,
    loading: ref(false),
    error: ref(null),
  }),
}))

vi.mock('~/composables/useFavorites', () => ({
  useFavorites: () => ({
    isFavorite: mockCheckFavorite,
    toggleFavorite: mockToggleFav,
  }),
}))

vi.mock('~/composables/useBreakpoint', () => ({
  useBreakpoint: () => mockUseBreakpoint(),
}))

vi.stubGlobal('console', {
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
})

describe('useRecipeDetail', () => {
  const createMockRecipe = (id: string) => ({
    id,
    title: 'Test Recipe',
    description: 'Test Description',
    category: '家常菜',
    cuisine: '中餐',
    difficulty: 'easy' as const,
    prepTimeMinutes: 15,
    cookTimeMinutes: 30,
    servings: 4,
    imageUrl: '/images/test.jpg',
    tags: ['tag1'],
    nutritionInfo: {
      calories: 500,
      protein: 30,
      carbs: 50,
      fat: 20,
      fiber: 5,
    },
    translations: [
      { locale: 'en', title: 'Test Recipe', description: 'Test Description' },
      { locale: 'zh-CN', title: '测试食谱', description: '测试描述' },
    ],
    ingredients: [
      { name: 'Ingredient 1', amount: 1, unit: 'cup', translations: [] },
      { name: 'Ingredient 2', amount: 2, unit: 'tbsp', translations: [] },
    ],
    steps: [
      { stepNumber: 1, instruction: 'Step 1', durationMinutes: 5, translations: [] },
      { stepNumber: 2, instruction: 'Step 2', durationMinutes: 10, translations: [] },
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-16T12:00:00Z',
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseBreakpoint.mockReturnValue({
      isDesktop: ref(true),
      isMobile: computed(() => ref(false)),
    })
    mockCheckFavorite.mockReturnValue(false)
    mockToggleFav.mockResolvedValue(undefined)
    mockFetchRecipeById.mockResolvedValue(null)
    mockIncrementViews.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with null recipe', async () => {
      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { recipe } = useRecipeDetail()

      expect(recipe.value).toBeNull()
    })

    it('should initialize with empty selected ingredients set', async () => {
      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { selectedIngredients } = useRecipeDetail()

      expect(selectedIngredients.value).toBeInstanceOf(Set)
      expect(selectedIngredients.value.size).toBe(0)
    })

    it('should initialize with currentStep at 0', async () => {
      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { currentStep } = useRecipeDetail()

      expect(currentStep.value).toBe(0)
    })

    it('should initialize with empty expanded steps set', async () => {
      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { expandedSteps } = useRecipeDetail()

      expect(expandedSteps.value).toBeInstanceOf(Set)
      expect(expandedSteps.value.size).toBe(0)
    })
  })

  describe('totalTime computed', () => {
    it('should calculate total time from prep and cook time', async () => {
      mockFetchRecipeById.mockResolvedValue(createMockRecipe('test-1'))

      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { totalTime, init } = useRecipeDetail()

      await init()

      expect(totalTime.value).toBe(45) // 15 + 30
    })

    it('should return 0 when recipe is null', async () => {
      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { totalTime } = useRecipeDetail()

      expect(totalTime.value).toBe(0)
    })

    it('should handle undefined prep and cook times', async () => {
      const recipe = createMockRecipe('test-1') as { prepTimeMinutes?: number; cookTimeMinutes?: number }
      recipe.prepTimeMinutes = undefined
      recipe.cookTimeMinutes = undefined
      mockFetchRecipeById.mockResolvedValue(recipe)

      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { totalTime, init } = useRecipeDetail()

      await init()

      expect(totalTime.value).toBe(0)
    })
  })

  describe('nutritionInfo computed', () => {
    it('should return nutrition info from recipe', async () => {
      const recipe = createMockRecipe('test-1')
      mockFetchRecipeById.mockResolvedValue(recipe)

      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { nutritionInfo, init } = useRecipeDetail()

      await init()

      expect(nutritionInfo.value.calories).toBe(500)
      expect(nutritionInfo.value.protein).toBe(30)
      expect(nutritionInfo.value.carbs).toBe(50)
      expect(nutritionInfo.value.fat).toBe(20)
    })

    it('should return default values when recipe has no nutrition info', async () => {
      const recipe = createMockRecipe('test-1') as { nutritionInfo?: undefined }
      recipe.nutritionInfo = undefined
      mockFetchRecipeById.mockResolvedValue(recipe)

      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { nutritionInfo, init } = useRecipeDetail()

      await init()

      expect(nutritionInfo.value.calories).toBe(0)
      expect(nutritionInfo.value.protein).toBe(0)
      expect(nutritionInfo.value.carbs).toBe(0)
      expect(nutritionInfo.value.fat).toBe(0)
    })
  })

  describe('isFavorite computed', () => {
    it('should return false when recipe is null', async () => {
      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { isFavorite } = useRecipeDetail()

      expect(isFavorite.value).toBe(false)
    })

    it('should delegate to checkFavorite with recipe id', async () => {
      const recipe = createMockRecipe('fav-recipe')
      mockFetchRecipeById.mockResolvedValue(recipe)
      mockCheckFavorite.mockReturnValue(true)

      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { isFavorite, init } = useRecipeDetail()

      await init()

      expect(mockCheckFavorite).toHaveBeenCalledWith('fav-recipe')
      expect(isFavorite.value).toBe(true)
    })
  })

  describe('toggleIngredient', () => {
    it('should add ingredient to selected set when not present', async () => {
      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { selectedIngredients, toggleIngredient } = useRecipeDetail()

      toggleIngredient('Tomato')

      expect(selectedIngredients.value.has('Tomato')).toBe(true)
    })

    it('should remove ingredient from selected set when already present', async () => {
      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { selectedIngredients, toggleIngredient } = useRecipeDetail()

      toggleIngredient('Tomato')
      expect(selectedIngredients.value.has('Tomato')).toBe(true)

      toggleIngredient('Tomato')
      expect(selectedIngredients.value.has('Tomato')).toBe(false)
    })

    it('should handle multiple ingredients independently', async () => {
      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { selectedIngredients, toggleIngredient } = useRecipeDetail()

      toggleIngredient('Tomato')
      toggleIngredient('Onion')
      toggleIngredient('Garlic')

      expect(selectedIngredients.value.size).toBe(3)
      expect(selectedIngredients.value.has('Tomato')).toBe(true)
      expect(selectedIngredients.value.has('Onion')).toBe(true)
      expect(selectedIngredients.value.has('Garlic')).toBe(true)

      toggleIngredient('Tomato')
      expect(selectedIngredients.value.size).toBe(2)
      expect(selectedIngredients.value.has('Tomato')).toBe(false)
    })
  })

  describe('toggleStepExpand', () => {
    it('should add step index to expanded set when not present', async () => {
      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { expandedSteps, toggleStepExpand } = useRecipeDetail()

      toggleStepExpand(0)

      expect(expandedSteps.value.has(0)).toBe(true)
    })

    it('should remove step index from expanded set when already present', async () => {
      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { expandedSteps, toggleStepExpand } = useRecipeDetail()

      toggleStepExpand(0)
      expect(expandedSteps.value.has(0)).toBe(true)

      toggleStepExpand(0)
      expect(expandedSteps.value.has(0)).toBe(false)
    })
  })

  describe('toggleFavorite', () => {
    it('should do nothing when recipe is null', async () => {
      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { toggleFavorite } = useRecipeDetail()

      await toggleFavorite()

      expect(mockToggleFav).not.toHaveBeenCalled()
    })

    it('should call toggleFav with recipe id when recipe exists', async () => {
      const recipe = createMockRecipe('toggle-test')
      mockFetchRecipeById.mockResolvedValue(recipe)

      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { toggleFavorite, init } = useRecipeDetail()

      await init()
      await toggleFavorite()

      expect(mockToggleFav).toHaveBeenCalledWith('toggle-test')
    })
  })

  describe('loadRecipe', () => {
    it('should fetch recipe by id from route params', async () => {
      mockFetchRecipeById.mockResolvedValue(createMockRecipe('route-id'))

      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { init } = useRecipeDetail()

      await init()

      expect(mockFetchRecipeById).toHaveBeenCalledWith('test-recipe-id')
    })

    it('should increment views after loading recipe', async () => {
      const recipe = createMockRecipe('views-test')
      mockFetchRecipeById.mockResolvedValue(recipe)

      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { init } = useRecipeDetail()

      await init()

      expect(mockIncrementViews).toHaveBeenCalledWith('views-test')
    })

    it('should not increment views when recipe is not found', async () => {
      mockFetchRecipeById.mockResolvedValue(null)

      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { init } = useRecipeDetail()

      await init()

      expect(mockIncrementViews).not.toHaveBeenCalled()
    })
  })

  describe('isMobile computed', () => {
    it('should return true when isDesktop is false', async () => {
      mockUseBreakpoint.mockReturnValue({
        isDesktop: ref(false),
        isMobile: computed(() => ref(true)),
      })

      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { isMobile } = useRecipeDetail()

      expect(isMobile.value).toBe(true)
    })

    it('should return false when isDesktop is true', async () => {
      mockUseBreakpoint.mockReturnValue({
        isDesktop: ref(true),
        isMobile: computed(() => ref(false)),
      })

      const { useRecipeDetail } = await import('./useRecipeDetail')
      const { isMobile } = useRecipeDetail()

      expect(isMobile.value).toBe(false)
    })
  })
})
