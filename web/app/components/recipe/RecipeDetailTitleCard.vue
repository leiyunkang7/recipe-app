<script setup lang="ts">
import type { Recipe } from '~/types'
import { getDifficultyClasses, getDifficultyLabel } from '~/utils/difficulty'

const props = defineProps<{
  recipe: Recipe
  totalTime: number
  nutritionInfo?: { calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number }
}>()

const emit = defineEmits<{
  share: []
}>()

const { t, locale } = useI18n()

// Pre-compute nutrition display values
const nutritionDisplay = computed(() => ({
  calories: props.nutritionInfo?.calories ?? '-',
  protein: props.nutritionInfo?.protein ?? '-',
  carbs: props.nutritionInfo?.carbs ?? '-',
  fat: props.nutritionInfo?.fat ?? '-',
  fiber: props.nutritionInfo?.fiber ?? '-',
}))

const hasNutrition = computed(() => {
  const n = props.nutritionInfo
  return n && (n.calories || n.protein || n.carbs || n.fat || n.fiber)
})
</script>

<template>
  <div class="px-3 sm:px-4 -mt-6 relative">
    <div class="bg-white dark:bg-stone-800 rounded-t-2xl sm:rounded-t-3xl shadow-lg p-4 sm:p-5">
      <div class="flex items-start justify-between gap-2 mb-3">
        <h1 class="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-stone-100 leading-tight flex-1 min-w-0">
          <span class="truncate block">{{ recipe.title }}</span>
        </h1>
        <span :class="['px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold uppercase shrink-0', getDifficultyClasses(recipe.difficulty)]">
          {{ getDifficultyLabel(recipe.difficulty, locale) }}
        </span>
      </div>

      <p v-if="recipe.description" class="text-gray-600 dark:text-stone-400 text-sm mb-4 line-clamp-2">
        {{ recipe.description }}
      </p>

      <!-- Nutrition Info (Mobile) -->
      <div v-if="hasNutrition" class="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase">
            {{ t('recipe.nutritionInfo') }}
          </span>
          <span class="text-xs text-gray-500 dark:text-stone-400">
            {{ t('recipe.perServing') }}
          </span>
        </div>
        <div class="grid grid-cols-5 gap-1 text-center">
          <div v-if="nutritionDisplay.calories !== '-'" class="flex flex-col items-center">
            <span class="text-sm font-bold text-orange-600 dark:text-orange-400">{{ nutritionDisplay.calories }}</span>
            <span class="text-xs text-gray-500 dark:text-stone-400">{{ t('nutrition.calories') }}</span>
          </div>
          <div v-if="nutritionDisplay.protein !== '-'" class="flex flex-col items-center">
            <span class="text-sm font-bold text-red-600 dark:text-red-400">{{ nutritionDisplay.protein }}g</span>
            <span class="text-xs text-gray-500 dark:text-stone-400">{{ t('nutrition.protein') }}</span>
          </div>
          <div v-if="nutritionDisplay.carbs !== '-'" class="flex flex-col items-center">
            <span class="text-sm font-bold text-blue-600 dark:text-blue-400">{{ nutritionDisplay.carbs }}g</span>
            <span class="text-xs text-gray-500 dark:text-stone-400">{{ t('nutrition.carbs') }}</span>
          </div>
          <div v-if="nutritionDisplay.fat !== '-'" class="flex flex-col items-center">
            <span class="text-sm font-bold text-yellow-600 dark:text-yellow-400">{{ nutritionDisplay.fat }}g</span>
            <span class="text-xs text-gray-500 dark:text-stone-400">{{ t('nutrition.fat') }}</span>
          </div>
          <div v-if="nutritionDisplay.fiber !== '-'" class="flex flex-col items-center">
            <span class="text-sm font-bold text-green-600 dark:text-green-400">{{ nutritionDisplay.fiber }}g</span>
            <span class="text-xs text-gray-500 dark:text-stone-400">{{ t('nutrition.fiber') }}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-4">
        <RecipeStatCard icon="timer" :label="t('recipe.totalTime')" :value="`${totalTime} ${t('recipe.min')}`" bgClass="bg-orange-50 dark:bg-orange-900/30" iconClass="text-orange-500" />
        <RecipeStatCard icon="people" :label="t('recipe.servings')" :value="recipe.servings" bgClass="bg-blue-50 dark:bg-blue-900/30" iconClass="text-blue-500" />
        <RecipeStatCard icon="prep" :label="t('recipe.prep')" :value="`${recipe.prepTimeMinutes} ${t('recipe.min')}`" bgClass="bg-green-50 dark:bg-green-900/30" iconClass="text-green-500" />
        <RecipeStatCard icon="cook" :label="t('recipe.cook')" :value="`${recipe.cookTimeMinutes} ${t('recipe.min')}`" bgClass="bg-purple-50 dark:bg-purple-900/30" iconClass="text-purple-500" />
      </div>

      <!-- Share Menu -->
      <div class="mb-3">
        <LazyRecipeShareMenu :recipe="recipe" />
      </div>

      <!-- Share Poster Button -->
      <button
        @click="emit('share')"
        class="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 px-4 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-colors flex items-center justify-center gap-2 shadow-md min-h-[48px]"
      >
        <ImageIcon class="w-5 h-5" />
        <span>{{ t('recipe.sharePoster') }}</span>
      </button>
    </div>
  </div>
</template>