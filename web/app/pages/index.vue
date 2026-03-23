<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: () => `${t('app.title')} - ${t('app.subtitle')}`,
  ogTitle: () => `${t('app.title')} - ${t('app.subtitle')}`,
  description: () => t('app.subtitle'),
  ogDescription: () => t('app.subtitle'),
  ogType: 'website',
  ogImage: '/icon.png',
  ogImageWidth: '1200',
  ogImageHeight: '630',
  ogImageAlt: '食谱应用图标',
  twitterCard: 'summary_large_image',
  twitterTitle: () => `${t('app.title')} - ${t('app.subtitle')}`,
  twitterDescription: () => t('app.subtitle'),
  twitterImage: '/icon.png',
  twitterImageAlt: '食谱应用图标',
})

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
} = useHomePage()

onMounted(() => {
  init()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300">
    <HeroSection
      v-model:searchQuery="searchQuery"
      @search="debouncedSearch"
    />

    <HeaderSection
      v-model:selectedCategory="selectedCategory"
      v-model:categories="categories"
    />

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

    <FooterSection />
  </div>
</template>
