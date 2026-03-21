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
  twitterCard: 'summary_large_image',
  twitterTitle: () => `${t('app.title')} - ${t('app.subtitle')}`,
  twitterDescription: () => t('app.subtitle'),
  twitterImage: '/icon.png',
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
    <HeaderSection 
      v-model:searchQuery="searchQuery"
      v-model:selectedCategory="selectedCategory"
      v-model:categories="categories"
      @search="debouncedSearch"
    />

    <HeroSection 
      v-model:searchQuery="searchQuery"
      @search="debouncedSearch"
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

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-bounce,
  .animate-pulse,
  .animate-[shimmer_1.5s_infinite] {
    animation: none;
  }
}
</style>
