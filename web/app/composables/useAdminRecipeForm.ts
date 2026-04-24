/**
 * useAdminRecipeForm - Admin recipe form state management composable
 *
 * Extracted from admin/recipes/[id]/edit.vue to:
 * - Centralize form state and operations
 * - Enable unit testing of form logic
 * - Reduce monolithic page component size
 * - Add form validation
 */
import type { Locale, Translation, IngredientTranslation, StepTranslation } from '~/types'

interface FormIngredient {
  id: string
  name: string
  amount: number
  unit: string
  translations: IngredientTranslation[]
}

interface FormStep {
  id: string
  stepNumber: number
  instruction: string
  durationMinutes?: number
  translations: StepTranslation[]
}

interface NutritionInfo {
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
}

interface FormData {
  category: string
  cuisine: string
  servings: number
  prepTimeMinutes: number
  cookTimeMinutes: number
  difficulty: 'easy' | 'medium' | 'hard'
  imageUrl: string
  source: string
  tags: string[]
  nutritionInfo: NutritionInfo
  translations: Translation[]
  ingredients: FormIngredient[]
  steps: FormStep[]
}

interface SubmitData {
  title: string
  description?: string
  category: string
  cuisine: string
  servings: number
  prepTimeMinutes: number
  cookTimeMinutes: number
  difficulty: string
  imageUrl: string
  source: string
  tags: string[]
  nutritionInfo: NutritionInfo
  translations: Translation[]
  ingredients: Array<{
    name: string
    amount: number
    unit: string
    translations: IngredientTranslation[]
  }>
  steps: Array<{
    stepNumber: number
    instruction: string
    durationMinutes?: number
    translations: StepTranslation[]
  }>
}

// Simple unique ID generator — module-level counter
let nextItemId = 1
const generateItemId = () => `item-${nextItemId++}`

const createDefaultTranslations = (): Translation[] => [
  { locale: 'en' as Locale, title: '', description: '' },
  { locale: 'zh-CN' as Locale, title: '', description: '' },
]

const createDefaultIngredient = (): FormIngredient => ({
  id: generateItemId(),
  name: '',
  amount: 0,
  unit: '',
  translations: [
    { locale: 'en' as Locale, name: '' },
    { locale: 'zh-CN' as Locale, name: '' },
  ],
})

const createDefaultStep = (stepNumber: number): FormStep => ({
  id: generateItemId(),
  stepNumber,
  instruction: '',
  durationMinutes: undefined,
  translations: [
    { locale: 'en' as Locale, instruction: '' },
    { locale: 'zh-CN' as Locale, instruction: '' },
  ],
})

