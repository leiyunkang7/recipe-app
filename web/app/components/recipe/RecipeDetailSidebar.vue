<script setup lang="ts">
import type { Recipe } from '~/types'

const props = defineProps<{
  recipe: Recipe
}>()

const emit = defineEmits<{
  share: []
}>()

const { t } = useI18n()
</script>

<template>
  <!-- Sidebar - Desktop Only -->
  <div class="space-y-6">
    <!-- Share Poster Card -->
    <div class="bg-gradient-to-br from-orange-500 to-amber-400 rounded-xl shadow-md p-6 text-white">
      <h2 class="text-xl font-bold mb-3 flex items-center gap-2">
        📤 {{ t('recipe.sharePoster') || '分享海报' }}
      </h2>
      <p class="text-white/80 text-sm mb-4">
        生成分享图片，分享到社交媒体，让更多朋友看到这道美味！
      </p>
      <button
        @click="emit('share')"
        class="w-full bg-white text-orange-600 font-bold py-3 px-4 rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
      >
        <span class="text-xl">🖼️</span>
        <span>生成并下载海报</span>
      </button>
    </div>

    <!-- Nutrition Info Card -->
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

    <!-- Quick Info Card -->
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
</template>
