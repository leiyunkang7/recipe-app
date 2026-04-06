<script setup lang="ts">
const { t, locale } = useI18n()
const baseUrl = useBaseUrl()

const ogImageAbsolute = computed(() => `${baseUrl}/icon.png`)

useSeoMeta({
  title: () => `${t('app.title')} - ${t('app.subtitle')}`,
  ogTitle: () => `${t('app.title')} - ${t('app.subtitle')}`,
  description: () => t('app.subtitle'),
  ogDescription: () => t('app.subtitle'),
  ogType: 'website',
  ogSiteName: () => t('app.ogSiteName'),
  ogUrl: () => `${baseUrl}/${locale.value}`,
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
  handleClearAdvancedFilters,
} = useHomePage()

// Show/hide advanced filters
const showAdvancedFilters = ref(false)

const handleApplyFilters = () => {
  debouncedSearch()
}

onMounted(() => {
  init()
})
</script>

<template>
  <div class="min-h-screen pb-16 md:pb-0 bg-gradient-to-br from-orange-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300">
    <HeroSection
      v-model:searchQuery="searchQuery"
      @search="debouncedSearch"
    />

    <main id="main-content" tabindex="-1">
      <HeaderSection
        v-model:selectedCategory="selectedCategory"
        v-model:categories="categories"
      />

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
            @update:ingredients="selectedIngredients = $event"
            @update:max-time="maxTime = $event"
            @update:min-time="minTime = $event"
            @update:taste="selectedTaste = $event"
            @update:difficulty="selectedDifficulty = $event"
            @apply="handleApplyFilters"
            @clear="handleClearAdvancedFilters"
          />
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
