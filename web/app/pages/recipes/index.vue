<script setup lang="ts">
/**
 * Recipes Index Page - 食谱列表页
 *
 * 显示所有食谱，支持搜索和分类筛选
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
  debouncedSearch,
  loadMore,
  init,
  handleClearSearch,
  handleClearCategory,
  selectedDifficulty,
  maxTime,
} = useHomePage()

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
          <input
            v-model="searchQuery"
            type="search"
            :placeholder="t('search.placeholder')"
            class="w-full px-4 py-3 pl-12 bg-gray-100 dark:bg-stone-700 rounded-xl border-0 focus:ring-2 focus:ring-orange-500 dark:text-white dark:placeholder-stone-400 transition-all"
            @input="debouncedSearch"
          />
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <!-- Recipe Filters -->
      <div class="mb-6">
        <RecipeFilters
          v-model:selectedCategory="selectedCategory"
          v-model:selectedDifficulty="selectedDifficulty"
          v-model:maxTime="maxTime"
          :categories="categories"
        />
      </div>

      <!-- Recipe List -->
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

    <LazyBottomNav />
  </div>
</template>
