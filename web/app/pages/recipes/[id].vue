<script setup lang="ts">
// Lazy load share poster modal - only loads when user clicks share button
const RecipeSharePosterModal = defineAsyncComponent(() => import('~/components/recipe/RecipeSharePosterModal.vue'))
// Lazy load cooking mode - only loads when user enters cooking mode
const CookingMode = defineAsyncComponent(() => import('~/components/recipe/CookingMode.vue'))
// Lazy load step guide - only loads when user clicks step by step guide
const StepGuide = defineAsyncComponent(() => import('~/components/recipe/StepGuide.vue'))

const { t } = useI18n()
const { trackRecipeView } = useAnalytics()

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

// Track recipe view for GA4 funnel analysis
watch(recipe, (newRecipe) => {
  if (newRecipe) {
    trackRecipeView(newRecipe)
  }
}, { immediate: true })

// Reading mode and eye protection mode
const {
  readingMode,
  eyeProtectionMode,
  pageWrapperClasses,
  ingredientContainerClasses,
  stepContainerClasses,
} = useReadingMode()

// Breadcrumb navigation for SEO
const { generateRecipeBreadcrumb } = useBreadcrumb()
const breadcrumbItems = computed(() => generateRecipeBreadcrumb(recipe))
// Call useRecipeSeo directly in page setup for proper component context
useRecipeSeo(recipe, totalTime)

const showPosterModal = ref(false)
const showCookingMode = ref(false)
const showStepGuide = ref(false)

// Recipe stats state
const statsLoading = ref(false)
const statsData = ref({
  views: 0,
  favoritesCount: 0,
  cookingCount: 0,
})

// Fetch recipe stats
const fetchStats = async () => {
  if (!recipe.value?.id) return
  statsLoading.value = true
  try {
    const data = await $fetch(`/api/v1/recipes/${recipe.value.id}/stats`)
    if (data?.data) {
      statsData.value = data.data
    }
  } catch {
    // Use fallback values from recipe
    statsData.value = {
      views: recipe.value.views || 0,
      favoritesCount: 0,
      cookingCount: recipe.value.cookingCount || 0,
    }
  } finally {
    statsLoading.value = false
  }
}

// Watch for recipe changes to fetch stats
watch(recipe, (newRecipe) => {
  if (newRecipe?.id) {
    fetchStats()
  }
}, { immediate: true })

// Note: currentStep is a shallowRef, so we use .value when needed for proper reactivity
// Templates auto-unwrap refs, but we need .value for event handler assignments

onMounted(() => {
  init()
})

// Apply reading mode specific classes
const contentClasses = computed(() => {
  const classes: string[] = []

  if (readingMode.value) {
    classes.push('reading-mode-content')
    if (eyeProtectionMode.value) {
      classes.push('reading-mode-eye-protection')
    }
  }

  return classes.join(' ')
})
</script>

<template>
  <div class="min-h-screen pb-20 lg:pb-8 transition-colors duration-300" :class="pageWrapperClasses">
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

      <!-- Breadcrumb Navigation -->
      <div class="px-4 sm:px-6 lg:px-0 max-w-7xl mx-auto mt-4">
        <Breadcrumb :items="breadcrumbItems" />
      </div>

      <!-- Mobile Layout -->
      <div class="lg:hidden" :class="contentClasses">
        <RecipeDetailTitleCard
          :recipe="recipe"
          :total-time="totalTime"
          @share="showPosterModal = true"
        />

        <div class="px-4 mt-4">
          <RecipeStatsPanel
            :views="statsData.views"
            :favorites-count="statsData.favoritesCount"
            :cooking-count="statsData.cookingCount"
          />
        </div>

        <div class="px-4 mt-4">
          <RecipeDetailIngredients
            :recipe="recipe"
            :selected-ingredients="selectedIngredients"
            :is-mobile="true"
            :reading-mode-classes="ingredientContainerClasses"
            @toggle-ingredient="toggleIngredient"
          />
        </div>

        <div class="px-4 mt-4 mb-6">
          <RecipeDetailSteps
            :recipe="recipe"
            :current-step="currentStep"
            :is-mobile="true"
            :expanded-steps="expandedSteps"
            :reading-mode-classes="stepContainerClasses"
            @update:current-step="(v) => currentStep.value = v"
            @toggle-expand="toggleStepExpand"
          />
        </div>

        <div v-if="recipe.tags?.length" class="px-4 pb-6">
          <RecipeDetailTags :tags="recipe.tags" :is-mobile="true" />
        </div>
      </div>

      <!-- Desktop Layout -->
      <div class="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" :class="contentClasses">
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

            <!-- Step by Step Guide Button -->
            <button
              v-if="recipe"
              @click="showStepGuide = true"
              class="hidden lg:flex w-full items-center justify-center gap-3 py-3 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold text-base shadow-lg shadow-green-500/30 transition-all active:scale-[0.98]"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {{ t('recipe.stepByStepGuide') }}
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
              :reading-mode-classes="ingredientContainerClasses"
              @toggle-ingredient="toggleIngredient"
            />

            <RecipeDetailSteps
              :recipe="recipe"
              :current-step="currentStep"
              :is-mobile="false"
              :expanded-steps="expandedSteps"
              :reading-mode-classes="stepContainerClasses"
              @update:current-step="(v) => currentStep.value = v"
              @toggle-expand="toggleStepExpand"
            />

            <RecipeDetailTags v-if="recipe.tags?.length" :tags="recipe.tags" :is-mobile="false" />
          </div>

          <LazyRecipeDetailSidebar :recipe="recipe" @share="showPosterModal = true" />
        </div>
      </div>
    </div>

    <!-- Reading Mode Toggle -->
    <ReadingModeToggle />
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

  <!-- Step-by-Step Guide Modal -->
  <StepGuide
    v-if="recipe"
    v-model:show="showStepGuide"
    :recipe="recipe"
    :initial-step="currentStep.value"
    :reading-mode-classes="stepContainerClasses"
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

/* Reading Mode Styles */
:global(.reading-mode-content) {
  font-size: 1.125rem;
  line-height: 1.8;
}

:global(.reading-mode-content .text-lg) {
  font-size: 1.25rem !important;
}

:global(.reading-mode-content .text-xl) {
  font-size: 1.375rem !important;
}

:global(.reading-mode-content .text-2xl) {
  font-size: 1.5rem !important;
}

:global(.reading-mode-item) {
  border-radius: 0.75rem !important;
  padding: 1rem !important;
  margin-bottom: 0.5rem !important;
}

:global(.reading-mode-step) {
  border-radius: 0.75rem !important;
  padding: 1.25rem !important;
  margin-bottom: 0.75rem !important;
}

/* Eye Protection Mode - Warm sepia tones */
:global(.reading-mode-eye-protection) {
  background-color: #fef3e2 !important;
}

:global(.reading-mode-eye-protection .bg-white) {
  background-color: #fff8f0 !important;
}

:global(html.dark .reading-mode-eye-protection) {
  background-color: #451a03 !important;
}

:global(html.dark .reading-mode-eye-protection .bg-stone-800) {
  background-color: #78350f !important;
}

:global(html.dark .reading-mode-eye-protection .bg-stone-900) {
  background-color: #451a03 !important;
}
</style>
