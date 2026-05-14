<script setup lang="ts">
/**
 * Recipes Index Page - 食谱列表页
 *
 * 显示所有食谱，支持多维度筛选和 URL 参数同步（可分享链接）
 * 筛选维度：分类、菜系、口味、难度、时间、食材、营养、排序
 */
const { t, locale } = useI18n()
const localePath = useLocalePath()
const { trackPageView, trackFilter } = useAnalytics()

// Memoized JSON-LD structured data to avoid recalculating on every render
const jsonLd = computed(() => {
  const recipesSlice = recipes.value?.slice(0, 20) ?? []
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: t('nav.recipes'),
    description: t('app.subtitle'),
    inLanguage: locale.value === 'en' ? 'en-US' : 'zh-CN',
    itemListElement: recipesSlice.map((recipe, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${localePath(`/recipes/${recipe.id}`)}`,
      name: recipe.title,
    })),
  })
})

useHead({
  title: () => `${t('nav.recipes')} - ${t('app.title')}`,
  script: [
    {
      type: 'application/ld+json',
      children: jsonLd,
    },
  ],
})

// ─── URL-synced filter state ───────────────────────────────────────────────
const {
  search,
  category,
  cuisine,
  difficulty,
  maxTime,
  minTime,
  ingredients,
  taste,
  sort,
  minRating,
  nutritionRange,
  hasActiveFilters,
  activeFilterCount,
  setSort,
  setCategory,
  setCuisine,
  setDifficulty,
  setMaxTime,
  setMinTime,
  setIngredients,
  setTaste,
  setMinRating,
  setNutritionRange,
  setSearch,
  clearAll,
  buildApiFilters,
} = useRecipeFilters()

// ─── Recipe data ────────────────────────────────────────────────────────────
const { recipes, loading, error, fetchRecipes, fetchCategories, fetchCuisines } = useRecipes()

const loadingMore = ref(false)
const hasMore = ref(true)

const categories = ref<Array<{ id: string; name: string; displayName: string }>>([])
const cuisines = ref<Array<{ id: string; name: string; displayName: string }>>([])
const initStatus = ref<'idle' | 'initializing' | 'ready'>('idle')

// Debounced search - useDebounceFn only available client-side
const debouncedFetch = process.client
  ? useDebounceFn(async () => {
      await fetchRecipes(buildApiFilters())
    }, 300, { maxWait: 500 })
  : async () => { await fetchRecipes(buildApiFilters()) }

const debouncedSearch = async () => {
  await debouncedFetch()
}

// Debounced search input handler using useDebounceFn for consistency
const debouncedSearchInput = process.client
  ? useDebounceFn(async (val: string) => {
      setSearch(val)
      await fetchRecipes(buildApiFilters())
    }, 300, { maxWait: 500 })
  : async (val: string) => { setSearch(val); await fetchRecipes(buildApiFilters()) }

const handleSearchInput = (val: string) => {
  debouncedSearchInput(val)
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  loadingMore.value = true
  try {
    await fetchRecipes(buildApiFilters())
  } finally {
    loadingMore.value = false
  }
}

const init = async () => {
  if (initStatus.value !== 'idle') return
  initStatus.value = 'initializing'
  try {
    const [, fetchedCategories, fetchedCuisines] = await Promise.all([
      fetchRecipes(buildApiFilters()),
      fetchCategories(),
      fetchCuisines(),
    ])
    categories.value = fetchedCategories
    cuisines.value = fetchedCuisines
    initStatus.value = 'ready'
  } catch {
    initStatus.value = 'idle'
  }
}

// ─── Watch URL filter changes → re-fetch (browser back/forward only) ───────
// This watcher handles URL parameter changes from browser navigation.
// User interactions use handleFilterChange() directly to avoid double API calls.
// The popstate event sets a flag to distinguish browser navigation from user interaction.
let isBrowserNavigation = false

// Named handler for proper cleanup in onUnmounted
const onPopState = () => {
  isBrowserNavigation = true
}

const handleFilterChange = () => {
  if (category.value) trackFilter('category', category.value)
  if (cuisine.value) trackFilter('cuisine', cuisine.value)
  if (difficulty.value) trackFilter('difficulty', difficulty.value)
  if (ingredients.value.length > 0) trackFilter('ingredients', ingredients.value.join(','))
  if (minRating.value) trackFilter('minRating', String(minRating.value))
  if (sort.value) trackFilter('sort', sort.value)
  debouncedSearch()
}

// Single watcher that handles both browser navigation and user interactions
// Browser navigation is detected via popstate event listener (set isBrowserNavigation flag)
watch([category, cuisine, difficulty, maxTime, minTime, ingredients, taste, sort, minRating, nutritionRange], async (newVals, oldVals) => {
  if (initStatus.value !== 'ready') return

  if (isBrowserNavigation) {
    // Browser back/forward navigation - fetch without analytics tracking
    isBrowserNavigation = false
    await fetchRecipes(buildApiFilters())
  } else if (oldVals !== undefined) {
    // User interaction - use debounced search with analytics
    handleFilterChange()
  }
  // oldVals === undefined on first mount - skip
}, { deep: true })

// Show/hide advanced filters panel
const showAdvancedFilters = ref(false)

const handleApplyAdvancedFilters = () => {
  if (taste.value.length > 0) trackFilter('taste', taste.value.join(','))
  debouncedSearch()
}

const handleClearAdvancedFilters = () => {
  minTime.value = undefined
  ingredients.value = []
  taste.value = []
  minRating.value = undefined
  nutritionRange.value = {}
  fetchRecipes(buildApiFilters())
}

// Named handlers for RecipeListSection events (avoids creating new arrow functions on each render)
const handleClearSearch = () => setSearch('')
const handleClearCategory = () => setCategory('')

// Search input handling - handled by debouncedSearchInput above

onMounted(() => {
  init()
  trackPageView('recipes')

  // Listen for browser back/forward navigation
  window.addEventListener('popstate', onPopState)
})

onUnmounted(() => {
  window.removeEventListener('popstate', onPopState)
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
            :value="search"
            type="search"
            :placeholder="t('search.placeholder')"
            class="w-full px-4 py-3 pl-12 bg-gray-100 dark:bg-stone-700 rounded-xl border-0 focus:ring-2 focus:ring-orange-500 dark:text-white dark:placeholder-stone-400 transition-all"
            @input="handleSearchInput(($event.target as HTMLInputElement).value)"
          />
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <button
            v-if="search"
            class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Clear search"
            @click="handleSearchInput('')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- Active filter count badge -->
      <div v-if="activeFilterCount > 0" class="mb-3 flex items-center gap-2">
        <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
          {{ activeFilterCount }} {{ t('filter.activeFilters', { count: activeFilterCount }) || `已应用 ${activeFilterCount} 个筛选` }}
        </span>
        <button
          class="text-xs text-gray-500 dark:text-stone-400 hover:text-orange-500 dark:hover:text-orange-400 underline"
          @click="clearAll()"
        >
          {{ t('filter.clearAll') }}
        </button>
      </div>

      <!-- Recipe Filters -->
      <div class="mb-4">
        <RecipeFilters
          :categories="categories"
          :cuisines="cuisines"
          :selected-category="category"
          :selected-cuisine="cuisine"
          :selected-difficulty="difficulty"
          :max-time="maxTime"
          :sort="sort"
          @update:selected-category="setCategory"
          @update:selected-cuisine="setCuisine"
          @update:selected-difficulty="setDifficulty"
          @update:max-time="setMaxTime"
          @update:sort="setSort"
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
            :ingredients="ingredients"
            :max-time="maxTime"
            :min-time="minTime"
            :taste="taste"
            :difficulty="difficulty"
            :cuisine="cuisine"
            :cuisine-keys="cuisines"
            :min-rating="minRating"
            :nutrition-range="nutritionRange"
            @update:ingredients="setIngredients"
            @update:max-time="setMaxTime"
            @update:min-time="setMinTime"
            @update:taste="setTaste"
            @update:difficulty="setDifficulty"
            @update:cuisine="setCuisine"
            @update:min-rating="setMinRating"
            @update:nutrition-range="setNutritionRange"
            @apply="handleApplyAdvancedFilters"
            @clear="handleClearAdvancedFilters"
          />
        </div>
      </div>

      <!-- Recipe List -->
      <RecipeListSection
        :recipes="recipes"
        :loading="loading"
        :loading-more="loadingMore"
        :error="error"
        :has-more="hasMore"
        :search-query="search"
        :selected-category="category"
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
