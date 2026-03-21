<script setup lang="ts">
import { useRecipes } from '~/composables/useRecipes'
import type { Locale, Translation, IngredientTranslation, StepTranslation, NutritionInfo } from '~/types'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { fetchRecipeById, createRecipe, updateRecipe, loading, fetchCategoryKeys, fetchCuisineKeys } = useRecipes()

const isEdit = computed(() => route.params.id !== 'new')

useSeoMeta({
  title: () => isEdit.value 
    ? `${t('admin.editRecipe')} - ${t('admin.title')}` 
    : `${t('admin.newRecipe')} - ${t('admin.title')}`,
})

const categoryKeys = ref<Array<{ id: number; name: string; displayName: string }>>([])
const cuisineKeys = ref<Array<{ id: number; name: string; displayName: string }>>([])

const activeLocale = ref<Locale>('en')

const formData = ref({
  category: '',
  cuisine: '',
  servings: 4,
  prepTimeMinutes: 30,
  cookTimeMinutes: 30,
  difficulty: 'medium' as 'easy' | 'medium' | 'hard',
  imageUrl: '',
  source: '',
  tags: [] as string[],
  nutritionInfo: {
    calories: undefined,
    protein: undefined,
    carbs: undefined,
    fat: undefined,
    fiber: undefined,
  } as NutritionInfo,
  translations: [
    { locale: 'en' as Locale, title: '', description: '' },
    { locale: 'zh-CN' as Locale, title: '', description: '' },
  ] as Translation[],
  ingredients: [] as Array<{
    name: string
    amount: number
    unit: string
    translations: IngredientTranslation[]
  }>,
  steps: [] as Array<{
    stepNumber: number
    instruction: string
    durationMinutes?: number
    translations: StepTranslation[]
  }>,
})

const tagInput = ref('')
const submitError = ref<string | null>(null)

const currentTranslation = computed(() => 
  formData.value.translations.find((t: Translation) => t.locale === activeLocale.value) ?? formData.value.translations[0]!
)

onMounted(async () => {
  categoryKeys.value = await fetchCategoryKeys()
  cuisineKeys.value = await fetchCuisineKeys()

  if (isEdit.value) {
    const recipe = await fetchRecipeById(route.params.id as string)
    if (recipe) {
      formData.value = {
        category: recipe.category,
        cuisine: recipe.cuisine || '',
        servings: recipe.servings,
        prepTimeMinutes: recipe.prepTimeMinutes,
        cookTimeMinutes: recipe.cookTimeMinutes,
        difficulty: recipe.difficulty,
        imageUrl: recipe.imageUrl || '',
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
})

const addIngredient = () => {
  formData.value.ingredients.push({
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
  formData.value.steps.splice(index, 1)
  formData.value.steps.forEach((step, i) => {
    step.stepNumber = i + 1
  })
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

const handleSubmit = async () => {
  submitError.value = null

  const validIngredients = formData.value.ingredients.filter((i: { name: string; translations: IngredientTranslation[] }) => 
    i.name.trim() || i.translations?.some((t: IngredientTranslation) => t.name.trim())
  )
  const validSteps = formData.value.steps.filter((s: { instruction: string; translations: StepTranslation[] }) => 
    s.instruction.trim() || s.translations?.some((t: StepTranslation) => t.instruction.trim())
  )

  if (validIngredients.length === 0) {
    submitError.value = t('validation.atLeastOneIngredient')
    return
  }
  if (validSteps.length === 0) {
    submitError.value = t('validation.atLeastOneStep')
    return
  }

  const submitData = {
    title: formData.value.translations.find((t: Translation) => t.locale === 'en')?.title || '',
    description: formData.value.translations.find((t: Translation) => t.locale === 'en')?.description,
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
    ingredients: formData.value.ingredients.map((ing: { name: string; amount: number; unit: string; translations: IngredientTranslation[] }) => ({
      name: ing.name || ing.translations?.find((t: IngredientTranslation) => t.locale === 'en')?.name || '',
      amount: ing.amount,
      unit: ing.unit,
      translations: ing.translations,
    })),
    steps: formData.value.steps.map((step: { stepNumber: number; instruction: string; durationMinutes?: number; translations: StepTranslation[] }) => ({
      stepNumber: step.stepNumber,
      instruction: step.instruction || step.translations?.find((t: StepTranslation) => t.locale === 'en')?.instruction || '',
      durationMinutes: step.durationMinutes,
      translations: step.translations,
    })),
  }

  const success = isEdit.value
    ? await updateRecipe(route.params.id as string, submitData)
    : await createRecipe(submitData)

  if (success) {
    navigateTo(localePath('/admin', locale.value))
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">
              {{ isEdit ? `✏️ ${t('admin.editRecipe')}` : `+ ${t('admin.newRecipe')}` }}
            </h1>
          </div>
          <div class="flex items-center gap-3">
            <LanguageSwitcher />
            <NuxtLink
              :to="localePath('/admin', locale)"
              class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {{ t('form.cancel') }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Form -->
    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Error Message -->
      <div v-if="submitError" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
        <p class="text-red-800">{{ submitError }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Basic Info Form -->
        <AdminRecipeBasicForm
          v-model:activeLocale="activeLocale"
          v-model:formData="formData"
          :category-keys="categoryKeys"
          :cuisine-keys="cuisineKeys"
          :current-translation="currentTranslation"
        />

        <!-- Ingredients Form -->
        <AdminRecipeIngredients
          v-model:ingredients="formData.ingredients"
          :active-locale="activeLocale"
        />

        <!-- Steps Form -->
        <AdminRecipeSteps
          v-model:steps="formData.steps"
          :active-locale="activeLocale"
        />

        <!-- Tags Form -->
        <AdminRecipeTags
          v-model:tags="formData.tags"
          v-model:tagInput="tagInput"
          @add-tag="addTag"
          @remove-tag="removeTag"
        />

        <!-- Nutrition Form -->
        <AdminRecipeNutrition
          v-model:nutritionInfo="formData.nutritionInfo"
        />

        <!-- Submit Buttons -->
        <div class="flex justify-end gap-3">
          <NuxtLink
            :to="localePath('/admin', locale)"
            class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            {{ t('form.cancel') }}
          </NuxtLink>
          <button
            type="submit"
            :disabled="loading"
            class="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? t('form.saving') : (isEdit ? t('form.update') : t('form.save')) }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>
