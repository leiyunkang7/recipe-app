<script setup lang="ts">
import { useRecipes } from '~/composables/useRecipes'
import type { Locale, Translation, IngredientTranslation, StepTranslation } from '~/types'

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
    calories: undefined as number | undefined,
    protein: undefined as number | undefined,
    carbs: undefined as number | undefined,
    fat: undefined as number | undefined,
    fiber: undefined as number | undefined,
  },
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

const currentTranslation = computed(() => 
  formData.value.translations.find(t => t.locale === activeLocale.value) || formData.value.translations[0]
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
        nutritionInfo: recipe.nutritionInfo || {},
        translations: recipe.translations || [
          { locale: 'en', title: recipe.title, description: recipe.description || '' },
          { locale: 'zh-CN', title: '', description: '' },
        ],
        ingredients: (recipe.ingredients || []).map(ing => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          translations: ing.translations || [
            { locale: 'en' as Locale, name: ing.name },
            { locale: 'zh-CN' as Locale, name: '' },
          ],
        })),
        steps: (recipe.steps || []).map(step => ({
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

const getIngredientName = (index: number) => {
  const ing = formData.value.ingredients[index]
  return ing.translations?.find(t => t.locale === activeLocale.value)?.name || ing.name
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

const getStepInstruction = (index: number) => {
  const step = formData.value.steps[index]
  return step.translations?.find(t => t.locale === activeLocale.value)?.instruction || step.instruction
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
  const submitData = {
    title: formData.value.translations.find(t => t.locale === 'en')?.title || '',
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

    <main class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-900">{{ t('form.language') }}</h2>
            <div class="flex gap-2">
              <button
                type="button"
                @click="activeLocale = 'en'"
                :class="[
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  activeLocale === 'en' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >
                {{ t('form.english') }}
              </button>
              <button
                type="button"
                @click="activeLocale = 'zh-CN'"
                :class="[
                  'px-4 py-2 rounded-lg font-medium transition-colors',
                  activeLocale === 'zh-CN' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                ]"
              >
                {{ t('form.chinese') }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ t('form.title') }} *
              </label>
              <input
                v-model="currentTranslation.title"
                type="text"
                required
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                :placeholder="t('form.titlePlaceholder')"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ t('form.description') }}
              </label>
              <textarea
                v-model="currentTranslation.description"
                rows="3"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                :placeholder="t('form.descriptionPlaceholder')"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ t('form.category') }} *
              </label>
              <select
                v-model="formData.category"
                required
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">{{ t('form.selectCategory') }}</option>
                <option v-for="cat in categoryKeys" :key="cat.name" :value="cat.name">
                  {{ cat.displayName }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ t('form.cuisine') }}
              </label>
              <select
                v-model="formData.cuisine"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">{{ t('form.selectCuisine') }}</option>
                <option v-for="cui in cuisineKeys" :key="cui.name" :value="cui.name">
                  {{ cui.displayName }}
                </option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ t('form.servings') }} *
              </label>
              <input
                v-model.number="formData.servings"
                type="number"
                min="1"
                required
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ t('form.difficulty') }} *
              </label>
              <select
                v-model="formData.difficulty"
                required
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white"
              >
                <option value="easy">{{ t('difficulty.easy') }}</option>
                <option value="medium">{{ t('difficulty.medium') }}</option>
                <option value="hard">{{ t('difficulty.hard') }}</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ t('form.prepTime') }} *
              </label>
              <input
                v-model.number="formData.prepTimeMinutes"
                type="number"
                min="0"
                required
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ t('form.cookTime') }} *
              </label>
              <input
                v-model.number="formData.cookTimeMinutes"
                type="number"
                min="0"
                required
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ t('form.imageUrl') }}
              </label>
              <input
                v-model="formData.imageUrl"
                type="url"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                :placeholder="t('form.imageUrlPlaceholder')"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ t('form.source') }}
              </label>
              <input
                v-model="formData.source"
                type="url"
                class="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                :placeholder="t('form.sourcePlaceholder')"
              />
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-900">{{ t('form.ingredients') }}</h2>
            <button
              type="button"
              @click="addIngredient"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + {{ t('form.addIngredient') }}
            </button>
          </div>

          <div class="space-y-3">
            <div
              v-for="(ingredient, index) in formData.ingredients"
              :key="index"
              class="flex gap-3 items-start"
            >
              <div class="flex-1">
                <input
                  :value="getIngredientName(index)"
                  @input="setIngredientName(index, ($event.target as HTMLInputElement).value)"
                  type="text"
                  :placeholder="t('form.ingredientName')"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
              <div class="w-24">
                <input
                  v-model.number="ingredient.amount"
                  type="number"
                  step="0.1"
                  min="0"
                  :placeholder="t('form.amount')"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
              <div class="w-24">
                <input
                  v-model="ingredient.unit"
                  type="text"
                  :placeholder="t('form.unit')"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
              <button
                type="button"
                @click="removeIngredient(index)"
                class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                :aria-label="t('common.delete')"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold text-gray-900">{{ t('form.steps') }}</h2>
            <button
              type="button"
              @click="addStep"
              class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + {{ t('form.addStep') }}
            </button>
          </div>

          <div class="space-y-4">
            <div
              v-for="(step, index) in formData.steps"
              :key="index"
              class="flex gap-3 items-start"
            >
              <span class="flex-shrink-0 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm mt-2">
                {{ step.stepNumber }}
              </span>
              <div class="flex-1 space-y-2">
                <textarea
                  :value="getStepInstruction(index)"
                  @input="setStepInstruction(index, ($event.target as HTMLTextAreaElement).value)"
                  rows="2"
                  :placeholder="t('form.instruction')"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
                <input
                  v-model.number="step.durationMinutes"
                  type="number"
                  min="0"
                  :placeholder="t('form.duration')"
                  class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                />
              </div>
              <button
                type="button"
                @click="removeStep(index)"
                class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2"
                :aria-label="t('common.delete')"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">{{ t('form.tags') }}</h2>
          <div class="flex gap-2 mb-4">
            <input
              v-model="tagInput"
              @keyup.enter="addTag"
              type="text"
              :placeholder="t('form.tagsPlaceholder')"
              class="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            />
            <button
              type="button"
              @click="addTag"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {{ t('form.addTag') }}
            </button>
          </div>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="tag in formData.tags"
              :key="tag"
              class="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2"
            >
              {{ tag }}
              <button
                type="button"
                @click="removeTag(tag)"
                class="text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-6">
          <h2 class="text-xl font-bold text-gray-900 mb-4">{{ t('form.nutritionOptional') }}</h2>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('recipe.calories') }}</label>
              <input
                v-model.number="formData.nutritionInfo.calories"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('recipe.protein') }} (g)</label>
              <input
                v-model.number="formData.nutritionInfo.protein"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('recipe.carbs') }} (g)</label>
              <input
                v-model.number="formData.nutritionInfo.carbs"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('recipe.fat') }} (g)</label>
              <input
                v-model.number="formData.nutritionInfo.fat"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('recipe.fiber') }} (g)</label>
              <input
                v-model.number="formData.nutritionInfo.fiber"
                type="number"
                min="0"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              />
            </div>
          </div>
        </div>

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
