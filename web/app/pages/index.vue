<script setup lang="ts">
/**
 * 首页 - 响应式食谱列表
 * 
 * 优化点：
 * - 响应式列数：手机1列 / 平板2列 / 桌面3列
 * - 骨架屏loading状态
 * - 集成DesktopNavbar和MobileNavbar
 * - 使用新的RecipeCard组件
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

// 骨架屏占位数量
const skeletonCount = 8
</script>

<template>
  <div class="min-h-screen bg-stone-50">
    <!-- 桌面端导航 -->
    <DesktopNavbar v-model="searchQuery" @search="debouncedSearch" />

    <!-- 移动端头部 -->
    <header class="md:hidden sticky top-0 z-40 bg-white border-b border-gray-200">
      <div class="px-4 py-3">
        <div class="flex items-center justify-between mb-3">
          <h1 class="text-xl font-bold text-orange-600">
            🍳 {{ t('app.title') }}
          </h1>
          <LanguageSwitcher />
        </div>

        <!-- 搜索框 -->
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="t('search.placeholder')"
            class="w-full px-4 py-2.5 pl-10 rounded-full border border-gray-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all bg-gray-50 text-sm"
            @input="debouncedSearch"
          />
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-18 0 7 7 0 0118 0z"></path>
          </svg>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="px-3 py-4 md:px-4 md:py-6 lg:px-8 lg:py-8">
      <!-- Loading状态 - 骨架屏 -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
        <RecipeCard 
          v-for="n in skeletonCount" 
          :key="`skeleton-${n}`" 
          :recipe="{} as any" 
          loading 
        />
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="max-w-md mx-auto">
        <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <div class="text-4xl mb-3">😕</div>
          <h3 class="text-lg font-semibold text-red-800 mb-2">{{ t('error.title') }}</h3>
          <p class="text-red-600 text-sm mb-4">{{ error }}</p>
          <button
            @click="fetchRecipes()"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            {{ t('error.retry') }}
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else-if="recipes.length === 0" class="text-center py-12 md:py-20">
        <div class="text-6xl mb-4">🍽️</div>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ t('empty.title') }}</h3>
        <p class="text-gray-500">{{ t('empty.description') }}</p>
      </div>

      <!-- 食谱网格 -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <RecipeCard 
          v-for="recipe in recipes" 
          :key="recipe.id" 
          :recipe="recipe"
          :lazy="true"
        />
      </div>
    </main>

    <!-- 移动端底部导航 -->
    <MobileNavbar />
  </div>
</template>

<style scoped>
/* 移动端底部安全区域 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .pb-safe {
    padding-bottom: max(env(safe-area-inset-bottom), 16px);
  }
}
</style>
