<script setup lang="ts">
// Lazy load share poster modal - only loads when user clicks share button
const RecipeSharePosterModal = defineAsyncComponent(() => import('~/components/recipe/RecipeSharePosterModal.vue'))

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
  difficultyColor,
  difficultyLabel,
  toggleIngredient,
  toggleFavorite,
  toggleStepExpand,
  init,
  cleanup,
} = useRecipeDetail()

// Call useRecipeSeo directly in page setup for proper component context
useRecipeSeo(recipe, totalTime)

const showPosterModal = ref(false)

onMounted(() => {
  init()
})

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <div class="min-h-screen bg-stone-50 dark:bg-stone-900 pb-20 lg:pb-8 transition-colors duration-300">
    <RecipeDetailHeader
      :is-favorite="isFavorite"
      :recipe="recipe"
      @toggle-favorite="toggleFavorite"
      @share="showPosterModal = true"
    />

    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>

    <div v-else-if="error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-300">{{ error }}</p>
      </div>
    </div>

    <div v-else-if="recipe">
      <div class="lg:hidden">
        <RecipeDetailHero :recipe="recipe" />
        <RecipeDetailTitleCard
          :recipe="recipe"
          :total-time="totalTime"
          :difficulty-color="difficultyColor"
          :difficulty-label="difficultyLabel"
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
            @update:current-step="currentStep = $event"
            @toggle-expand="toggleStepExpand"
          />
        </div>

        <div v-if="recipe.tags?.length" class="px-4 pb-6">
          <RecipeDetailTags :tags="recipe.tags" :is-mobile="true" />
        </div>
      </div>

      <div class="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-8">
            <RecipeDetailHero :recipe="recipe" />
            <RecipeDetailTitleSection
              :recipe="recipe"
              :total-time="totalTime"
              :nutrition-info="nutritionInfo"
              :difficulty-color="difficultyColor"
              :difficulty-label="difficultyLabel"
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
              @update:current-step="currentStep = $event"
              @toggle-expand="toggleStepExpand"
            />

            <RecipeDetailTags v-if="recipe.tags?.length" :tags="recipe.tags" :is-mobile="false" />
          </div>

          <RecipeDetailSidebar :recipe="recipe" @share="showPosterModal = true" />
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
</template>

<style scoped>
html {
  scroll-behavior: smooth;
}

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
