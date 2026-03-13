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
 */

const { t, locale } = useI18n()

useSeoMeta({
  title: () => `${t('app.title')} - ${t('app.subtitle')}`,
  ogTitle: () => `${t('app.title')} - ${t('app.subtitle')}`,
})

const localePath = useLocalePath()
const { recipes, loading, error, fetchRecipes, fetchCategoryKeys } = useRecipes()

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

onMounted(async () => {
  await fetchRecipes()
  categories.value = await fetchCategoryKeys()
})

watch([searchQuery, selectedCategory], debouncedSearch)

watch(() => useI18n().locale.value, async () => {
  categories.value = await fetchCategoryKeys()
  const filters: Record<string, string> = {}
  if (searchQuery.value) filters.search = searchQuery.value
  if (selectedCategory.value) filters.category = selectedCategory.value
  await fetchRecipes(filters)
})

const skeletonCount = 8

// 计算属性：瀑布流布局的左右列
const leftColumnRecipes = computed(() => {
  return recipes.value.filter((_, index) => index % 2 === 0)
})

const rightColumnRecipes = computed(() => {
  return recipes.value.filter((_, index) => index % 2 === 1)
})

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
          <div class="text-5xl mb-3 animate-bounce" style="animation-duration: 3s;">🍳</div>
          <h1 class="text-3xl font-bold text-white mb-2 drop-shadow-lg">
            {{ t('app.title') }}
          </h1>
          <p class="text-orange-100 text-sm mb-4 opacity-90">
            {{ t('app.subtitle') }}
          </p>
        </div>

        <!-- 搜索框 - 玻璃态 -->
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('search.placeholder')"
            class="w-full px-5 py-3.5 pl-12 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all"
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
      <div v-else class="flex gap-4 md:gap-5">
        <!-- 左列 -->
        <div class="flex-1 flex flex-col gap-4 md:gap-5">
          <NuxtLink
            v-for="(recipe, index) in leftColumnRecipes"
            :key="recipe.id"
            :to="localePath(`/recipes/${recipe.id}`)"
            class="recipe-card-enter group block bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:shadow-stone-900/30 transition-all duration-300 hover:-translate-y-1"
            :style="{ animationDelay: `${index * 50}ms` }"
          >
            <!-- 图片容器 -->
            <div 
              class="relative aspect-[4/3] overflow-hidden"
              :style="{ background: `linear-gradient(135deg, var(--color-card-gradient-start), var(--color-card-gradient-end))` }"
            >
              <img
                v-if="recipe.imageUrl"
                :src="recipe.imageUrl"
                :alt="recipe.title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="text-5xl">🍽️</span>
              </div>
              
              <!-- 悬停遮罩 -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <!-- 时间标签 -->
              <div class="absolute top-3 right-3 bg-white/90 dark:bg-stone-900/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-stone-700 dark:text-stone-200 shadow-sm">
                ⏱️ {{ recipe.prepTimeMinutes + recipe.cookTimeMinutes }}{{ t('recipe.min') }}
              </div>
            </div>

            <!-- 内容 -->
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 dark:text-stone-100 text-base leading-snug line-clamp-2 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                {{ recipe.title }}
              </h3>

              <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-stone-400">
                <span class="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                  ⏱️ {{ recipe.prepTimeMinutes + recipe.cookTimeMinutes }}{{ t('recipe.min') }}
                </span>
                <span class="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                  👥 {{ recipe.servings }}{{ t('recipe.servings') }}
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- 右列 -->
        <div class="flex-1 flex flex-col gap-4 md:gap-5">
          <NuxtLink
            v-for="(recipe, index) in rightColumnRecipes"
            :key="recipe.id"
            :to="localePath(`/recipes/${recipe.id}`)"
            class="recipe-card-enter group block bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl dark:shadow-stone-900/30 transition-all duration-300 hover:-translate-y-1"
            :style="{ animationDelay: `${(index + leftColumnRecipes.length) * 50}ms` }"
          >
            <!-- 图片容器 -->
            <div 
              class="relative aspect-[4/3] overflow-hidden"
              :style="{ background: `linear-gradient(135deg, var(--color-card-gradient-start), var(--color-card-gradient-end))` }"
            >
              <img
                v-if="recipe.imageUrl"
                :src="recipe.imageUrl"
                :alt="recipe.title"
                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div v-else class="w-full h-full flex items-center justify-center">
                <span class="text-5xl">🍽️</span>
              </div>
              
              <!-- 悬停遮罩 -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <!-- 时间标签 -->
              <div class="absolute top-3 right-3 bg-white/90 dark:bg-stone-900/80 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-medium text-stone-700 dark:text-stone-200 shadow-sm">
                ⏱️ {{ recipe.prepTimeMinutes + recipe.cookTimeMinutes }}{{ t('recipe.min') }}
              </div>
            </div>

            <!-- 内容 -->
            <div class="p-4">
              <h3 class="font-semibold text-gray-900 dark:text-stone-100 text-base leading-snug line-clamp-2 mb-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                {{ recipe.title }}
              </h3>

              <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-stone-400">
                <span class="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded-full">
                  ⏱️ {{ recipe.prepTimeMinutes + recipe.cookTimeMinutes }}{{ t('recipe.min') }}
                </span>
                <span class="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                  👥 {{ recipe.servings }}{{ t('recipe.servings') }}
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>
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
