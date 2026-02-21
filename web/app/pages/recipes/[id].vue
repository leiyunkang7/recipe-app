<script setup lang="ts">
import { useRecipes } from '~/composables/useRecipes'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { fetchRecipeById, loading, error } = useRecipes()

const recipe = ref<any>(null)

onMounted(async () => {
  recipe.value = await fetchRecipeById(route.params.id as string)
})

watch(() => useI18n().locale.value, async () => {
  recipe.value = await fetchRecipeById(route.params.id as string)
})

const difficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'bg-green-100 text-green-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'hard': return 'bg-red-100 text-red-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const difficultyLabel = (difficulty: string) => {
  return t(`difficulty.${difficulty}`)
}

const totalTime = computed(() => {
  if (!recipe.value) return 0
  return recipe.value.prepTimeMinutes + recipe.value.cookTimeMinutes
})
</script>

<template>
  <div class="min-h-screen bg-stone-50">
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <NuxtLink
            :to="localePath('/', locale)"
            class="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 transition-colors"
          >
            ← {{ t('common.back') }}
          </NuxtLink>
          <LanguageSwitcher />
        </div>
      </div>
    </header>

    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>

    <div v-else-if="error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <p class="text-red-800">{{ error }}</p>
      </div>
    </div>

    <div v-else-if="recipe" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div class="lg:col-span-2 space-y-8">
          <div class="bg-white rounded-xl shadow-md overflow-hidden">
            <div class="relative h-96 bg-gradient-to-br from-orange-100 to-orange-200">
              <img
                v-if="recipe.imageUrl"
                :src="recipe.imageUrl"
                :alt="recipe.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="text-9xl">🍽️</span>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-md p-6">
            <div class="flex items-start justify-between mb-4">
              <div>
                <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ recipe.title }}</h1>
                <p v-if="recipe.description" class="text-gray-600">{{ recipe.description }}</p>
              </div>
              <span
                :class="[
                  'px-3 py-1 rounded-full text-sm font-semibold uppercase',
                  difficultyColor(recipe.difficulty)
                ]"
              >
                {{ difficultyLabel(recipe.difficulty) }}
              </span>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div class="text-center p-3 bg-orange-50 rounded-lg">
                <p class="text-2xl mb-1">⏱️</p>
                <p class="text-sm text-gray-600">{{ t('recipe.totalTime') }}</p>
                <p class="font-semibold text-gray-900">{{ totalTime }} {{ t('recipe.min') }}</p>
              </div>
              <div class="text-center p-3 bg-blue-50 rounded-lg">
                <p class="text-2xl mb-1">👥</p>
                <p class="text-sm text-gray-600">{{ t('recipe.servings') }}</p>
                <p class="font-semibold text-gray-900">{{ recipe.servings }}</p>
              </div>
              <div class="text-center p-3 bg-green-50 rounded-lg">
                <p class="text-2xl mb-1">🥬</p>
                <p class="text-sm text-gray-600">{{ t('recipe.prep') }}</p>
                <p class="font-semibold text-gray-900">{{ recipe.prepTimeMinutes }} {{ t('recipe.min') }}</p>
              </div>
              <div class="text-center p-3 bg-purple-50 rounded-lg">
                <p class="text-2xl mb-1">🍳</p>
                <p class="text-sm text-gray-600">{{ t('recipe.cook') }}</p>
                <p class="font-semibold text-gray-900">{{ recipe.cookTimeMinutes }} {{ t('recipe.min') }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-md p-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              🛒 {{ t('recipe.ingredients') }}
            </h2>
            <ul class="space-y-3">
              <li
                v-for="ingredient in recipe.ingredients"
                :key="ingredient.name"
                class="flex items-center gap-3 p-3 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <span class="flex-shrink-0 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </span>
                <span class="flex-1 font-medium text-gray-900">{{ ingredient.name }}</span>
                <span class="text-sm text-gray-600">
                  {{ ingredient.amount }} {{ ingredient.unit }}
                </span>
              </li>
            </ul>
          </div>

          <div class="bg-white rounded-xl shadow-md p-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              📝 {{ t('recipe.instructions') }}
            </h2>
            <ol class="space-y-6">
              <li
                v-for="(step, index) in recipe.steps"
                :key="index"
                class="flex gap-4"
              >
                <span class="flex-shrink-0 w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {{ index + 1 }}
                </span>
                <div class="flex-1">
                  <p class="text-gray-900 leading-relaxed">{{ step.instruction }}</p>
                  <p v-if="step.durationMinutes" class="text-sm text-gray-500 mt-2">
                    ⏱️ {{ t('recipe.duration') }}: {{ step.durationMinutes }} {{ t('recipe.min') }}
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div v-if="recipe.tags && recipe.tags.length > 0" class="bg-white rounded-xl shadow-md p-6">
            <h2 class="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              🏷️ {{ t('recipe.tags') }}
            </h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in recipe.tags"
                :key="tag"
                class="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium"
              >
                {{ tag }}
              </span>
            </div>
          </div>
        </div>

        <div class="space-y-6">
          <div v-if="recipe.nutritionInfo" class="bg-white rounded-xl shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              🥗 {{ t('recipe.nutritionInfo') }}
            </h2>
            <div class="grid grid-cols-2 gap-4">
              <div v-if="recipe.nutritionInfo.calories" class="text-center p-3 bg-red-50 rounded-lg">
                <p class="text-2xl mb-1">🔥</p>
                <p class="text-xs text-gray-600">{{ t('recipe.calories') }}</p>
                <p class="font-semibold text-gray-900">{{ recipe.nutritionInfo.calories }}</p>
              </div>
              <div v-if="recipe.nutritionInfo.protein" class="text-center p-3 bg-blue-50 rounded-lg">
                <p class="text-2xl mb-1">💪</p>
                <p class="text-xs text-gray-600">{{ t('recipe.protein') }}</p>
                <p class="font-semibold text-gray-900">{{ recipe.nutritionInfo.protein }}g</p>
              </div>
              <div v-if="recipe.nutritionInfo.carbs" class="text-center p-3 bg-yellow-50 rounded-lg">
                <p class="text-2xl mb-1">🍞</p>
                <p class="text-xs text-gray-600">{{ t('recipe.carbs') }}</p>
                <p class="font-semibold text-gray-900">{{ recipe.nutritionInfo.carbs }}g</p>
              </div>
              <div v-if="recipe.nutritionInfo.fat" class="text-center p-3 bg-purple-50 rounded-lg">
                <p class="text-2xl mb-1">🧈</p>
                <p class="text-xs text-gray-600">{{ t('recipe.fat') }}</p>
                <p class="font-semibold text-gray-900">{{ recipe.nutritionInfo.fat }}g</p>
              </div>
              <div v-if="recipe.nutritionInfo.fiber" class="text-center p-3 bg-green-50 rounded-lg col-span-2">
                <p class="text-2xl mb-1">🌾</p>
                <p class="text-xs text-gray-600">{{ t('recipe.fiber') }}</p>
                <p class="font-semibold text-gray-900">{{ recipe.nutritionInfo.fiber }}g</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-md p-6">
            <h2 class="text-xl font-bold text-gray-900 mb-4">{{ t('recipe.quickInfo') }}</h2>
            <div class="space-y-3">
              <div v-if="recipe.category" class="flex justify-between">
                <span class="text-gray-600">{{ t('recipe.category') }}</span>
                <span class="font-semibold text-gray-900">{{ recipe.category }}</span>
              </div>
              <div v-if="recipe.cuisine" class="flex justify-between">
                <span class="text-gray-600">{{ t('recipe.cuisine') }}</span>
                <span class="font-semibold text-gray-900">{{ recipe.cuisine }}</span>
              </div>
              <div v-if="recipe.source" class="flex justify-between">
                <span class="text-gray-600">{{ t('recipe.source') }}</span>
                <a
                  v-if="recipe.source.startsWith('http')"
                  :href="recipe.source"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-semibold text-orange-600 hover:text-orange-700"
                >
                  {{ t('recipe.viewSource') }} →
                </a>
                <span v-else class="font-semibold text-gray-900">{{ recipe.source }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