export function useAdminRecipeForm() {
  const { t } = useI18n()

  const activeLocale = ref<Locale>('en')
  const tagInput = ref('')
  const formErrors = ref<Record<string, string>>({})

  const formData = ref<FormData>({
    category: '',
    cuisine: '',
    servings: 4,
    prepTimeMinutes: 30,
    cookTimeMinutes: 30,
    difficulty: 'medium',
    imageUrl: '',
    source: '',
    tags: [],
    nutritionInfo: {
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
      fiber: undefined,
    },
    translations: createDefaultTranslations(),
    ingredients: [],
    steps: [],
  })

  const currentTranslation = computed(() =>
    formData.value.translations.find(t => t.locale === activeLocale.value)
    ?? formData.value.translations[0]
  )

  const loadRecipe = (recipe: Record<string, unknown>) => {
    nextItemId = 1 // Reset counter for loaded recipe
    formData.value = {
      category: recipe.category as string,
      cuisine: (recipe.cuisine as string) || '',
      servings: recipe.servings as number,
      prepTimeMinutes: recipe.prepTimeMinutes as number,
      cookTimeMinutes: recipe.cookTimeMinutes as number,
      difficulty: recipe.difficulty as 'easy' | 'medium' | 'hard',
      imageUrl: (recipe.imageUrl as string) || '',
      source: (recipe.source as string) || '',
      tags: (recipe.tags as string[]) || [],
      nutritionInfo: (recipe.nutritionInfo as NutritionInfo) || {},
      translations: (recipe.translations as Translation[]) || [
        { locale: 'en', title: recipe.title as string, description: (recipe.description as string) || '' },
        { locale: 'zh-CN', title: '', description: '' },
      ],
      ingredients: ((recipe.ingredients as Array<Record<string, unknown>>) || []).map(ing => ({
        id: generateItemId(),
        name: ing.name as string,
        amount: ing.amount as number,
        unit: (ing.unit as string) || '',
        translations: (ing.translations as IngredientTranslation[]) || [
          { locale: 'en' as Locale, name: ing.name as string },
          { locale: 'zh-CN' as Locale, name: '' },
        ],
      })),
      steps: ((recipe.steps as Array<Record<string, unknown>>) || []).map(step => ({
        id: generateItemId(),
        stepNumber: step.stepNumber as number,
        instruction: step.instruction as string,
        durationMinutes: step.durationMinutes as number | undefined,
        translations: (step.translations as StepTranslation[]) || [
          { locale: 'en' as Locale, instruction: step.instruction as string },
          { locale: 'zh-CN' as Locale, instruction: '' },
        ],
      })),
    }
  }

  const initNewRecipe = () => {
    nextItemId = 1
    formData.value.ingredients.push(createDefaultIngredient())
    formData.value.steps.push(createDefaultStep(1))
  }

  // Ingredient management
  const addIngredient = () => {
    formData.value.ingredients.push(createDefaultIngredient())
  }

  const removeIngredient = (index: number) => {
    formData.value.ingredients.splice(index, 1)
  }

  const getIngredientName = (index: number): string => {
    const ing = formData.value.ingredients[index]
    return ing.translations?.find(t => t.locale === activeLocale.value)?.name ?? ing.name
  }

  const setIngredientName = (index: number, value: string) => {
    const ing = formData.value.ingredients[index]
    const transIndex = ing.translations?.findIndex(t => t.locale === activeLocale.value) ?? -1
    if (transIndex >= 0 && ing.translations) {
      ing.translations[transIndex].name = value
    } else if (ing.translations) {
      ing.translations.push({ locale: activeLocale.value, name: value })
    }
    if (activeLocale.value === 'en') {
      ing.name = value
    }
  }

  // Step management
  const addStep = () => {
    const nextStepNumber = formData.value.steps.length + 1
    formData.value.steps.push(createDefaultStep(nextStepNumber))
  }

  const removeStep = (index: number) => {
    formData.value.steps.splice(index, 1)
    formData.value.steps.forEach((step, i) => {
      step.stepNumber = i + 1
    })
  }

  const getStepInstruction = (index: number): string => {
    const step = formData.value.steps[index]
    return step.translations?.find(t => t.locale === activeLocale.value)?.instruction ?? step.instruction
  }

  const setStepInstruction = (index: number, value: string) => {
    const step = formData.value.steps[index]
    const transIndex = step.translations?.findIndex(t => t.locale === activeLocale.value) ?? -1
    if (transIndex >= 0 && step.translations) {
      step.translations[transIndex].instruction = value
    } else if (step.translations) {
      step.translations.push({ locale: activeLocale.value, instruction: value })
    }
    if (activeLocale.value === 'en') {
      step.instruction = value
    }
  }

  // Tag management
  const addTag = () => {
    const trimmed = tagInput.value.trim()
    if (trimmed && !formData.value.tags.includes(trimmed)) {
      formData.value.tags.push(trimmed)
      tagInput.value = ''
    }
  }

  const removeTag = (tag: string) => {
    const index = formData.value.tags.indexOf(tag)
    if (index > -1) {
      formData.value.tags.splice(index, 1)
    }
  }

  // Form validation
  const validate = (): boolean => {
    formErrors.value = {}
    const enTitle = formData.value.translations.find(t => t.locale === 'en')?.title
    const zhTitle = formData.value.translations.find(t => t.locale === 'zh-CN')?.title

    if (!enTitle?.trim()) {
      formErrors.value.titleEn = t('form.titleRequired') || 'English title is required'
    }
    if (!zhTitle?.trim()) {
      formErrors.value.titleZh = t('form.titleRequired') || 'Chinese title is required'
    }
    if (!formData.value.category) {
      formErrors.value.category = t('form.categoryRequired') || 'Category is required'
    }
    if (formData.value.servings < 1) {
      formErrors.value.servings = t('form.servingsRequired') || 'Servings must be at least 1'
    }
    if (formData.value.ingredients.length === 0) {
      formErrors.value.ingredients = t('form.ingredientsRequired') || 'At least one ingredient is required'
    }
    if (formData.value.steps.length === 0) {
      formErrors.value.steps = t('form.stepsRequired') || 'At least one step is required'
    }

    // Validate ingredient names
    formData.value.ingredients.forEach((ing, index) => {
      const name = getIngredientName(index)
      if (!name.trim()) {
        formErrors.value[`ingredient_${index}`] = t('form.ingredientNameRequired') || 'Ingredient name is required'
      }
    })

    // Validate step instructions
    formData.value.steps.forEach((step, index) => {
      const instruction = getStepInstruction(index)
      if (!instruction.trim()) {
        formErrors.value[`step_${index}`] = t('form.stepInstructionRequired') || 'Step instruction is required'
      }
    })

    return Object.keys(formErrors.value).length === 0
  }

  // Build submit data
  const buildSubmitData = (): SubmitData => {
    return {
      title: formData.value.translations.find(t => t.locale === 'en')?.title ?? '',
      description: formData.value.translations.find(t => t.locale === 'en')?.description,
      category: formData.value.category,
      cuisine: formData.value.cuisine,
      servings: formData.value.servings,
      prepTimeMinutes: formData.value.prepTimeMinutes,
      cookTimeMinutes: formData.value.cookTimeMinutes,
      difficulty: formData.value.difficulty,
      imageUrl: formData.value.imageUrl,
      source: formData.value.source,
      tags: formData.value.tags,
      nutritionInfo: formData.value.nutritionInfo,
      translations: formData.value.translations,
      ingredients: formData.value.ingredients.map(ing => ({
        name: ing.name || ing.translations?.find(t => t.locale === 'en')?.name || '',
        amount: ing.amount,
        unit: ing.unit,
        translations: ing.translations,
      })),
      steps: formData.value.steps.map(step => ({
        stepNumber: step.stepNumber,
        instruction: step.instruction || step.translations?.find(t => t.locale === 'en')?.instruction || '',
        durationMinutes: step.durationMinutes,
        translations: step.translations,
      })),
    }
  }

  const clearErrors = () => {
    formErrors.value = {}
  }

  return {
    activeLocale,
    tagInput,
    formData,
    formErrors,
    currentTranslation,
    loadRecipe,
    initNewRecipe,
    addIngredient,
    removeIngredient,
    getIngredientName,
    setIngredientName,
    addStep,
    removeStep,
    getStepInstruction,
    setStepInstruction,
    addTag,
    removeTag,
    validate,
    buildSubmitData,
    clearErrors,
  }
}
