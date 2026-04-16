<script setup lang="ts">
import { useRecipeDetail } from '~/composables/useRecipeDetail'
import { useDifficulty } from '~/composables/useDifficulty'
import RecipeActionsSheet from '~/components/recipe/RecipeActionsSheet.vue'
import RecipeReviews from '~/components/RecipeReviews.vue'
import type { Recipe } from '~/types'

const { t } = useI18n()
const localePath = useLocalePath()
const { difficultyColor, difficultyLabel } = useDifficulty()

const {
  recipe,
  loading,
  error,
  isMobile,
  currentStep,
  selectedIngredients,
  isFavorite,
  totalTime,
  toggleFavorite,
  toggleIngredient,
  init,
} = useRecipeDetail()

const showCookingMode = ref(false)
const showActionsSheet = ref(false)
const scaledServings = ref(0)

watch(() => recipe.value?.servings, (servings) => {
  if (servings) {
    scaledServings.value = servings
  }
}, { immediate: true })

const startCooking = () => {
  showCookingMode.value = true
}

const scaledIngredients = computed(() => {
  if (!recipe.value?.ingredients || scaledServings.value <= 0) return []
  const originalServings = recipe.value.servings
  const scale = scaledServings.value / originalServings
  return recipe.value.ingredients.map((ing: any) => ({
    ...ing,
    amount: typeof ing.amount === 'number' ? Math.round(ing.amount * scale * 10) / 10 : ing.amount,
    originalAmount: ing.amount,
  }))
})

// Bottom Sheet 事件处理
const handleScaleServings = (servings: number) => {
  scaledServings.value = servings
}

const handleAddToFavorites = () => {
  toggleFavorite()
}

const handleShareRecipe = () => {
  if (navigator.share && recipe.value) {
    navigator.share({
      title: recipe.value.title,
      text: recipe.value.description,
      url: window.location.href,
    })
  }
}

const handlePrintRecipe = () => {
  // Set print date on the page root for printing
  const page = document.querySelector('.recipe-detail-page')
  if (page) {
    const now = new Date()
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    page.setAttribute('data-print-date', dateStr)
  }
  window.print()
}

// SEO
useSeoMeta({
  title: () => recipe.value?.title ?? t('recipe.title'),
  description: () => recipe.value?.description ?? '',
})

// Initialize
onMounted(() => {
  init()
})
</script>

