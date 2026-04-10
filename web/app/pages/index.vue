<script setup lang="ts">
const { t, locale } = useI18n()
const { trackPageView } = useAnalytics()

const ogImageAbsolute = computed(() => `${baseUrl}/icon.png`)

useSeoMeta({
  title: () => `${t('app.title')} - ${t('app.subtitle')}`,
  ogTitle: () => `${t('app.title')} - ${t('app.subtitle')}`,
  description: () => t('app.subtitle'),
  ogDescription: () => t('app.subtitle'),
  ogType: 'website',
  ogSiteName: () => t('app.ogSiteName'),
  ogUrl: `${baseUrl}/${locale.value}`,
  ogImage: ogImageAbsolute,
  ogImageWidth: '1200',
  ogImageHeight: '630',
  ogImageAlt: () => t('app.ogImageAlt'),
  ogLocale: locale.value === 'en' ? 'en_US' : 'zh_CN',
  ogLocaleAlternate: locale.value === 'en' ? 'zh-CN' : 'en-US',
  twitterCard: 'summary_large_image',
  twitterSite: '@recipeapp',
  twitterTitle: () => `${t('app.title')} - ${t('app.subtitle')}`,
  twitterDescription: () => t('app.subtitle'),
  twitterImage: ogImageAbsolute,
  twitterImageAlt: () => t('app.twitterImageAlt'),
})

useHead(() => ({
  link: [
    { rel: 'canonical', href: `${baseUrl}/${locale.value}` },
    { rel: 'alternate', hreflang: 'zh-CN', href: `${baseUrl}/zh-CN` },
    { rel: 'alternate', hreflang: 'en', href: `${baseUrl}/en` },
    { rel: 'alternate', hreflang: 'x-default', href: baseUrl }
  ],
  script: [
    {
      type: 'application/ld+json',
      children: () => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: t('schema.siteName'),
        url: baseUrl,
        description: t('app.subtitle'),
        inLanguage: locale.value === 'en' ? 'en-US' : locale.value === 'ja' ? 'ja-JP' : 'zh-CN',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/${locale.value}/recipes?search={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        },
        publisher: {
          '@type': 'Organization',
          name: t('schema.siteName'),
          url: baseUrl,
          logo: {
            '@type': 'ImageObject',
            url: `${baseUrl}/icon.png`
          }
        }
      })
    }
  ]
}))

const {
  recipes,
  loading,
  loadingMore,
  error,
  hasMore,
  searchQuery,
  selectedCategory,
  categories,
  debouncedSearch,
  loadMore,
  init,
  handleClearSearch,
  handleClearCategory,
  // Advanced filters
  selectedIngredients,
  maxTime,
  minTime,
  selectedTaste,
  selectedDifficulty,
  selectedCuisine,
  cuisines,
  selectedMinRating,
  nutritionRange,
  selectedSortBy,
  handleClearAdvancedFilters,
} = useHomePage()


// AI Recipe Generation
const { isIdentifying, isGenerating, identifiedDish, generatedRecipe, capturedImageUrl, error: aiError, identifyAndGenerate, reset: resetAI, saveRecipe } = useAIGeneratedRecipe()

const showCamera = ref(false)
const showAIRecipe = ref(false)
const aiRecipeResult = ref<{ identifiedDish: unknown; recipe: unknown; imageDataUrl?: string } | null>(null)

const handleOpenCamera = () => {
  showCamera.value = true
}

const handleCloseCamera = () => {
  showCamera.value = false
}

const handleImageCaptured = async (dataUrl: string, base64: string) => {
  showCamera.value = false
  
  // Identify dish and generate recipe
  const result = await identifyAndGenerate(base64, dataUrl)
  if (result) {
    aiRecipeResult.value = result
    showAIRecipe.value = true
  }
}

const handleRecipeSaved = (recipeId: string) => {
  showAIRecipe.value = false
  resetAI()
  aiRecipeResult.value = null
  // Navigate to the saved recipe
  const localePath = useLocalePath()
  navigateTo(localePath(`/recipes/${recipeId}`))
}

const handleCloseAIRecipe = () => {
  showAIRecipe.value = false
  resetAI()
  aiRecipeResult.value = null
}

// Search correction (did-you-mean)
const { fetchSuggestion, currentSuggestion, clearCorrection } = useSearchCorrection()
const searchSuggestion = ref<string | null>(null)

// Watch for search query and results to fetch corrections when no results
watch([searchQuery, recipes], async ([newQuery, newRecipes]) => {
  if (!newQuery || newQuery.trim().length < 3) {
    searchSuggestion.value = null
    return
  }
  // Only fetch suggestion when loading completes and results are empty
  if (!loading.value && newRecipes && newRecipes.length === 0) {
    const result = await fetchSuggestion(newQuery.trim())
    searchSuggestion.value = result.hasSuggestion ? result.suggestion : null
  } else if (newRecipes && newRecipes.length > 0) {
    // Clear suggestion when we have results
    searchSuggestion.value = null
    clearCorrection()
  }
}, { immediate: false })

// Show/hide advanced filters
const showAdvancedFilters = ref(false)

const handleApplyFilters = () => {
  const { trackFilter } = useAnalytics()
  if (selectedCategory.value) {
    trackFilter('category', selectedCategory.value)
  }
  if (selectedCuisine.value) {
    trackFilter('cuisine', selectedCuisine.value)
  }
  if (selectedDifficulty.value) {
    trackFilter('difficulty', selectedDifficulty.value)
  }
  if (selectedIngredients.value.length > 0) {
    trackFilter('ingredients', selectedIngredients.value.join(','))
  }
  if (selectedMinRating.value) {
    trackFilter('minRating', String(selectedMinRating.value))
  }
  debouncedSearch()
}

