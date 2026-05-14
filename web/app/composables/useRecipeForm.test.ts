import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'

// Mock dependencies
const mockCreateRecipe = vi.fn()
const mockUpdateRecipe = vi.fn()
const mockFetchRecipeById = vi.fn()
const mockFetchCategoryKeys = vi.fn()
const mockFetchCuisineKeys = vi.fn()
const mockLoading = ref(false)

vi.mock('~/composables/useRecipes', () => ({
  useRecipes: () => ({
    createRecipe: mockCreateRecipe,
    updateRecipe: mockUpdateRecipe,
    fetchRecipeById: mockFetchRecipeById,
    fetchCategoryKeys: mockFetchCategoryKeys,
    fetchCuisineKeys: mockFetchCuisineKeys,
    loading: mockLoading,
  }),
}))

vi.mock('#imports', () => ({
  useI18n: vi.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'validation.atLeastOneIngredient': 'Please add at least one ingredient',
        'validation.atLeastOneStep': 'Please add at least one step',
      }
      return translations[key] || key
    },
    locale: ref('en'),
  })),
}))

vi.stubGlobal('console', {
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
})

describe('useRecipeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoading.value = false
    mockFetchCategoryKeys.mockResolvedValue([
      { id: 1, name: 'Main', displayName: 'Main' },
      { id: 2, name: 'Dessert', displayName: 'Dessert' },
    ])
    mockFetchCuisineKeys.mockResolvedValue([
      { id: 1, name: 'Italian', displayName: 'Italian' },
      { id: 2, name: 'Chinese', displayName: 'Chinese' },
    ])
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with empty form data', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData } = useRecipeForm()

      expect(formData.value.category).toBe('')
      expect(formData.value.cuisine).toBe('')
      expect(formData.value.servings).toBe(4)
      expect(formData.value.prepTimeMinutes).toBe(30)
      expect(formData.value.cookTimeMinutes).toBe(30)
      expect(formData.value.difficulty).toBe('medium')
    })

    it('should initialize with empty tags array', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData } = useRecipeForm()

      expect(Array.isArray(formData.value.tags)).toBe(true)
      expect(formData.value.tags).toHaveLength(0)
    })

    it('should initialize with nutrition info having undefined values', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData } = useRecipeForm()

      expect(formData.value.nutritionInfo.calories).toBeUndefined()
      expect(formData.value.nutritionInfo.protein).toBeUndefined()
      expect(formData.value.nutritionInfo.carbs).toBeUndefined()
      expect(formData.value.nutritionInfo.fat).toBeUndefined()
      expect(formData.value.nutritionInfo.fiber).toBeUndefined()
    })

    it('should initialize with translations for en and zh-CN', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData } = useRecipeForm()

      expect(formData.value.translations).toHaveLength(2)
      expect(formData.value.translations.some((t: unknown) => t.locale === 'en')).toBe(true)
      expect(formData.value.translations.some((t: unknown) => t.locale === 'zh-CN')).toBe(true)
    })

    it('should initialize with empty ingredients and steps', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData } = useRecipeForm()

      expect(Array.isArray(formData.value.ingredients)).toBe(true)
      expect(Array.isArray(formData.value.steps)).toBe(true)
      expect(formData.value.ingredients).toHaveLength(0)
      expect(formData.value.steps).toHaveLength(0)
    })

    it('should initialize with activeLocale as en', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { activeLocale } = useRecipeForm()

      expect(activeLocale.value).toBe('en')
    })
  })

  describe('addIngredient', () => {
    it('should add a new ingredient to the list', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, addIngredient } = useRecipeForm()

      const initialLength = formData.value.ingredients.length
      addIngredient()

      expect(formData.value.ingredients).toHaveLength(initialLength + 1)
    })

    it('should add ingredient with empty default values', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, addIngredient } = useRecipeForm()

      addIngredient()
      const newIngredient = formData.value.ingredients[formData.value.ingredients.length - 1]!

      expect(newIngredient.name).toBe('')
      expect(newIngredient.amount).toBe(0)
      expect(newIngredient.unit).toBe('')
    })

    it('should add ingredient with translations for both locales', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, addIngredient } = useRecipeForm()

      addIngredient()
      const newIngredient = formData.value.ingredients[formData.value.ingredients.length - 1]!

      expect(newIngredient.translations).toHaveLength(2)
      expect(newIngredient.translations).toContainEqual({ locale: 'en', name: '' })
      expect(newIngredient.translations).toContainEqual({ locale: 'zh-CN', name: '' })
    })
  })

  describe('removeIngredient', () => {
    it('should remove ingredient at specified index', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, addIngredient, removeIngredient } = useRecipeForm()

      addIngredient()
      addIngredient()
      addIngredient()
      expect(formData.value.ingredients).toHaveLength(3)

      removeIngredient(1)

      expect(formData.value.ingredients).toHaveLength(2)
    })

    it('should not affect other ingredients when removing', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, addIngredient, removeIngredient } = useRecipeForm()

      addIngredient()
      formData.value.ingredients[0]!.name = 'First'
      addIngredient()
      formData.value.ingredients[1]!.name = 'Second'
      addIngredient()
      formData.value.ingredients[2]!.name = 'Third'

      removeIngredient(1)

      expect(formData.value.ingredients[0]?.name).toBe('First')
      expect(formData.value.ingredients[1]?.name).toBe('Third')
    })
  })

  describe('addStep', () => {
    it('should add a new step with correct step number', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, addStep } = useRecipeForm()

      expect(formData.value.steps).toHaveLength(0)

      addStep()
      expect(formData.value.steps).toHaveLength(1)
      expect(formData.value.steps[0]?.stepNumber).toBe(1)

      addStep()
      expect(formData.value.steps).toHaveLength(2)
      expect(formData.value.steps[1]?.stepNumber).toBe(2)
    })

    it('should add step with empty instruction by default', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, addStep } = useRecipeForm()

      addStep()

      expect(formData.value.steps[0]?.instruction).toBe('')
      expect(formData.value.steps[0]?.durationMinutes).toBeUndefined()
    })
  })

  describe('removeStep', () => {
    it('should remove step at specified index', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, addStep, removeStep } = useRecipeForm()

      addStep()
      addStep()
      addStep()
      expect(formData.value.steps).toHaveLength(3)

      removeStep(1)

      expect(formData.value.steps).toHaveLength(2)
    })

    it('should renumber remaining steps after removal', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, addStep, removeStep } = useRecipeForm()

      addStep()
      addStep()
      addStep()

      expect(formData.value.steps[0]?.stepNumber).toBe(1)
      expect(formData.value.steps[1]?.stepNumber).toBe(2)
      expect(formData.value.steps[2]?.stepNumber).toBe(3)

      removeStep(1)

      expect(formData.value.steps[0]?.stepNumber).toBe(1)
      expect(formData.value.steps[1]?.stepNumber).toBe(2)
    })
  })

  describe('addTag', () => {
    it('should add a new tag', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, tagInput, addTag } = useRecipeForm()

      tagInput.value = 'Italian'
      addTag()

      expect(formData.value.tags).toContain('Italian')
    })

    it('should clear tagInput after adding', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { tagInput, addTag } = useRecipeForm()

      tagInput.value = 'Italian'
      addTag()

      expect(tagInput.value).toBe('')
    })

    it('should not add duplicate tags', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, tagInput, addTag } = useRecipeForm()

      tagInput.value = 'Italian'
      addTag()
      tagInput.value = 'Italian'
      addTag()

      expect(formData.value.tags.filter((t: string) => t === 'Italian')).toHaveLength(1)
    })

    it('should trim whitespace from tags', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, tagInput, addTag } = useRecipeForm()

      tagInput.value = '  Japanese  '
      addTag()

      expect(formData.value.tags).toContain('Japanese')
    })

    it('should not add empty or whitespace-only tags', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, tagInput, addTag } = useRecipeForm()

      tagInput.value = '   '
      addTag()

      expect(formData.value.tags).toHaveLength(0)
    })
  })

  describe('removeTag', () => {
    it('should remove existing tag', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, tagInput, addTag, removeTag } = useRecipeForm()

      tagInput.value = 'Italian'
      addTag()
      tagInput.value = 'Japanese'
      addTag()
      expect(formData.value.tags).toContain('Italian')
      expect(formData.value.tags).toContain('Japanese')

      removeTag('Italian')

      expect(formData.value.tags).not.toContain('Italian')
      expect(formData.value.tags).toContain('Japanese')
    })

    it('should handle removing non-existent tag gracefully', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, removeTag } = useRecipeForm()

      formData.value.tags = ['Italian', 'Japanese']

      removeTag('NonExistent')

      expect(formData.value.tags).toHaveLength(2)
    })
  })

  describe('currentTranslation', () => {
    it('should return translation for active locale', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { activeLocale, formData, currentTranslation } = useRecipeForm()

      formData.value.translations[0] = { locale: 'en', title: 'English Title', description: 'English Desc' }
      formData.value.translations[1] = { locale: 'zh-CN', title: '中文标题', description: '中文描述' }

      activeLocale.value = 'en'
      expect(currentTranslation.value.title).toBe('English Title')

      activeLocale.value = 'zh-CN'
      expect(currentTranslation.value.title).toBe('中文标题')
    })

    it('should fallback to first translation if active locale not found', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { activeLocale, formData, currentTranslation } = useRecipeForm()

      formData.value.translations[0] = { locale: 'en', title: 'English Title', description: '' }

      ;(activeLocale.value as string) = 'fr' // Not in translations
      expect(currentTranslation.value.title).toBe('English Title')
    })
  })

  describe('handleSubmit', () => {
    it('should return false when no ingredients', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, handleSubmit, submitError } = useRecipeForm()

      formData.value.ingredients = []
      formData.value.steps = [{ stepNumber: 1, instruction: 'Test', translations: [] }]

      const result = await handleSubmit()

      expect(result).toBe(false)
      expect(submitError.value).toBe('Please add at least one ingredient')
    })

    it('should return false when no steps', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, handleSubmit, submitError, addIngredient } = useRecipeForm()

      formData.value.ingredients = []
      addIngredient()
      formData.value.ingredients[0]!.name = 'Test'
      formData.value.steps = []

      const result = await handleSubmit()

      expect(result).toBe(false)
      expect(submitError.value).toBe('Please add at least one step')
    })

    it('should call createRecipe when no recipeId provided', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, handleSubmit, addIngredient, addStep } = useRecipeForm()

      formData.value.ingredients = []
      addIngredient()
      formData.value.ingredients[0]!.name = 'Test'
      formData.value.steps = []
      addStep()
      formData.value.steps[0]!.instruction = 'Test step'

      mockCreateRecipe.mockResolvedValue({ id: 'new-recipe-id' })

      await handleSubmit()

      expect(mockCreateRecipe).toHaveBeenCalled()
    })

    it('should call updateRecipe when recipeId provided', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { formData, handleSubmit, addIngredient, addStep } = useRecipeForm()

      formData.value.ingredients = []
      addIngredient()
      formData.value.ingredients[0]!.name = 'Test'
      formData.value.steps = []
      addStep()
      formData.value.steps[0]!.instruction = 'Test step'

      mockUpdateRecipe.mockResolvedValue({ id: 'recipe-id' })

      await handleSubmit('recipe-id')

      expect(mockUpdateRecipe).toHaveBeenCalledWith('recipe-id', expect.any(Object))
    })
  })

  describe('initForm', () => {
    it('should fetch category and cuisine keys', async () => {
      const { useRecipeForm } = await import('./useRecipeForm')
      const { initForm, categoryKeys, cuisineKeys } = useRecipeForm()

      await initForm()

      expect(mockFetchCategoryKeys).toHaveBeenCalled()
      expect(mockFetchCuisineKeys).toHaveBeenCalled()
      expect(categoryKeys.value).toHaveLength(2)
      expect(cuisineKeys.value).toHaveLength(2)
    })
  })
})