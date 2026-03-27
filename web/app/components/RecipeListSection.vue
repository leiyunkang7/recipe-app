<script setup lang="ts">
/**
 * RecipeListSection - 食谱列表区域组件
 *
 * 功能：
 * - 加载状态显示 (骨架屏)
 * - 错误状态展示 + 重试按钮
 * - 空状态展示 (支持搜索/分类筛选)
 * - 食谱网格展示 (RecipeGrid)
 * - 无限滚动加载 (IntersectionObserver)
 * - 虚拟滚动优化 (100+ 项自动启用)
 *
 * 使用方式：
 * <RecipeListSection
 *   :recipes="recipes"
 *   :loading="loading"
 *   :has-more="true"
 *   @load-more="loadMore"
 * />
 */
import type { Recipe } from '~/types'

const { t } = useI18n()

// Props
const props = defineProps<{
  recipes: Recipe[]
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

// 无限滚动
const loadMoreTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const useVirtualScrolling = computed(() => props.recipes.length >= VIRTUAL_SCROLL_THRESHOLD)

// 观察器配置
const observerOptions = {
  threshold: 0.1,
  rootMargin: '100px'
} as const

// 设置观察器 - 避免重复初始化
const setupObserver = () => {
  if (!loadMoreTrigger.value) return

  // 如果已存在观察器，不再重新初始化（避免重复连接）
  if (observer) return

  observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && props.hasMore && !props.loadingMore) {
      emit('loadMore')
    }
  }, observerOptions)
  observer.observe(loadMoreTrigger.value)
}

// 当 recipes 列表首次有数据时，设置观察器
watch(() => props.recipes.length, (newLength) => {
  if (newLength > 0) {
    // 使用 nextTick 确保 DOM 已更新
    nextTick(() => setupObserver())
  }
})

onMounted(() => {
  // 初始状态下如果 recipes 已有数据，立即设置观察器
  // onMounted 时 DOM 已就绪，无需 nextTick
  if (props.recipes.length > 0) {
    setupObserver()
  }
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
    observer = null
  }
})
</script>

<template>
  <!-- Loading状态 - 骨架屏 -->
  <RecipeSkeletonLoader v-if="loading" :count="8" />

  <!-- 错误状态 - lazy loaded as not on critical path -->
  <LazyRecipeErrorState
    v-else-if="error"
    :error="error"
    @retry="emit('retry')"
  />

  <!-- 空状态 - lazy loaded as not on critical path -->
  <LazyRecipeEmptyState
    v-else-if="recipes.length === 0"
    :search-query="searchQuery"
    :selected-category="selectedCategory"
    @clear-search="emit('clearSearch')"
    @clear-category="emit('clearCategory')"
  />

  <!-- 网格展示 -->
  <RecipeGrid 
    v-else
    :recipes="recipes"
    :use-virtual-scrolling="useVirtualScrolling"
  />

  <!-- 无限滚动触发器 -->
  <div ref="loadMoreTrigger">
    <RecipeLoadMoreTrigger 
      v-if="recipes.length > 0"
      :has-more="hasMore"
      :loading-more="loadingMore"
    />
  </div>
</template>
