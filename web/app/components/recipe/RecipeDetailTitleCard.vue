<script setup lang="ts">
import type { Recipe } from '~/types'

const props = defineProps<{
  recipe: Recipe
  totalTime: number
  difficultyColor: (difficulty: string) => string
  difficultyLabel: (difficulty: string) => string
}>()

const emit = defineEmits<{
  share: []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="px-4 -mt-6 relative">
    <div class="bg-white dark:bg-stone-800 rounded-t-3xl shadow-lg p-5">
      <div class="flex items-start justify-between gap-2 mb-3">
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-stone-100 leading-tight flex-1 min-w-0">
          {{ recipe.title }}
        </h1>
        <span :class="['px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-semibold uppercase shrink-0', difficultyColor(recipe.difficulty)]">
          {{ difficultyLabel(recipe.difficulty) }}
        </span>
      </div>
      
      <p v-if="recipe.description" class="text-gray-600 dark:text-stone-400 text-sm mb-4 line-clamp-2">
        {{ recipe.description }}
      </p>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-4">
        <div class="text-center p-1.5 sm:p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
          <p class="text-base sm:text-lg mb-0.5">⏱️</p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.totalTime') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100 text-xs sm:text-sm">{{ totalTime }}{{ t('recipe.min') }}</p>
        </div>
        <div class="text-center p-1.5 sm:p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
          <p class="text-base sm:text-lg mb-0.5">👥</p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.servings') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100 text-xs sm:text-sm">{{ recipe.servings }}</p>
        </div>
        <div class="text-center p-1.5 sm:p-2 bg-green-50 dark:bg-green-900/30 rounded-xl">
          <p class="text-base sm:text-lg mb-0.5">🥬</p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.prep') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100 text-xs sm:text-sm">{{ recipe.prepTimeMinutes }}{{ t('recipe.min') }}</p>
        </div>
        <div class="text-center p-1.5 sm:p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
          <p class="text-base sm:text-lg mb-0.5">🍳</p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.cook') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100 text-xs sm:text-sm">{{ recipe.cookTimeMinutes }}{{ t('recipe.min') }}</p>
        </div>
      </div>

      <!-- Share Menu -->
      <div class="mb-3">
        <RecipeShareMenu :recipe="recipe" />
      </div>

      <!-- Share Poster Button -->
      <button
        @click="emit('share')"
        class="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold py-3 px-4 rounded-xl hover:from-orange-600 hover:to-amber-600 transition-colors flex items-center justify-center gap-2 shadow-md"
      >
        <span class="text-xl">🖼️</span>
        <span>{{ t('recipe.sharePoster') || '分享海报' }}</span>
      </button>
    </div>
  </div>
</template>
