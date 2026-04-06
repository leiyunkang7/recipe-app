<script setup lang="ts">
import type { Recipe } from '~/types'
import { getDifficultyClasses, getDifficultyLabel } from '~/utils/difficulty'

const props = defineProps<{
  recipe: Recipe
  totalTime: number
  nutritionInfo: { calories?: number; protein?: number; carbs?: number; fat?: number }
  isFavorite: boolean
}>()

const emit = defineEmits<{
  'toggle-favorite': []
}>()

const { t, locale } = useI18n()

// Pre-compute nutrition display values to avoid "undefined" in template
const nutritionDisplay = computed(() => ({
  calories: props.nutritionInfo?.calories ?? '-',
  protein: props.nutritionInfo?.protein ?? '-',
  carbs: props.nutritionInfo?.carbs ?? '-',
  fat: props.nutritionInfo?.fat ?? '-',
}))
</script>

<template>
  <div class="bg-white dark:bg-stone-800 rounded-xl shadow-md dark:shadow-stone-900/30 p-6">
    <div class="flex items-start justify-between mb-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-stone-100 mb-2">{{ recipe.title }}</h1>
        <p v-if="recipe.description" class="text-gray-600 dark:text-stone-400">{{ recipe.description }}</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="emit('toggle-favorite')" class="p-2 rounded-full hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors">
          <HeartIcon class="w-6 h-6" :class="isFavorite ? 'text-red-500' : 'text-gray-400'" :filled="isFavorite" />
        </button>
        <span :class="['px-3 py-1 rounded-full text-sm font-semibold uppercase', getDifficultyClasses(recipe.difficulty)]">
          {{ getDifficultyLabel(recipe.difficulty, locale) }}
        </span>
      </div>
    </div>

    <div class="bg-gradient-to-r from-orange-50 dark:from-orange-900/30 to-amber-50 dark:to-amber-900/30 rounded-xl p-4 mb-6">
      <h3 class="text-sm font-semibold text-gray-600 dark:text-stone-400 mb-3 flex items-center gap-2">
        <ChartIcon class="w-4 h-4" /> {{ t('recipe.nutritionInfo') }}
      </h3>
      <div class="grid grid-cols-4 gap-2 text-center">
        <div class="bg-white dark:bg-stone-800 rounded-lg p-2 shadow-sm">
          <div class="text-lg font-bold text-orange-600 dark:text-orange-400">{{ nutritionDisplay.calories }}</div>
          <div class="text-xs text-gray-500 dark:text-stone-400">{{ t('recipe.calories') }}</div>
        </div>
        <div class="bg-white dark:bg-stone-800 rounded-lg p-2 shadow-sm">
          <div class="text-lg font-bold text-green-600 dark:text-green-400">{{ nutritionDisplay.protein }}g</div>
          <div class="text-xs text-gray-500 dark:text-stone-400">{{ t('recipe.protein') }}</div>
        </div>
        <div class="bg-white dark:bg-stone-800 rounded-lg p-2 shadow-sm">
          <div class="text-lg font-bold text-blue-600 dark:text-blue-400">{{ nutritionDisplay.carbs }}g</div>
          <div class="text-xs text-gray-500 dark:text-stone-400">{{ t('recipe.carbs') }}</div>
        </div>
        <div class="bg-white dark:bg-stone-800 rounded-lg p-2 shadow-sm">
          <div class="text-lg font-bold text-yellow-600 dark:text-yellow-400">{{ nutritionDisplay.fat }}g</div>
          <div class="text-xs text-gray-500 dark:text-stone-400">{{ t('recipe.fat') }}</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <RecipeStatCard icon="timer" :label="t('recipe.totalTime')" :value="`${totalTime} ${t('recipe.min')}`" size="lg" bgClass="bg-orange-50 dark:bg-orange-900/30" iconClass="text-orange-500" />
      <RecipeStatCard icon="people" :label="t('recipe.servings')" :value="recipe.servings" size="lg" bgClass="bg-blue-50 dark:bg-blue-900/30" iconClass="text-blue-500" />
      <RecipeStatCard icon="prep" :label="t('recipe.prep')" :value="`${recipe.prepTimeMinutes} ${t('recipe.min')}`" size="lg" bgClass="bg-green-50 dark:bg-green-900/30" iconClass="text-green-500" />
      <RecipeStatCard icon="cook" :label="t('recipe.cook')" :value="`${recipe.cookTimeMinutes} ${t('recipe.min')}`" size="lg" bgClass="bg-purple-50 dark:bg-purple-900/30" iconClass="text-purple-500" />
    </div>
  </div>
</template>
