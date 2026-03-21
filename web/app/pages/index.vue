<script setup lang="ts">
/**
 * 首页 - 现代化重新设计 v2
 * 
 * 设计风格：
 * - Glassmorphism 玻璃拟态
 * - 柔和渐变色
 * - 大圆角 16-24px
 * - 精致阴影层次
 * - 流畅微动画
 * - 暗色模式支持
 * - 改进的入场动画
 * 
 * 性能优化：
 * - 虚拟滚动 (Virtual Scrolling) - 超过 100 个食谱时启用
 * - 服务端分页 + 无限滚动
 * - 图片懒加载
 * - 组件级懒加载
 */

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

const { recipes, loading, loadingMore, error, hasMore, fetchRecipes, fetchCategoryKeys } = useRecipes()

const searchQuery = ref('')
const selectedCategory = ref('')
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const categories = ref<Array<{ id: number; name: string; displayName: string }>>([])

const debouncedSearch = async () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(async () => {
    const filters: Record<string, string> = {}
    if (searchQuery.value) filters.search = searchQuery.value
    if (selectedCategory.value) filters.category = selectedCategory.value
    await fetchRecipes(filters)
  }, 300)
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  const filters: Record<string, string> = {}
  if (searchQuery.value) filters.search = searchQuery.value
  if (selectedCategory.value) filters.category = selectedCategory.value
  await fetchRecipes(filters, true)
}

onMounted(async () => {
  await fetchRecipes()
  categories.value = await fetchCategoryKeys()
})

watch(() => useI18n().locale.value, async () => {
  categories.value = await fetchCategoryKeys()
  const filters: Record<string, string> = {}
  if (searchQuery.value) filters.search = searchQuery.value
  if (selectedCategory.value) filters.category = selectedCategory.value
  await fetchRecipes(filters)
})

const handleClearSearch = () => {
  searchQuery.value = ''
  debouncedSearch()
}

const handleClearCategory = () => {
  selectedCategory.value = ''
  debouncedSearch()
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300">
    <!-- Header: 桌面端导航 + 分类筛选 -->
    <HeaderSection 
      v-model:searchQuery="searchQuery"
      v-model:selectedCategory="selectedCategory"
      v-model:categories="categories"
      @search="debouncedSearch"
    />

    <!-- Hero: 移动端标题 + 搜索 -->
    <HeroSection 
      v-model:searchQuery="searchQuery"
      @search="debouncedSearch"
    />

    <!-- RecipeList: 食谱列表 + 虚拟滚动 -->
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
      @retry="fetchRecipes()"
      @clear-search="handleClearSearch"
      @clear-category="handleClearCategory"
    />

    <!-- Footer: 底部导航 -->
    <FooterSection />
  </div>
</template>

<style scoped>
/* 隐藏滚动条 */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* 多行文本截断 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Shimmer 骨架屏动画 */
@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .animate-bounce,
  .animate-pulse,
  .animate-[shimmer_1.5s_infinite] {
    animation: none;
  }
}
</style>
