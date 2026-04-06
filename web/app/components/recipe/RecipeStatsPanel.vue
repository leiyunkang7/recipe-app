<script setup lang="ts">
interface Props {
  views: number
  favoritesCount: number
  cookingCount: number
}

const props = withDefaults(defineProps<Props>(), {
  views: 0,
  favoritesCount: 0,
  cookingCount: 0,
})

const { t } = useI18n()

// Format large numbers for display
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}
</script>

<template>
  <div class="bg-white dark:bg-stone-800 rounded-xl shadow-md p-6">
    <h2 class="text-xl font-bold text-gray-900 dark:text-stone-100 mb-4 flex items-center gap-2">
      <svg class="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
      {{ t('recipe.stats.title') }}
    </h2>
    <div class="grid grid-cols-3 gap-3">
      <!-- Views -->
      <div class="text-center p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
        <div class="flex justify-center mb-1">
          <svg class="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
        <p class="text-2xl font-bold text-gray-900 dark:text-stone-100">{{ formatNumber(views) }}</p>
        <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.stats.views') }}</p>
      </div>

      <!-- Favorites -->
      <div class="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-xl">
        <div class="flex justify-center mb-1">
          <svg class="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>
        <p class="text-2xl font-bold text-gray-900 dark:text-stone-100">{{ formatNumber(favoritesCount) }}</p>
        <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.stats.favorites') }}</p>
      </div>

      <!-- Cooking Count -->
      <div class="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-xl">
        <div class="flex justify-center mb-1">
          <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
          </svg>
        </div>
        <p class="text-2xl font-bold text-gray-900 dark:text-stone-100">{{ formatNumber(cookingCount) }}</p>
        <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.stats.cookingCount') }}</p>
      </div>
    </div>
  </div>
</template>
