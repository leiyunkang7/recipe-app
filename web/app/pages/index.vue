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

import { useVirtualizer } from '@tanstack/vue-virtual'

const { t, locale } = useI18n()

useSeoMeta({
  title: () => `${t('app.title')} - ${t('app.subtitle')}`,
  ogTitle: () => `${t('app.title')} - ${t('app.subtitle')}`,
})

const localePath = useLocalePath()
const { recipes, loading, loadingMore, error, hasMore, fetchRecipes, fetchCategoryKeys } = useRecipes()

// 虚拟滚动配置
const VIRTUAL_SCROLL_THRESHOLD = 100
const COLUMN_GAP = 16 // md:gap-5 = 20px, sm:gap-4 = 16px
const CARD_HEIGHT = 280 // 估算卡片高度 (4:3 aspect ratio + padding)

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

const loadMoreTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

// 虚拟滚动相关
const scrollContainerRef = ref<HTMLElement | null>(null)
const useVirtualScrolling = computed(() => recipes.value.length >= VIRTUAL_SCROLL_THRESHOLD)

// 双列布局：将食谱分配到左右两列
const leftColumnRecipes = computed(() => {
  return recipes.value.filter((_, index) => index % 2 === 0)
})

const rightColumnRecipes = computed(() => {
  return recipes.value.filter((_, index) => index % 2 === 1)
})

// 虚拟滚动器 - 左右列独立虚拟化
const leftVirtualizer = ref<ReturnType<typeof useVirtualizer> | null>(null)
const rightVirtualizer = ref<ReturnType<typeof useVirtualizer> | null>(null)

const initVirtualizers = () => {
  if (!scrollContainerRef.value) return
  
  const containerHeight = scrollContainerRef.value.clientHeight || window.innerHeight
  
  leftVirtualizer.value = useVirtualizer({
    count: leftColumnRecipes.value.length,
    getScrollElement: () => scrollContainerRef.value,
    estimateSize: () => CARD_HEIGHT + COLUMN_GAP,
    overscan: 3, // 预渲染区域
  })
  
  rightVirtualizer.value = useVirtualizer({
    count: rightColumnRecipes.value.length,
    getScrollElement: () => scrollContainerRef.value,
    estimateSize: () => CARD_HEIGHT + COLUMN_GAP,
    overscan: 3,
  })
}

onMounted(async () => {
  await fetchRecipes()
  categories.value = await fetchCategoryKeys()

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasMore.value && !loadingMore.value) {
        loadMore()
      }
    },
    { threshold: 0.1, rootMargin: '100px' }
  )

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
  }
  
  if (useVirtualScrolling.value) {
    initVirtualizers()
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})

watch(useVirtualScrolling, (useVirtual) => {
  if (useVirtual && scrollContainerRef.value && !leftVirtualizer.value) {
    initVirtualizers()
  }
})

watch([searchQuery, selectedCategory], debouncedSearch)

watch(() => useI18n().locale.value, async () => {
  categories.value = await fetchCategoryKeys()
  const filters: Record<string, string> = {}
  if (searchQuery.value) filters.search = searchQuery.value
  if (selectedCategory.value) filters.category = selectedCategory.value
  await fetchRecipes(filters)
  
  if (useVirtualScrolling.value) {
    // 重置虚拟滚动器
    leftVirtualizer.value = null
    rightVirtualizer.value = null
    nextTick(() => initVirtualizers())
  }
})

const skeletonCount = 8

