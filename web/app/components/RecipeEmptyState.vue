<script setup lang="ts">
/**
 * RecipeEmptyState - 食谱列表空状态组件
 *
 * 功能：
 * - 无筛选条件时空状态 (引导用户添加食谱)
 * - 有筛选条件时无结果状态 (搜索/分类无匹配)
 * - 动态表情装饰
 * - 示例食谱展示
 * - 快捷操作按钮
 * - 清除筛选按钮
 *
 * 使用方式：
 * <RecipeEmptyState
 *   :search-query="query"
 *   :selected-category="category"
 *   @clear-search="clearSearch"
 * />
 */
const { t } = useI18n()
const localePath = useLocalePath()

const props = defineProps<{
  searchQuery: string
  selectedCategory: string
}>()

const emit = defineEmits<{
  clearSearch: []
  clearCategory: []
}>()

const hasFilters = computed(() => props.searchQuery || props.selectedCategory)

// Decorative food emojis for different states
const foodEmojis = ['🍳', '🥗', '🍝', '🥐', '🍲', '🥘', '🍜', '🥧']
// Use useState to ensure consistent value between SSR and client hydration
// useState persists the value across SSR/client boundary, preventing hydration mismatches
const randomFood = useState('recipe-empty-food', () => {
  const idx = Math.floor(Math.random() * foodEmojis.length)
  return foodEmojis[idx]
})

// Example recipes for guidance
const exampleRecipes = [
  { emoji: '🍝', name: t('empty.spaghetti') },
  { emoji: '🍲', name: t('empty.braisedPork') },
  { emoji: '🥗', name: t('empty.caesarSalad') },
]
</script>

<template>
  <div class="text-center py-12 md:py-20 px-4 relative overflow-hidden">
    <!-- Background decorative elements -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <div class="absolute top-10 left-10 text-4xl opacity-20 animate-bounce" style="animation-duration: 3s;">
        🌟
      </div>
      <div class="absolute top-20 right-16 text-3xl opacity-20 animate-pulse">
        ✨
      </div>
      <div class="absolute bottom-20 left-1/4 text-2xl opacity-20" style="animation: float 4s ease-in-out infinite;">
        🥄
      </div>
      <div class="absolute bottom-10 right-1/4 text-3xl opacity-20 animate-bounce" style="animation-duration: 2.5s;">
        🍽️
      </div>
    </div>

    <!-- Welcome Badge -->
    <div class="mb-6 animate-fade-in">
      <span class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 rounded-full text-sm font-medium text-orange-700 dark:text-orange-300 shadow-sm">
        <span class="text-lg">👋</span>
        {{ t('empty.welcome') || '欢迎开始您的美食之旅' }}
      </span>
    </div>

    <!-- Enhanced SVG Illustration - Larger and more prominent -->
    <div class="relative inline-block mb-8 animate-fade-in">
      <div class="relative">
        <!-- Ambient glow behind illustration -->
        <div class="absolute inset-0 bg-gradient-to-br from-amber-200/40 via-orange-200/30 to-amber-200/40 dark:from-amber-500/20 dark:via-orange-500/10 dark:to-amber-500/20 rounded-full blur-2xl scale-125 animate-pulse"></div>
        <EmptyPlateIllustration />
      </div>
    </div>

    <!-- Content based on state -->
    <template v-if="hasFilters">
      <!-- No results state -->
      <div class="mb-8 animate-fade-in">
        <!-- Friendly illustration -->
        <div class="relative inline-block mb-6">
          <NoResultsIllustration />
        </div>

        <h2 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-2">{{ t('empty.noResults') }}</h2>
        <p class="text-gray-500 dark:text-stone-400 max-w-sm mx-auto mb-6">{{ t('empty.tryDifferent') }}</p>

        <!-- Quick suggestions -->
        <div class="flex flex-wrap justify-center gap-3">
          <span class="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-stone-400">
            <span class="text-base">🔄</span>
            {{ t('search.clearSearch') }}
          </span>
          <span class="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm text-gray-600 dark:text-stone-400">
            <span class="text-base">📂</span>
            {{ t('search.allCategories') }}
          </span>
        </div>
      </div>
    </template>
    <template v-else>
      <!-- Empty state - First time user -->
      <div class="mb-8 animate-fade-in">
        <!-- Random food emoji decoration -->
        <div class="mb-4">
          <span class="text-5xl">{{ randomFood }}</span>
        </div>

        <h2 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-3">{{ t('empty.title') }}</h2>
        <p class="text-gray-500 dark:text-stone-400 max-w-md mx-auto mb-6">{{ t('empty.description') }}</p>

        <!-- Getting Started Steps -->
        <div class="max-w-xl mx-auto mb-8">
          <EmptyStateTips />
        </div>

        <!-- Example Recipes Preview -->
        <div class="max-w-sm mx-auto mb-8 mt-2">
          <p class="text-xs text-gray-400 dark:text-stone-500 mb-3 uppercase tracking-wide">{{ t('empty.exampleRecipes') }}</p>
          <div class="flex justify-center gap-4">
            <div
              v-for="recipe in exampleRecipes"
              :key="recipe.name"
              class="group flex flex-col items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              <span class="text-3xl group-hover:scale-110 transition-transform">{{ recipe.emoji }}</span>
              <span class="text-sm text-gray-600 dark:text-stone-400">{{ recipe.name }}</span>
            </div>
          </div>
        </div>

        <!-- CTA Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
          <NuxtLink
            :to="localePath('/admin/recipes/new')"
            class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl font-medium hover:from-orange-700 hover:to-orange-800 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-700/30"
            aria-label="Create Your First Recipe"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            {{ t('empty.addFirstRecipe') }}
          </NuxtLink>

          <!-- Secondary actions -->
          <EmptyStateQuickActions />
        </div>
      </div>
    </template>

    <!-- Clear Filters -->
    <div v-if="hasFilters" class="flex flex-wrap justify-center gap-3 mt-4 animate-fade-in">
      <button
        v-if="searchQuery"
        @click="emit('clearSearch')"
        class="flex items-center gap-2 px-5 py-2.5 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-all hover:scale-105"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        {{ t('search.clearSearch') }}
      </button>
      <button
        v-if="selectedCategory"
        @click="emit('clearCategory')"
        class="flex items-center gap-2 px-5 py-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-all hover:scale-105"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
        {{ t('search.allCategories') }}
      </button>
    </div>
  </div>
</template>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
