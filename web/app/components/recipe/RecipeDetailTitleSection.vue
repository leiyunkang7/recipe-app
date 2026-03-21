<script setup lang="ts">
import type { Recipe } from '~/types'

const props = defineProps<{
  recipe: Recipe
  totalTime: number
  nutritionInfo: { calories: number; protein: number; carbs: number; fat: number }
  difficultyColor: (difficulty: string) => string
  difficultyLabel: (difficulty: string) => string
  isFavorite: boolean
}>()

const emit = defineEmits<{
  'toggle-favorite': []
}>()

const { t } = useI18n()
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
          <span class="text-2xl">{{ isFavorite ? '❤️' : '🤍' }}</span>
        </button>
        <span :class="['px-3 py-1 rounded-full text-sm font-semibold uppercase', difficultyColor(recipe.difficulty)]">
          {{ difficultyLabel(recipe.difficulty) }}
        </span>
      </div>
    </div>

    <div class="bg-gradient-to-r from-orange-50 dark:from-orange-900/30 to-amber-50 dark:to-amber-900/30 rounded-xl p-4 mb-6">
      <h3 class="text-sm font-semibold text-gray-600 dark:text-stone-400 mb-3">📊 营养信息</h3>
      <div class="grid grid-cols-4 gap-2 text-center">
        <div class="bg-white dark:bg-stone-800 rounded-lg p-2 shadow-sm">
          <div class="text-lg font-bold text-orange-600 dark:text-orange-400">{{ nutritionInfo.calories }}</div>
          <div class="text-xs text-gray-500 dark:text-stone-400">卡路里</div>
        </div>
        <div class="bg-white dark:bg-stone-800 rounded-lg p-2 shadow-sm">
          <div class="text-lg font-bold text-green-600 dark:text-green-400">{{ nutritionInfo.protein }}g</div>
          <div class="text-xs text-gray-500 dark:text-stone-400">蛋白质</div>
        </div>
        <div class="bg-white dark:bg-stone-800 rounded-lg p-2 shadow-sm">
          <div class="text-lg font-bold text-blue-600 dark:text-blue-400">{{ nutritionInfo.carbs }}g</div>
          <div class="text-xs text-gray-500 dark:text-stone-400">碳水</div>
        </div>
        <div class="bg-white dark:bg-stone-800 rounded-lg p-2 shadow-sm">
          <div class="text-lg font-bold text-yellow-600 dark:text-yellow-400">{{ nutritionInfo.fat }}g</div>
          <div class="text-xs text-gray-500 dark:text-stone-400">脂肪</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      <div class="text-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg">
        <p class="text-2xl mb-1">⏱️</p>
        <p class="text-sm text-gray-600 dark:text-stone-400">{{ t('recipe.totalTime') }}</p>
        <p class="font-semibold text-gray-900 dark:text-stone-100">{{ totalTime }} {{ t('recipe.min') }}</p>
      </div>
      <div class="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
        <p class="text-2xl mb-1">👥</p>
        <p class="text-sm text-gray-600 dark:text-stone-400">{{ t('recipe.servings') }}</p>
        <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.servings }}</p>
      </div>
      <div class="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
        <p class="text-2xl mb-1">🥬</p>
        <p class="text-sm text-gray-600 dark:text-stone-400">{{ t('recipe.prep') }}</p>
        <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.prepTimeMinutes }} {{ t('recipe.min') }}</p>
      </div>
      <div class="text-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
        <p class="text-2xl mb-1">🍳</p>
        <p class="text-sm text-gray-600 dark:text-stone-400">{{ t('recipe.cook') }}</p>
        <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.cookTimeMinutes }} {{ t('recipe.min') }}</p>
      </div>
    </div>
  </div>
</template>
