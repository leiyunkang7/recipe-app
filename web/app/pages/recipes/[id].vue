<script setup lang="ts">
// Lazy load share poster modal - only loads when user clicks share button
const RecipeSharePosterModal = defineAsyncComponent(() => import('~/components/recipe/RecipeSharePosterModal.vue'))
// Lazy load cooking mode - only loads when user enters cooking mode
const CookingMode = defineAsyncComponent(() => import('~/components/recipe/CookingMode.vue'))

const { t } = useI18n()

const {
  recipe,
  loading,
  error,
  isMobile,
  selectedIngredients,
  isFavorite,
  currentStep,
  expandedSteps,
  totalTime,
  nutritionInfo,
  toggleIngredient,
  toggleFavorite,
  toggleStepExpand,
  init,
} = useRecipeDetail()

// Call useRecipeSeo directly in page setup for proper component context
useRecipeSeo(recipe, totalTime)

const showPosterModal = ref(false)
const showCookingMode = ref(false)

// Note: currentStep is a shallowRef, so we use .value when needed for proper reactivity
// Templates auto-unwrap refs, but we need .value for event handler assignments

onMounted(() => {
  init()
})
</script>

<template>
  <div class="min-h-screen bg-stone-50 dark:bg-stone-900 pb-20 lg:pb-8 transition-colors duration-300">
    <RecipeDetailHeader
      :is-favorite="isFavorite"
      :recipe="recipe"
      @toggle-favorite="toggleFavorite"
    />

    <RecipeDetailSkeleton v-if="loading" />

    <ErrorAlert v-else-if="error" :error="error" wrapped />

    <div v-else-if="recipe">
      <!-- Hero - handles responsive internally -->
      <RecipeDetailHero :recipe="recipe" />

      <!-- Mobile Layout -->
      <div class="lg:hidden">
        <RecipeDetailTitleCard
          :recipe="recipe"
          :total-time="totalTime"
          @share="showPosterModal = true"
        />

        <div class="px-4 mt-4">
          <RecipeDetailIngredients
            :recipe="recipe"
            :selected-ingredients="selectedIngredients"
            :is-mobile="true"
            @toggle-ingredient="toggleIngredient"
          />
        </div>

        <div class="px-4 mt-4 mb-6">
          <RecipeDetailSteps
            :recipe="recipe"
            :current-step="currentStep"
            :is-mobile="true"
            :expanded-steps="expandedSteps"
            @update:current-step="(v) => currentStep.value = v"
            @toggle-expand="toggleStepExpand"
          />
        </div>

        <div v-if="recipe.tags?.length" class="px-4 pb-6">
          <RecipeDetailTags :tags="recipe.tags" :is-mobile="true" />
        </div>
      </div>

      <!-- Desktop Layout -->
      <div class="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-8">
            <!-- Start Cooking Button -->
            <button
              v-if="recipe"
              @click="showCookingMode = true"
              class="hidden lg:flex w-full items-center justify-center gap-3 py-4 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-lg shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98]"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
              {{ t('cookingMode.startCooking') }}
            </button>

            <RecipeDetailTitleSection
              :recipe="recipe"
              :total-time="totalTime"
              :nutrition-info="nutritionInfo"
              :is-favorite="isFavorite"
              @toggle-favorite="toggleFavorite"
            />

            <RecipeDetailIngredients
              :recipe="recipe"
              :selected-ingredients="selectedIngredients"
              :is-mobile="false"
              @toggle-ingredient="toggleIngredient"
            />

            <RecipeDetailSteps
              :recipe="recipe"
              :current-step="currentStep"
              :is-mobile="false"
              :expanded-steps="expandedSteps"
              @update:current-step="(v) => currentStep.value = v"
              @toggle-expand="toggleStepExpand"
            />

            <RecipeDetailTags v-if="recipe.tags?.length" :tags="recipe.tags" :is-mobile="false" />
          </div>

          <LazyRecipeDetailSidebar :recipe="recipe" @share="showPosterModal = true" />
        </div>
      </div>
    </div>
  </div>

  <!-- Poster Preview Modal -->
  <RecipeSharePosterModal
    v-if="recipe"
    v-model:show="showPosterModal"
    :recipe="recipe"
  />

  <!-- Cooking Mode Fullscreen -->
  <CookingMode
    v-if="recipe"
    v-model:show="showCookingMode"
    :recipe="recipe"
    :initial-step="currentStep.value"
  />
</template>

<style scoped>
@media (hover: none) {
  .touch-manipulation {
    touch-action: manipulation;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