const handleApplySuggestion = () => {
  if (searchSuggestion.value) {
    searchQuery.value = searchSuggestion.value
    searchSuggestion.value = null
    debouncedSearch()
  }
}

const handleClearSuggestion = () => {
  searchSuggestion.value = null
  clearCorrection()
}


// Watch filter changes to trigger search
watch([selectedCategory, selectedDifficulty, maxTime], () => {
  debouncedSearch()
})
onMounted(() => {
  init()
  trackPageView('homepage')
})
</script>

<template>
  <div class="min-h-screen pb-16 md:pb-0 bg-gradient-to-br from-orange-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300">
    <HeroSection
      v-model:searchQuery="searchQuery"
      @search="debouncedSearch"
    />
    <!-- AI Camera Capture Button -->
    <button
      type="button"
      class="fixed bottom-24 right-4 md:right-8 z-40 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
      :title="t('camera.button')"
      @click="handleOpenCamera"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
      </svg>
    </button>

    <!-- Camera Capture Modal -->
    <CameraCapture
      v-if="showCamera"
      @captured="handleImageCaptured"
      @close="handleCloseCamera"
    />

    <!-- AI Loading Overlay -->
    <div v-if="isIdentifying || isGenerating" class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center">
      <div class="bg-white dark:bg-stone-800 rounded-2xl p-8 max-w-sm mx-4 text-center space-y-4">
        <div class="w-16 h-16 mx-auto border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin"></div>
        <div>
          <p class="text-lg font-semibold text-stone-900 dark:text-white">
            {{ isIdentifying ? t('camera.identifying') : t('camera.generating') }}
          </p>
          <p class="text-sm text-stone-500 dark:text-stone-400 mt-1">
            {{ isIdentifying ? t('camera.identifyingHint') : t('camera.generatingHint') }}
          </p>
        </div>
      </div>
    </div>

    <!-- AI Error Toast -->
    <div v-if="aiError" class="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg">
      {{ aiError }}
    </div>

    <!-- AI Generated Recipe Preview -->
    <AIGeneratedRecipe
      v-if="showAIRecipe && aiRecipeResult"
      :identified-dish="aiRecipeResult.identifiedDish"
      :recipe="aiRecipeResult.recipe"
      :image-data-url="aiRecipeResult.imageDataUrl"
      @close="handleCloseAIRecipe"
      @saved="handleRecipeSaved"
    />


    <main id="main-content" tabindex="-1">
      <HeaderSection
        v-model:selectedCategory="selectedCategory"
        v-model:categories="categories"
      />

      <!-- Recipe Filters Bar -->
      <div class="max-w-7xl mx-auto px-4 py-3">
        <RecipeFilters
          v-model:selectedCategory="selectedCategory"
          v-model:selectedDifficulty="selectedDifficulty"
          v-model:maxTime="maxTime"
          :categories="categories"
        />
      </div>

      <!-- Advanced Filters Toggle -->
      <div class="max-w-7xl mx-auto px-4 py-3">
        <button
          type="button"
          class="flex items-center gap-2 text-sm text-gray-600 dark:text-stone-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
          @click="showAdvancedFilters = !showAdvancedFilters"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3.263 3.946a9 9 0 010 12.727l.707.707 1.414-1.414-.707-.707a7 7 0 110-9.899l-.707-.707-1.414 1.414.707.707zm10.606-8.898a9 9 0 010 12.727 7 7 0 110 9.9l.707.707 1.414-1.414-.707-.707a9 9 0 010-12.727l-.707-.707-1.414 1.414.707.707z" clip-rule="evenodd" />
          </svg>
          {{ t('filter.advancedSearch') }}
          <svg
            :class="['h-4 w-4 transition-transform', showAdvancedFilters ? 'rotate-180' : '']"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>

        <!-- Advanced Filters Panel -->
        <div v-if="showAdvancedFilters" class="mt-4">
          <AdvancedSearchFilters
            :ingredients="selectedIngredients"
            :max-time="maxTime"
            :min-time="minTime"
            :taste="selectedTaste"
            :difficulty="selectedDifficulty"
            :cuisine="selectedCuisine"
            :cuisine-keys="cuisines"
            :min-rating="selectedMinRating"
            :nutrition-range="nutritionRange"
            @update:ingredients="selectedIngredients = $event"
            @update:max-time="maxTime = $event"
            @update:min-time="minTime = $event"
            @update:taste="selectedTaste = $event"
            @update:difficulty="selectedDifficulty = $event"
            @update:cuisine="selectedCuisine = $event"
            @update:min-rating="selectedMinRating = $event"
            @update:nutrition-range="nutritionRange = $event"
            @apply="handleApplyFilters"
            @clear="handleClearAdvancedFilters"
          />
        </div>
      </div>

      <!-- Did You Mean Suggestion -->
      <div v-if="searchSuggestion" class="max-w-7xl mx-auto px-4 py-3">
        <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-stone-400">
          <span>{{ t('search.didYouMean') }}</span>
          <button
            type="button"
            class="text-orange-600 dark:text-orange-400 hover:underline font-medium"
            @click="handleApplySuggestion"
          >
            "{{ searchSuggestion }}"
          </button>
          <button
            type="button"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-stone-300"
            @click="handleClearSuggestion"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <RecipeListSection
        :recipes="recipes"
        :loading="loading"
        :loading-more="loadingMore"
        :error="error"
        :has-more="hasMore"
        :search-query="searchQuery"
        :selected-category="selectedCategory"
        @search="debouncedSearch"
        @load-more="loadMore"
        @retry="init"
        @clear-search="handleClearSearch"
        @clear-category="handleClearCategory"
      />
    </main>

    <LazyFooterSection />

    <LazyBottomNav />
  </div>
</template>