// 控制入场动画
const isLoaded = ref(false)
onMounted(() => {
  setTimeout(() => {
    isLoaded.value = true
  }, 100)
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-orange-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900 transition-colors duration-300">
    <!-- 桌面端导航 -->
    <DesktopNavbar v-model="searchQuery" @search="debouncedSearch" />

    <!-- Hero Section - 移动端 -->
    <header class="md:hidden relative overflow-hidden">
      <!-- 渐变背景 + 动态光效 -->
      <div class="absolute inset-0 bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500"></div>
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-1/2 -right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute -bottom-1/2 -left-1/4 w-64 h-64 bg-white/10 rounded-full blur-2xl animate-pulse" style="animation-delay: 1s;"></div>
      </div>
      
      <!-- 玻璃态内容 -->
      <div class="relative px-6 py-8">
        <div class="text-center mb-6">
          <div class="text-4xl sm:text-5xl mb-3 animate-bounce" style="animation-duration: 3s;">🍳</div>
          <h1 class="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
            {{ t('app.title') }}
          </h1>
          <p class="text-orange-100 text-xs sm:text-sm mb-4 opacity-90">
            {{ t('app.subtitle') }}
          </p>
        </div>

        <!-- 搜索框 - 玻璃态 -->
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('search.placeholder')"
            class="w-full px-4 sm:px-5 py-3 sm:py-3.5 pl-11 sm:pl-12 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all text-base"
            @input="debouncedSearch"
          />
          <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-18 0 7 7 0 0118 0z"></path>
          </svg>
        </div>
        
        <!-- 移动端主题切换 -->
        <div class="flex justify-center mt-4">
          <ThemeToggle />
        </div>
      </div>

      <!-- 波浪分隔 -->
      <div class="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" class="w-full h-8">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#fafaf9"/>
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" class="dark:fill-stone-800" style="transform: translateY(-4px);"/>
        </svg>
      </div>
    </header>

    <!-- 分类筛选 - 移动端 -->
    <section class="md:hidden px-4 py-4 -mt-2">
      <CategoryNav 
        :categories="categories" 
        :selected="selectedCategory"
        @select="selectedCategory = $event"
      />
    </section>

    <!-- 分类筛选 - 桌面端 -->
    <section class="hidden md:block px-4 py-3 -mt-2 bg-white/50 dark:bg-stone-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-stone-700">
      <div class="max-w-7xl mx-auto">
        <CategoryNav 
          :categories="categories" 
          :selected="selectedCategory"
          @select="selectedCategory = $event"
        />
      </div>
    </section>

    <!-- 主内容区 -->
    <main class="px-4 py-4 md:px-6 md:py-6 lg:px-8 lg:py-8">
      <!-- Loading状态 - 骨架屏 -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
        <div 
          v-for="n in skeletonCount" 
          :key="`skeleton-${n}`"
          class="bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm animate-pulse"
        >
          <div class="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600 relative overflow-hidden">
            <!-- 骨架屏 shimmer 效果 -->
            <div class="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          </div>
          <div class="p-4 space-y-3">
            <div class="h-4 bg-gray-200 dark:bg-stone-700 rounded-lg w-3/4 relative overflow-hidden">
              <div class="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-stone-700 rounded-lg w-1/2 relative overflow-hidden">
              <div class="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="max-w-md mx-auto">
        <div class="bg-red-50/80 dark:bg-red-900/30 backdrop-blur-sm border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center">
          <div class="text-5xl mb-4">😕</div>
          <h3 class="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">{{ t('error.title') }}</h3>
          <p class="text-red-600 dark:text-red-400 text-sm mb-4">{{ error }}</p>
          <button
            @click="fetchRecipes()"
            class="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg shadow-red-200 dark:shadow-red-900/30 font-medium"
          >
            {{ t('error.retry') }}
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="recipes.length === 0" class="text-center py-16 md:py-24">
        <div class="relative inline-block mb-6">
          <div class="text-7xl animate-bounce" style="animation-duration: 2s;">🍽️</div>
          <!-- 装饰性光晕 -->
          <div class="absolute inset-0 bg-orange-200/30 dark:bg-orange-500/20 rounded-full blur-2xl -z-10"></div>
        </div>
        <!-- 搜索/筛选无结果 -->
        <template v-if="searchQuery || selectedCategory">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-stone-100 mb-3">{{ t('empty.noResults') }}</h3>
          <p class="text-gray-500 dark:text-stone-400 max-w-sm mx-auto mb-4">{{ t('empty.tryDifferent') }}</p>
        </template>
        <!-- 初始空状态 -->
        <template v-else>
          <h3 class="text-xl font-semibold text-gray-900 dark:text-stone-100 mb-3">{{ t('empty.title') }}</h3>
          <p class="text-gray-500 dark:text-stone-400 max-w-sm mx-auto">{{ t('empty.description') }}</p>
        </template>
        
        <!-- 清除搜索/筛选按钮 -->
        <div class="mt-6 flex flex-wrap justify-center gap-2">
          <button 
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="px-4 py-2 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors"
          >
            {{ t('search.clearSearch') }} ✕
          </button>
          <button 
            v-if="selectedCategory"
            @click="selectedCategory = ''"
            class="px-4 py-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
          >
            {{ t('search.allCategories') }} ✕
          </button>
        </div>
      </div>

      <!-- 瀑布流食谱网格 - 双列 -->
      <!-- 使用 v-memo 优化：只有 recipe 数据变化时才重新渲染 -->
      <!-- 虚拟滚动模式：超过 100 个食谱时启用 -->
      <template v-if="useVirtualScrolling && leftVirtualizer && rightVirtualizer">
        <div ref="scrollContainerRef" class="flex gap-4 md:gap-5 h-[calc(100vh-200px)] overflow-auto">
          <!-- 左列虚拟滚动 -->
          <div class="flex-1 flex flex-col gap-4 md:gap-5 relative">
            <div
              :style="{
                height: `${leftVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }"
            >
              <div
                v-for="virtualRow in leftVirtualizer.getVirtualItems()"
                :key="virtualRow.key"
                :style="{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }"
              >
                <LazyRecipeCard
                  :recipe="leftColumnRecipes[virtualRow.index]"
                  :enter-delay="0"
                />
              </div>
            </div>
          </div>

          <!-- 右列虚拟滚动 -->
          <div class="flex-1 flex flex-col gap-4 md:gap-5 relative">
            <div
              :style="{
                height: `${rightVirtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }"
            >
              <div
                v-for="virtualRow in rightVirtualizer.getVirtualItems()"
                :key="virtualRow.key"
                :style="{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }"
              >
                <LazyRecipeCard
                  :recipe="rightColumnRecipes[virtualRow.index]"
                  :enter-delay="0"
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- 标准模式：100 个以下食谱使用普通渲染 -->
      <div v-else class="flex gap-4 md:gap-5">
        <!-- 左列 -->
        <div class="flex-1 flex flex-col gap-4 md:gap-5">
          <LazyRecipeCard
            v-for="(recipe, index) in leftColumnRecipes"
            v-memo="[recipe.id, recipe.imageUrl, recipe.title, recipe.prepTimeMinutes, recipe.cookTimeMinutes, recipe.servings]"
            :key="recipe.id"
            :recipe="recipe"
            :enter-delay="index * 50"
          />
        </div>

        <!-- 右列 -->
        <div class="flex-1 flex flex-col gap-4 md:gap-5">
          <LazyRecipeCard
            v-for="(recipe, index) in rightColumnRecipes"
            v-memo="[recipe.id, recipe.imageUrl, recipe.title, recipe.prepTimeMinutes, recipe.cookTimeMinutes, recipe.servings]"
            :key="recipe.id"
            :recipe="recipe"
            :enter-delay="(index + leftColumnRecipes.length) * 50"
          />
        </div>
      </div>

      <!-- 无限滚动触发器 -->
      <div 
        ref="loadMoreTrigger" 
        class="flex justify-center py-8"
        v-if="hasMore && recipes.length > 0"
      >
        <div v-if="loadingMore" class="flex items-center gap-2 text-gray-500 dark:text-stone-400">
          <svg class="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-sm">{{ t('common.loading') }}...</span>
        </div>
      </div>

      <!-- 没有更多数据提示 -->
      <div 
        v-if="!hasMore && recipes.length > 0" 
        class="text-center py-8 text-sm text-gray-400 dark:text-stone-500"
      >
        {{ t('common.noMoreData') }}
      </div>
    </main>

    <!-- 底部导航 -->
    <MobileNavbar />
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
