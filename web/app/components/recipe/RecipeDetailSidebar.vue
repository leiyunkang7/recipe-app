<script setup lang="ts">
import type { Recipe } from '~/types'

const props = defineProps<{
  recipe: Recipe
}>()

const emit = defineEmits<{
  share: []
}>()

const { t } = useI18n()

// Pre-compute nutrition display flags to avoid repeated conditionals in template
const hasNutritionInfo = computed(() => !!props.recipe.nutritionInfo)
const hasCalories = computed(() => !!props.recipe.nutritionInfo?.calories)
const hasProtein = computed(() => !!props.recipe.nutritionInfo?.protein)
const hasCarbs = computed(() => !!props.recipe.nutritionInfo?.carbs)
const hasFat = computed(() => !!props.recipe.nutritionInfo?.fat)
const hasFiber = computed(() => !!props.recipe.nutritionInfo?.fiber)
</script>

<template>
  <!-- Sidebar - Desktop Only -->
  <div class="space-y-6">
    <!-- Share Menu Card -->
    <div class="bg-white dark:bg-stone-800 rounded-xl shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-stone-100 mb-3 flex items-center gap-2">
        📤 {{ t('recipe.share') || '分享' }}
      </h2>
      <p class="text-gray-600 dark:text-stone-400 text-sm mb-4">
        分享这道美味给朋友！
      </p>
      <div class="mb-4">
        <RecipeShareMenu :recipe="recipe" />
      </div>
      <button
        @click="emit('share')"
        class="w-full bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold py-3 px-4 rounded-lg hover:from-orange-600 hover:to-amber-500 transition-colors flex items-center justify-center gap-2"
      >
        <span class="text-xl">🖼️</span>
        <span>{{ t('recipe.sharePoster') || '生成分享海报' }}</span>
      </button>
    </div>

    <!-- Nutrition Info Card -->
    <div v-if="hasNutritionInfo" class="bg-white dark:bg-stone-800 rounded-xl shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-stone-100 mb-4 flex items-center gap-2">
        🥗 {{ t('recipe.nutritionInfo') }}
      </h2>
      <div class="grid grid-cols-2 gap-4">
        <div v-if="hasCalories" class="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
          <p class="text-2xl mb-1">🔥</p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.calories') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.nutritionInfo!.calories }}</p>
        </div>
        <div v-if="hasProtein" class="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p class="text-2xl mb-1">💪</p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.protein') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.nutritionInfo!.protein }}g</p>
        </div>
        <div v-if="hasCarbs" class="text-center p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
          <p class="text-2xl mb-1">🍞</p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.carbs') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.nutritionInfo!.carbs }}g</p>
        </div>
        <div v-if="hasFat" class="text-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
          <p class="text-2xl mb-1">🧈</p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.fat') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.nutritionInfo!.fat }}g</p>
        </div>
        <div v-if="hasFiber" class="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg col-span-2">
          <p class="text-2xl mb-1">🌾</p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.fiber') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.nutritionInfo!.fiber }}g</p>
        </div>
      </div>
    </div>

    <!-- Quick Info Card -->
    <div class="bg-white dark:bg-stone-800 rounded-xl shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-stone-100 mb-4">{{ t('recipe.quickInfo') }}</h2>
      <div class="space-y-3">
        <div v-if="recipe.category" class="flex justify-between">
          <span class="text-gray-600 dark:text-stone-400">{{ t('recipe.category') }}</span>
          <span class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.category }}</span>
        </div>
        <div v-if="recipe.cuisine" class="flex justify-between">
          <span class="text-gray-600 dark:text-stone-400">{{ t('recipe.cuisine') }}</span>
          <span class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.cuisine }}</span>
        </div>
        <div v-if="recipe.source" class="flex justify-between">
          <span class="text-gray-600 dark:text-stone-400">{{ t('recipe.source') }}</span>
          <a
            v-if="recipe.source.startsWith('http')"
            :href="recipe.source"
            target="_blank"
            rel="noopener noreferrer"
            class="font-semibold text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
          >
            {{ t('recipe.viewSource') }} →
          </a>
          <span v-else class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.source }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
