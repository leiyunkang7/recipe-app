<script setup lang="ts">
const { t, locale } = useI18n()
const config = useRuntimeConfig()
const baseUrl = config.public.supabaseUrl?.replace('/rest/v1', '') || 'https://your-project.supabase.co'

useSeoMeta({
  title: () => `${t('app.title')} - ${t('app.subtitle')}`,
  ogTitle: () => `${t('app.title')} - ${t('app.subtitle')}`,
  description: () => t('app.subtitle'),
  ogDescription: () => t('app.subtitle'),
  ogType: 'website',
  ogSiteName: '食谱大全',
  ogUrl: () => `${baseUrl}/${locale.value}`,
  ogImage: '/icon.png',
  ogImageWidth: '1200',
  ogImageHeight: '630',
  ogImageAlt: '食谱应用图标',
  ogLocale: locale.value === 'en' ? 'en_US' : 'zh_CN',
  ogLocaleAlternate: locale.value === 'en' ? 'zh_CN' : 'en_US',
  twitterCard: 'summary_large_image',
  twitterSite: '@recipeapp',
  twitterTitle: () => `${t('app.title')} - ${t('app.subtitle')}`,
  twitterDescription: () => t('app.subtitle'),
  twitterImage: '/icon.png',
  twitterImageAlt: '食谱应用图标',
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

    <main id="main-content" tabindex="-1">
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
    </main>

    <LazyFooterSection />
  </div>
</template>
