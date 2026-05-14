import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref } from 'vue'

// Mock useNuxtApp
vi.mock('#imports', () => ({
  useNuxtApp: vi.fn(() => ({
    $supabase: {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: [], error: null }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: vi.fn().mockResolvedValue({ data: null, error: null }),
        delete: vi.fn().mockResolvedValue({ data: null, error: null }),
      }),
    },
  })),
  useI18n: vi.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'validation.atLeastOneIngredient': '请至少添加一个食材',
        'validation.atLeastOneStep': '请至少添加一个步骤',
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
  })

  describe('initial form data', () => {
    it('should have correct default values', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData } = useRecipeForm()

      expect(formData.value.servings).toBe(4)
      expect(formData.value.prepTimeMinutes).toBe(30)
      expect(formData.value.cookTimeMinutes).toBe(30)
      expect(formData.value.difficulty).toBe('medium')
      expect(formData.value.tags).toEqual([])
      expect(formData.value.translations).toHaveLength(2)
    })

    it('should have nutrition info with undefined values', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData } = useRecipeForm()

      expect(formData.value.nutritionInfo.calories).toBeUndefined()
      expect(formData.value.nutritionInfo.protein).toBeUndefined()
      expect(formData.value.nutritionInfo.carbs).toBeUndefined()
      expect(formData.value.nutritionInfo.fat).toBeUndefined()
      expect(formData.value.nutritionInfo.fiber).toBeUndefined()
    })
  })

  describe('addIngredient', () => {
    it('should add a new ingredient with empty values', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData, addIngredient } = useRecipeForm()

      const initialLength = formData.value.ingredients.length
      addIngredient()

      expect(formData.value.ingredients.length).toBe(initialLength + 1)
      const newIngredient = formData.value.ingredients[formData.value.ingredients.length - 1]
      expect(newIngredient.name).toBe('')
      expect(newIngredient.amount).toBe(0)
      expect(newIngredient.unit).toBe('')
      expect(newIngredient.translations).toHaveLength(2)
    })

    it('should add ingredient with translations for en and zh-CN', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData, addIngredient } = useRecipeForm()

      addIngredient()
      const newIngredient = formData.value.ingredients[formData.value.ingredients.length - 1]

      expect(newIngredient.translations).toContainEqual({ locale: 'en', name: '' })
      expect(newIngredient.translations).toContainEqual({ locale: 'zh-CN', name: '' })
    })
  })

  describe('removeIngredient', () => {
    it('should remove ingredient at specified index', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData, addIngredient, removeIngredient } = useRecipeForm()

      // Add 3 ingredients
      addIngredient()
      addIngredient()
      addIngredient()
      expect(formData.value.ingredients.length).toBe(3)

      // Remove the second ingredient
      removeIngredient(1)
      expect(formData.value.ingredients.length).toBe(2)
    })
  })

  describe('addStep', () => {
    it('should add a new step with correct step number', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData, addStep } = useRecipeForm()

      expect(formData.value.steps.length).toBe(0)

      addStep()
      expect(formData.value.steps.length).toBe(1)
      expect(formData.value.steps[0].stepNumber).toBe(1)

      addStep()
      expect(formData.value.steps.length).toBe(2)
      expect(formData.value.steps[1].stepNumber).toBe(2)
    })

    it('should add step with empty instruction and translations', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData, addStep } = useRecipeForm()

      addStep()
      const newStep = formData.value.steps[0]

      expect(newStep.instruction).toBe('')
      expect(newStep.durationMinutes).toBeUndefined()
      expect(newStep.translations).toContainEqual({ locale: 'en', instruction: '' })
      expect(newStep.translations).toContainEqual({ locale: 'zh-CN', instruction: '' })
    })
  })

  describe('removeStep', () => {
    it('should remove step and renumber remaining steps', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData, addStep, removeStep } = useRecipeForm()

      addStep()
      addStep()
      addStep()

      expect(formData.value.steps[0].stepNumber).toBe(1)
      expect(formData.value.steps[1].stepNumber).toBe(2)
      expect(formData.value.steps[2].stepNumber).toBe(3)

      removeStep(1)

      expect(formData.value.steps.length).toBe(2)
      expect(formData.value.steps[0].stepNumber).toBe(1)
      expect(formData.value.steps[1].stepNumber).toBe(2)
    })
  })

  describe('addTag', () => {
    it('should add a new tag', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData, tagInput, addTag } = useRecipeForm()

      tagInput.value = 'Italian'
      addTag()

      expect(formData.value.tags).toContain('Italian')
      expect(tagInput.value).toBe('')
    })

    it('should not add duplicate tags', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData, tagInput, addTag } = useRecipeForm()

      tagInput.value = 'Italian'
      addTag()
      tagInput.value = 'Italian'
      addTag()

      expect(formData.value.tags.filter(t => t === 'Italian').length).toBe(1)
    })

    it('should trim whitespace before adding', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData, tagInput, addTag } = useRecipeForm()

      tagInput.value = '  Japanese  '
      addTag()

      expect(formData.value.tags).toContain('Japanese')
    })

    it('should not add empty tags', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData, tagInput, addTag } = useRecipeForm()

      tagInput.value = '   '
      addTag()

      expect(formData.value.tags.length).toBe(0)
    })
  })

  describe('removeTag', () => {
    it('should remove existing tag', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
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

    it('should do nothing when removing non-existent tag', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData, removeTag } = useRecipeForm()

      formData.value.tags = ['Italian', 'Japanese']
      removeTag('NonExistent')

      expect(formData.value.tags).toHaveLength(2)
    })
  })

  describe('currentTranslation', () => {
    it('should return current locale translation', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { activeLocale, formData, currentTranslation } = useRecipeForm()

      formData.value.translations[0] = { locale: 'en', title: 'English Title', description: 'English Desc' }
      formData.value.translations[1] = { locale: 'zh-CN', title: '中文标题', description: '中文描述' }

      activeLocale.value = 'en'
      expect(currentTranslation.value.title).toBe('English Title')

      activeLocale.value = 'zh-CN'
      expect(currentTranslation.value.title).toBe('中文标题')
    })
  })

  describe('formData manipulation', () => {
    it('should update formData.category', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData } = useRecipeForm()

      formData.value.category = 'dessert'
      expect(formData.value.category).toBe('dessert')
    })

    it('should update formData.cuisine', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData } = useRecipeForm()

      formData.value.cuisine = 'Italian'
      expect(formData.value.cuisine).toBe('Italian')
    })

    it('should update formData.difficulty', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData } = useRecipeForm()

      formData.value.difficulty = 'hard'
      expect(formData.value.difficulty).toBe('hard')
    })

    it('should update nutritionInfo', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData } = useRecipeForm()

      formData.value.nutritionInfo = {
        calories: 500,
        protein: 30,
        carbs: 50,
        fat: 20,
        fiber: 5,
      }

      expect(formData.value.nutritionInfo.calories).toBe(500)
      expect(formData.value.nutritionInfo.protein).toBe(30)
    })
  })

  describe('handleSubmit validation', () => {
    it('should return false and set error when no valid ingredients', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData, handleSubmit, submitError } = useRecipeForm()

      // formData starts with empty ingredients and steps
      formData.value.ingredients = []
      formData.value.steps = []

      const result = await handleSubmit()

      expect(result).toBe(false)
      expect(submitError.value).toBe('请至少添加一个食材')
    })

    it('should return false and set error when no valid steps', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData, handleSubmit, submitError } = useRecipeForm()

      // Add valid ingredient but no steps
      addIngredient()
      formData.value.ingredients[0].name = 'Tomato'
      formData.value.steps = []

      const result = await handleSubmit()

      expect(result).toBe(false)
      expect(submitError.value).toBe('请至少添加一个步骤')
    })

    it('should consider ingredient with translation name as valid', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData, handleSubmit, submitError, addIngredient, addStep } = useRecipeForm()

      // Add ingredient with empty name but translation name
      addIngredient()
      formData.value.ingredients[0].name = ''
      formData.value.ingredients[0].translations[0].name = 'Tomato'

      // Add step
      addStep()
      formData.value.steps[0].instruction = 'Test instruction'

      await handleSubmit()

      // Should not have ingredient error (may have other errors if recipe creation fails)
      // The validation should pass since ingredient has translation
      expect(submitError.value).not.toBe('请至少添加一个食材')
    })

    it('should consider step with translation instruction as valid', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData, handleSubmit, submitError, addIngredient, addStep } = useRecipeForm()

      // Add ingredient
      addIngredient()
      formData.value.ingredients[0].name = 'Tomato'

      // Add step with empty instruction but translation
      addStep()
      formData.value.steps[0].instruction = ''
      formData.value.steps[0].translations[0].instruction = 'Chop the tomato'

      await handleSubmit()

      // Should not have step error
      expect(submitError.value).not.toBe('请至少添加一个步骤')
    })

    it('should clear submitError before validation', async () => {
      const { useRecipeForm } = await import('../app/composables/useRecipeForm')
      const { formData, handleSubmit, submitError } = useRecipeForm()

      // Set a previous error
      submitError.value = 'Previous error'

      // Empty form should fail validation
      formData.value.ingredients = []
      formData.value.steps = []

      await handleSubmit()

      // Should show validation error, not previous error
      expect(submitError.value).toBe('请至少添加一个食材')
    })
  })
})