<template>
  <div class="min-h-screen bg-stone-50 dark:bg-stone-900 recipe-detail-page">
    <RecipeDetailHeader
      :is-favorite="isFavorite"
      :recipe="recipe"
      @toggle-favorite="toggleFavorite"
    />

    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <RecipeDetailSkeleton />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RecipeErrorState :error="error" @retry="init" />
    </div>

    <!-- Recipe content -->
    <div v-else-if="recipe" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Main content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Hero card -->
          <div class="bg-white dark:bg-stone-800 rounded-2xl shadow-sm overflow-hidden">
            <div class="relative h-64 md:h-96 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/20 dark:to-orange-800/20">
              <img
                v-if="recipe.imageUrl"
                :src="recipe.imageUrl"
                :alt="recipe.title"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="text-8xl md:text-9xl">🍽️</span>
              </div>

              <!-- Difficulty badge - memoized -->
              <div v-memo="[recipe.difficulty]" class="absolute top-4 right-4">
                <span
                  :class="[
                    'px-3 py-1.5 rounded-full text-sm font-semibold uppercase shadow-sm',
                    difficultyColor(recipe.difficulty)
                  ]"
                >
                  {{ difficultyLabel(recipe.difficulty) }}
                </span>
              </div>
            </div>

            <!-- Title section -->
            <div class="p-6">
              <h1 class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-stone-100 mb-3">
                {{ recipe.title }}
              </h1>
              <p v-if="recipe.description" class="text-gray-600 dark:text-stone-400 leading-relaxed">
                {{ recipe.description }}
              </p>

              <!-- Quick stats - memoized to avoid re-render when only user interaction state changes -->
              <div v-memo="[recipe.title, recipe.prepTimeMinutes, recipe.cookTimeMinutes, recipe.servings]" class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                <div class="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                  <p class="text-xl mb-1">⏱️</p>
                  <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.totalTime') }}</p>
                  <p class="font-semibold text-gray-900 dark:text-stone-100">{{ totalTime }} {{ t('recipe.min') }}</p>
                </div>
                <div class="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <p class="text-xl mb-1">👥</p>
                  <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.servings') }}</p>
                  <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.servings }}</p>
                </div>
                <div class="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <p class="text-xl mb-1">🥬</p>
                  <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.prep') }}</p>
                  <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.prepTimeMinutes }} {{ t('recipe.min') }}</p>
                </div>
                <div class="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <p class="text-xl mb-1">🍳</p>
                  <p class="text-xs text-gray-600 dark:text-stone-400">{{ t('recipe.cook') }}</p>
                  <p class="font-semibold text-gray-900 dark:text-stone-100">{{ recipe.cookTimeMinutes }} {{ t('recipe.min') }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Start cooking button (prominent CTA) -->
          <button
            @click="startCooking"
            class="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-200 flex items-center justify-center gap-3"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{{ t('cookingMode.startCooking') }}</span>
            <span class="text-sm opacity-80">({{ recipe.steps.length }} {{ t('recipe.steps') }})</span>
          </button>

          <!-- Print button -->
          <button
            @click="handlePrintRecipe"
            class="print-btn w-full bg-stone-100 hover:bg-stone-200 dark:bg-stone-700 dark:hover:bg-stone-600 text-gray-700 dark:text-stone-200 font-semibold py-3 px-6 rounded-xl border border-stone-300 dark:border-stone-600 transition-all duration-200 flex items-center justify-center gap-3"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>{{ t('recipe.print') || '🖨️ 打印食谱' }}</span>
          </button>

          <!-- Ingredients -->
          <RecipeDetailIngredients
            :recipe="recipe"
            :selected-ingredients="selectedIngredients"
            :is-mobile="isMobile"
            @toggle-ingredient="toggleIngredient"
          />

          <!-- Steps accordion -->
          <StepAccordion
            :recipe="recipe"
            :current-step="currentStep"
            :is-mobile="isMobile"
            @update:currentStep="(i) => currentStep = i"
          />

          <!-- Tags - memoized to avoid re-render when tags haven't changed -->
          <div v-if="recipe.tags && recipe.tags.length > 0" v-memo="[recipe.tags]" class="bg-white dark:bg-stone-800 rounded-2xl shadow-sm p-6">
            <h2 class="text-lg font-bold text-gray-900 dark:text-stone-100 mb-4 flex items-center gap-2">
              🏷️ {{ t('recipe.tags') }}
            </h2>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="tag in recipe.tags"
                :key="tag"
                class="px-3 py-1.5 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors cursor-pointer"
              >
                #{{ tag }}
              </span>
            </div>
          </div>

          <!-- Reviews Section -->
          <div class="bg-white dark:bg-stone-800 rounded-2xl shadow-sm p-6">
            <RecipeReviews :recipe-id="recipe.id" />
          </div>
        </div>

        <!-- Sidebar -->
        <RecipeDetailSidebar
          :recipe="recipe"
          @share="handleShareRecipe"
        />
      </div>
    </div>

    <!-- Mobile floating action button (opens Bottom Sheet) -->
    <button
      v-if="isMobile && !loading && recipe"
      @click="showActionsSheet = true"
      class="fixed bottom-24 right-6 z-40 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center transition-all duration-200 active:scale-95"
      aria-label="打开操作菜单"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <!-- Cooking Mode -->
    <CookingMode
      v-model:show="showCookingMode"
      :recipe="recipe"
      :initial-step="currentStep"
    />

    <!-- Actions Bottom Sheet (mobile) -->
    <RecipeActionsSheet
      :visible="showActionsSheet"
      :recipe="recipe ? {
        id: recipe.id,
        title: recipe.title,
        servings: scaledServings,
        isFavorite: isFavorite,
      } : null"
      @close="showActionsSheet = false"
      @start-cooking="startCooking"
      @add-to-favorites="handleAddToFavorites"
      @remove-from-favorites="handleAddToFavorites"
      @share-recipe="handleShareRecipe"
      @scale-servings="handleScaleServings"
    />
  </div>
</template>
