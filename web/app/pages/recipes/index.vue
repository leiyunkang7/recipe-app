<script setup lang="ts">
/**
 * Recipes Index Page - 食谱列表页
 *
 * 显示所有食谱，支持搜索和分类筛选
 * 多维度筛选：分类、难度、时间、口味、食材、营养等
 */
const { t } = useI18n()
const localePath = useLocalePath()
const { trackPageView } = useAnalytics()

useHead({
  title: () => `${t('nav.recipes')} - ${t('app.title')}`,
  script: [
    {
      type: 'application/ld+json',
      children: () => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: t('nav.recipes'),
        description: t('app.subtitle'),
        inLanguage: locale.value === 'en' ? 'en-US' : 'zh-CN',
        itemListElement: recipesList.slice(0, 20).map((recipe, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${baseUrl}/${locale.value}/recipes/${recipe.id}`,
          name: recipe.title
        }))
      })
    }
  ]
})

const {
  recipesList,
  loading,
  loadingMore,
  error,
  hasMore,
  searchQuery,
  selectedCategory,
  categories,
  cuisines,
  debouncedSearch,
  loadMore,
  init,
  handleClearSearch,
  handleClearCategory,
  handleClearAdvancedFilters,
  selectedDifficulty,
  maxTime,
  // Advanced filters
  selectedIngredients,
  minTime,
  selectedTaste,
  selectedCuisine,
  selectedMinRating,
  nutritionRange,
} = useHomePage()

// Show/hide advanced filters panel
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

// Watch filter changes to trigger search
watch([selectedCategory, selectedDifficulty, maxTime], () => {
  debouncedSearch()
})

onMounted(() => {
  init()
  trackPageView('recipes')
})
</script>

<template>
  <div class="min-h-screen pb-16 md:pb-0 bg-gradient-to-br from-orange-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900">
    <header class="bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-stone-700 sticky top-0 z-10">
      <div class="max-w-7xl mx-auto px-4 py-4">
        <h1 class="text-2xl font-bold text-stone-900 dark:text-white mb-4">
          {{ t('nav.recipes') }}
        </h1>

        <!-- Search -->
        <div class="relative">
          <label for="recipes-search-input" class="sr-only">{{ t('search.placeholder') }}</label>
          <input
            id="recipes-search-input"
            v-model="searchQuery"
            type="search"
            :placeholder="t('search.placeholder')"
            class="w-full px-4 py-3 pl-12 bg-gray-100 dark:bg-stone-700 rounded-xl border-0 focus:ring-2 focus:ring-orange-500 dark:text-white dark:placeholder-stone-400 transition-all"
            @input="debouncedSearch"
          />
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- Recipe Filters -->
      <div class="mb-4">
        <RecipeFilters
          v-model:selectedCategory="selectedCategory"
          v-model:selectedDifficulty="selectedDifficulty"
          v-model:maxTime="maxTime"
          :categories="categories"
        />
      </div>

      <!-- Advanced Filters Toggle -->
      <div class="mb-4">
        <button
          type="button"
          class="flex items-center gap-2 text-sm text-gray-600 dark:text-stone-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors"
          :aria-expanded="showAdvancedFilters"
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

      <!-- Recipe List -->
      <RecipeListSection
        :recipes="recipesList"
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

    <LazyBottomNav />
  </div>
</template>
