<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual'

const { t } = useI18n()

// Props
const props = defineProps<{
  recipes: any[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasMore: boolean
  searchQuery: string
  selectedCategory: string
}>()

// Emits
const emit = defineEmits<{
  search: []
  loadMore: []
  retry: []
  clearSearch: []
  clearCategory: []
}>()

// 虚拟滚动配置
const VIRTUAL_SCROLL_THRESHOLD = 100
const COLUMN_GAP = 16
const CARD_HEIGHT = 280

// 虚拟滚动相关
const scrollContainerRef = ref<HTMLElement | null>(null)
const loadMoreTrigger = ref<HTMLElement | null>(null)
const leftVirtualizer = ref<ReturnType<typeof useVirtualizer> | null>(null)
const rightVirtualizer = ref<ReturnType<typeof useVirtualizer> | null>(null)
let observer: IntersectionObserver | null = null

const useVirtualScrolling = computed(() => props.recipes.length >= VIRTUAL_SCROLL_THRESHOLD)

// 双列布局
const leftColumnRecipes = computed(() => props.recipes.filter((_, index) => index % 2 === 0))
const rightColumnRecipes = computed(() => props.recipes.filter((_, index) => index % 2 === 1))

// 动态高度测量
const measureElement = (el: HTMLElement | null) => {
  if (!el) return 0
  return el.getBoundingClientRect().height + COLUMN_GAP
}

const initVirtualizers = () => {
  if (!scrollContainerRef.value) return
  
  leftVirtualizer.value = null
  rightVirtualizer.value = null
  
  leftVirtualizer.value = useVirtualizer({
    count: leftColumnRecipes.value.length,
    getScrollElement: () => scrollContainerRef.value,
    estimateSize: () => CARD_HEIGHT + COLUMN_GAP,
    measureElement,
    overscan: 3,
  })
  
  rightVirtualizer.value = useVirtualizer({
    count: rightColumnRecipes.value.length,
    getScrollElement: () => scrollContainerRef.value,
    estimateSize: () => CARD_HEIGHT + COLUMN_GAP,
    measureElement,
    overscan: 3,
  })
}

const updateVirtualizers = () => {
  if (!useVirtualScrolling.value || !scrollContainerRef.value) return
  
  if (!leftVirtualizer.value || !rightVirtualizer.value) {
    initVirtualizers()
    return
  }
  
  leftVirtualizer.value.setOptions({ count: leftColumnRecipes.value.length })
  rightVirtualizer.value.setOptions({ count: rightColumnRecipes.value.length })
}

watch([leftColumnRecipes, rightColumnRecipes], updateVirtualizers)

watch(useVirtualScrolling, (useVirtual) => {
  if (useVirtual && scrollContainerRef.value && !leftVirtualizer.value) {
    initVirtualizers()
  }
})

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && props.hasMore && !props.loadingMore) {
        emit('loadMore')
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

const skeletonCount = 8
</script>

<template>
  <!-- Loading状态 - 骨架屏 -->
  <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
    <div 
      v-for="n in skeletonCount" 
      :key="`skeleton-${n}`"
      class="bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm animate-pulse"
    >
      <div class="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600 relative overflow-hidden">
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
        @click="emit('retry')"
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
      <div class="absolute inset-0 bg-orange-200/30 dark:bg-orange-500/20 rounded-full blur-2xl -z-10"></div>
    </div>
    
    <template v-if="searchQuery || selectedCategory">
      <h3 class="text-xl font-semibold text-gray-900 dark:text-stone-100 mb-3">{{ t('empty.noResults') }}</h3>
      <p class="text-gray-500 dark:text-stone-400 max-w-sm mx-auto mb-4">{{ t('empty.tryDifferent') }}</p>
    </template>
    <template v-else>
      <h3 class="text-xl font-semibold text-gray-900 dark:text-stone-100 mb-3">{{ t('empty.title') }}</h3>
      <p class="text-gray-500 dark:text-stone-400 max-w-sm mx-auto">{{ t('empty.description') }}</p>
    </template>
    
    <div class="mt-6 flex flex-wrap justify-center gap-2">
      <button 
        v-if="searchQuery"
        @click="emit('clearSearch')"
        class="px-4 py-2 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-900/60 transition-colors"
      >
        {{ t('search.clearSearch') }} ✕
      </button>
      <button 
        v-if="selectedCategory"
        @click="emit('clearCategory')"
        class="px-4 py-2 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/60 transition-colors"
      >
        {{ t('search.allCategories') }} ✕
      </button>
    </div>
  </div>

  <!-- 虚拟滚动模式 -->
  <template v-else-if="useVirtualScrolling && leftVirtualizer && rightVirtualizer">
    <div ref="scrollContainerRef" class="flex gap-4 md:gap-5 h-[calc(100vh-200px)] overflow-auto">
      <!-- 左列 -->
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

      <!-- 右列 -->
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

  <!-- 标准模式 -->
  <div v-else class="flex gap-4 md:gap-5">
    <div class="flex-1 flex flex-col gap-4 md:gap-5">
      <LazyRecipeCard
        v-for="(recipe, index) in leftColumnRecipes"
        v-memo="[recipe.id, recipe.imageUrl, recipe.title, recipe.prepTimeMinutes, recipe.cookTimeMinutes, recipe.servings]"
        :key="recipe.id"
        :recipe="recipe"
        :enter-delay="index * 50"
      />
    </div>
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

  <!-- 没有更多数据 -->
  <div 
    v-if="!hasMore && recipes.length > 0" 
    class="text-center py-8 text-sm text-gray-400 dark:text-stone-500"
  >
    {{ t('common.noMoreData') }}
  </div>
</template>
