import type { Locale, Translation, IngredientTranslation, StepTranslation, NutritionInfo } from '~/types'
import { generateTempId } from '~/utils/form'

interface RecipeFormData {
  category: string
  cuisine: string
  servings: number
  prepTimeMinutes: number
  cookTimeMinutes: number
  difficulty: 'easy' | 'medium' | 'hard'
  imageUrl: string
  imageSrcset?: { avif: string; webp: string }
  source: string
  tags: string[]
  nutritionInfo: NutritionInfo
  translations: Translation[]
  ingredients: Array<{
    _tempId?: string
    name: string
    amount: number
    unit: string
    translations: IngredientTranslation[]
  }>
  steps: Array<{
    _tempId?: string
    stepNumber: number
    instruction: string
    durationMinutes?: number
    translations: StepTranslation[]
  }>
}

export function useRecipeForm() {
  const { t } = useI18n()
  const { user } = useAuth()
  const recipes = useRecipes()
  const { createRecipe, updateRecipe, fetchRecipeById, loading } = recipes
  const recipeQueries = useRecipeQueries()

  const categoryKeys = ref<Array<{ id: number; name: string; displayName: string }>>([])
  const cuisineKeys = ref<Array<{ id: number; name: string; displayName: string }>>([])
  const activeLocale = ref<Locale>('en')
  const tagInput = ref('')
  const submitError = ref<string | null>(null)

  const formData = ref<RecipeFormData>({
    category: '',
    cuisine: '',
    servings: 4,
    prepTimeMinutes: 30,
    cookTimeMinutes: 30,
    difficulty: 'medium',
    imageUrl: '',
    imageSrcset: undefined,
    source: '',
    tags: [],
    nutritionInfo: {
      calories: undefined,
      protein: undefined,
      carbs: undefined,
      fat: undefined,
      fiber: undefined,
    },
    translations: [
      { locale: 'en' as Locale, title: '', description: '' },
      { locale: 'zh-CN' as Locale, title: '', description: '' },
    ],
    ingredients: [],
    steps: [],
  })

  const currentTranslation = computed(() => 
    formData.value.translations.find((tr: Translation) => tr.locale === activeLocale.value) ?? formData.value.translations[0]!
  )

  const initForm = async (recipeId?: string, isEdit = false) => {
    categoryKeys.value = await recipeQueries.fetchCategoryKeys()
    cuisineKeys.value = await recipeQueries.fetchCuisineKeys()

    if (isEdit && recipeId) {
      const recipe = await fetchRecipeById(recipeId)
      if (recipe) {
        formData.value = {
          category: recipe.category,
          cuisine: recipe.cuisine || '',
          servings: recipe.servings,
          prepTimeMinutes: recipe.prepTimeMinutes,
          cookTimeMinutes: recipe.cookTimeMinutes,
          difficulty: recipe.difficulty,
          imageUrl: recipe.imageUrl || '',
          imageSrcset: recipe.imageSrcset,
          source: recipe.source || '',
          tags: recipe.tags || [],
          nutritionInfo: recipe.nutritionInfo || {
            calories: undefined,
            protein: undefined,
            carbs: undefined,
            fat: undefined,
            fiber: undefined,
          },
          translations: recipe.translations || [
            { locale: 'en', title: recipe.title, description: recipe.description || '' },
            { locale: 'zh-CN', title: '', description: '' },
          ],
          ingredients: (recipe.ingredients || []).map((ing: { name: string; amount: number; unit: string; translations?: IngredientTranslation[] }) => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit,
            translations: ing.translations || [
              { locale: 'en' as Locale, name: ing.name },
              { locale: 'zh-CN' as Locale, name: '' },
            ],
          })),
          steps: (recipe.steps || []).map((step: { stepNumber: number; instruction: string; durationMinutes?: number; translations?: StepTranslation[] }) => ({
            stepNumber: step.stepNumber,
            instruction: step.instruction,
            durationMinutes: step.durationMinutes,
            translations: step.translations || [
              { locale: 'en' as Locale, instruction: step.instruction },
              { locale: 'zh-CN' as Locale, instruction: '' },
            ],
          })),
        }
      }
    } else {
      addIngredient()
      addStep()
    }
  }

  const addIngredient = () => {
    formData.value.ingredients.push({
      _tempId: generateTempId('form'),
      name: '',
      amount: 0,
      unit: '',
      translations: [
        { locale: 'en', name: '' },
        { locale: 'zh-CN', name: '' },
      ],
    })
  }

  const removeIngredient = (index: number) => {
    formData.value.ingredients.splice(index, 1)
  }

  const addStep = () => {
    const nextStepNumber = formData.value.steps.length + 1
    formData.value.steps.push({
      _tempId: generateTempId('form'),
      stepNumber: nextStepNumber,
      instruction: '',
      durationMinutes: undefined,
      translations: [
        { locale: 'en', instruction: '' },
        { locale: 'zh-CN', instruction: '' },
      ],
    })
  }

  const removeStep = (index: number) => {
    formData.value.steps = formData.value.steps
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, stepNumber: i + 1 }))
  }

  const addTag = () => {
    if (tagInput.value.trim() && !formData.value.tags.includes(tagInput.value.trim())) {
      formData.value.tags.push(tagInput.value.trim())
      tagInput.value = ''
    }
  }

  const removeTag = (tag: string) => {
    const index = formData.value.tags.indexOf(tag)
    if (index > -1) {
      formData.value.tags.splice(index, 1)
    }
  }

  // Calculate nutrition from ingredients using the backend API
  const calculateNutrition = async (): Promise<NutritionInfo | null> => {
    const validIngredients = formData.value.ingredients.filter((i: { name: string; translations: IngredientTranslation[] }) =>
      i.name.trim() || i.translations?.some((tr: IngredientTranslation) => tr.name.trim())
    )

    if (validIngredients.length === 0) {
      return null
    }

    try {
      // Convert ingredients to the format expected by the API
      const ingredients = validIngredients.map((ing: { name: string; amount: number; unit: string; translations: IngredientTranslation[] }) => {
        const enIngTranslation = ing.translations?.find((tr: IngredientTranslation) => tr.locale === 'en')
        return {
          name: ing.name || enIngTranslation?.name || '',
          amount: ing.amount,
          unit: ing.unit,
        }
      })

      const response = await $fetch('/api/nutrition/analyze', {
        method: 'POST',
        body: {
          ingredients,
          servings: formData.value.servings,
        },
      }) as { success: boolean; data?: { perServing: { calories: number; protein: number; carbs: number; fat: number; fiber: number } } }

      if (response.success && response.data) {
        const { perServing } = response.data
        return {
          calories: Math.round(perServing.calories),
          protein: Math.round(perServing.protein * 10) / 10,
          carbs: Math.round(perServing.carbs * 10) / 10,
          fat: Math.round(perServing.fat * 10) / 10,
          fiber: Math.round(perServing.fiber * 10) / 10,
        }
      }
      return null
    } catch (error) {
      console.error('Failed to calculate nutrition:', error)
      return null
    }
  }


  const handleSubmit = async (recipeId?: string) => {
    submitError.value = null

    const validIngredients = formData.value.ingredients.filter((i: { name: string; translations: IngredientTranslation[] }) =>
      i.name.trim() || i.translations?.some((tr: IngredientTranslation) => tr.name.trim())
    )
    const validSteps = formData.value.steps.filter((s: { instruction: string; translations: StepTranslation[] }) =>
      s.instruction.trim() || s.translations?.some((tr: StepTranslation) => tr.instruction.trim())
    )

    if (validIngredients.length === 0) {
      submitError.value = t('validation.atLeastOneIngredient')
      return false
    }
    if (validSteps.length === 0) {
      submitError.value = t('validation.atLeastOneStep')
      return false
    }

    // Cache English translation lookup - O(n) once instead of O(n) per ingredient/step
    const enTranslation = formData.value.translations.find((tr: Translation) => tr.locale === 'en')

    const submitData = {
      authorId: user.value?.id,
      title: enTranslation?.title || '',
      description: enTranslation?.description,
      category: formData.value.category,
      cuisine: formData.value.cuisine,
      servings: formData.value.servings,
      prepTimeMinutes: formData.value.prepTimeMinutes,
      cookTimeMinutes: formData.value.cookTimeMinutes,
      difficulty: formData.value.difficulty,
      imageUrl: formData.value.imageUrl,
      imageSrcset: formData.value.imageSrcset,
      source: formData.value.source,
      tags: formData.value.tags,
      nutritionInfo: formData.value.nutritionInfo,
      translations: formData.value.translations,
      ingredients: formData.value.ingredients.map((ing: { name: string; amount: number; unit: string; translations: IngredientTranslation[] }) => {
        const enIngTranslation = ing.translations?.find((tr: IngredientTranslation) => tr.locale === 'en')
        return {
          name: ing.name || enIngTranslation?.name || '',
          amount: ing.amount,
          unit: ing.unit,
          translations: ing.translations,
        }
      }),
      steps: formData.value.steps.map((step: { stepNumber: number; instruction: string; durationMinutes?: number; translations: StepTranslation[] }) => {
        // Cache step English translation lookup
        const enStepTranslation = step.translations?.find((tr: StepTranslation) => tr.locale === 'en')
        return {
          stepNumber: step.stepNumber,
          instruction: step.instruction || enStepTranslation?.instruction || '',
          durationMinutes: step.durationMinutes,
          translations: step.translations,
        }
      }),
    }

    const success = recipeId
      ? await updateRecipe(recipeId, submitData)
      : await createRecipe(submitData)

    return success
  }

  return {
    formData,
    categoryKeys,
    cuisineKeys,
    activeLocale,
    tagInput,
    submitError,
    currentTranslation,
    loading,
    initForm,
    addIngredient,
    removeIngredient,
    addStep,
    removeStep,
    addTag,
    removeTag,
    handleSubmit,
    calculateNutrition,
  }
}
