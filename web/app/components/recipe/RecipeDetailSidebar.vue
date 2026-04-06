<script setup lang="ts">
import type { Recipe } from '~/types'

const props = defineProps<{
  recipe: Recipe
}>()

const emit = defineEmits<{
  share: []
}>()

const { t } = useI18n()

// Consolidate nutrition flags into single computed object to reduce overhead
const nutrition = computed(() => {
  const info = props.recipe.nutritionInfo
  return {
    hasInfo: !!info,
    hasCalories: !!info?.calories,
    hasProtein: !!info?.protein,
    hasCarbs: !!info?.carbs,
    hasFat: !!info?.fat,
    hasFiber: !!info?.fiber,
  }
})

// Recipe stats state
const statsLoading = ref(false)
const statsData = ref({
  views: 0,
  favoritesCount: 0,
  cookingCount: 0,
})

// Fetch recipe stats
const fetchStats = async () => {
  if (!props.recipe?.id) return
  statsLoading.value = true
  try {
    const data = await $fetch(`/api/v1/recipes/${props.recipe.id}/stats`)
    if (data?.data) {
      statsData.value = data.data
    }
  } catch {
    // Use fallback values from recipe
    statsData.value = {
      views: props.recipe.views || 0,
      favoritesCount: 0,
      cookingCount: props.recipe.cookingCount || 0,
    }
  } finally {
    statsLoading.value = false
  }
}

// Watch for recipe changes to fetch stats
watch(() => props.recipe?.id, (newId) => {
  if (newId) {
    fetchStats()
  }
}, { immediate: true })
</script>

<template>
  <!-- Sidebar - Desktop Only -->
  <div class="space-y-6">
    <!-- Share Menu Card -->
    <div class="bg-white dark:bg-stone-800 rounded-xl shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-stone-100 mb-3 flex items-center gap-2">
        <ShareIcon class="w-5 h-5 text-orange-500" /> {{ t('recipe.share') }}
      </h2>
      <p class="text-gray-600 dark:text-stone-400 text-sm mb-4">
        {{ t('recipe.shareTip') }}
      </p>
      <div class="mb-4">
        <LazyRecipeShareMenu :recipe="recipe" />
      </div>
      <button
        @click="emit('share')"
        class="w-full bg-gradient-to-r from-orange-500 to-amber-400 text-white font-bold py-3 px-4 rounded-lg hover:from-orange-600 hover:to-amber-500 transition-colors flex items-center justify-center gap-2"
      >
        <ImageIcon class="w-5 h-5" />
        <span>{{ t('recipe.sharePoster') }}</span>
      </button>
    </div>

    <!-- Stats Panel Card -->
    <RecipeStatsPanel
      :views="statsData.views"
      :favorites-count="statsData.favoritesCount"
      :cooking-count="statsData.cookingCount"
    />

    <!-- Nutrition Info Card -->
    <div v-if="nutrition.hasInfo" class="bg-white dark:bg-stone-800 rounded-xl shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-900 dark:text-stone-100 mb-4 flex items-center gap-2">
        <NutritionIcon class="w-5 h-5 text-green-500" /> {{ t('recipe.nutritionInfo') }}
      </h2>
      <div class="grid grid-cols-2 gap-4">
        <div v-if="nutrition.hasCalories" class="text-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg">
          <p class="text-orange-500 mb-1 flex justify-center"><FireIcon class="w-6 h-6" /></p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.calories') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.nutritionInfo!.calories }}</p>
        </div>
        <div v-if="nutrition.hasProtein" class="text-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <p class="text-blue-500 mb-1 flex justify-center"><ProteinIcon class="w-6 h-6" /></p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.protein') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.nutritionInfo!.protein }}g</p>
        </div>
        <div v-if="nutrition.hasCarbs" class="text-center p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg">
          <p class="text-yellow-600 mb-1 flex justify-center"><CarbsIcon class="w-6 h-6" /></p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.carbs') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.nutritionInfo!.carbs }}g</p>
        </div>
        <div v-if="nutrition.hasFat" class="text-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
          <p class="text-purple-500 mb-1 flex justify-center"><FatIcon class="w-6 h-6" /></p>
          <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.fat') }}</p>
          <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.nutritionInfo!.fat }}g</p>
        </div>
        <div v-if="nutrition.hasFiber" class="text-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg col-span-2">
          <p class="text-green-600 mb-1 flex justify-center"><FiberIcon class="w-6 h-6" /></p>
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
