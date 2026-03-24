<script setup lang="ts">
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

// 设置观察器
const setupObserver = () => {
  if (!observer && loadMoreTrigger.value) {
    observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && props.hasMore && !props.loadingMore) {
        emit('loadMore')
      }
    }, observerOptions)
    observer.observe(loadMoreTrigger.value)
  }
}

// 当 recipes 列表变化且有数据时，确保观察器已设置
watch(() => props.recipes.length, (newLength) => {
  if (newLength > 0) {
    // 使用 nextTick 确保 DOM 已更新
    nextTick(() => setupObserver())
  }
})

onMounted(() => {
  // 初始状态下如果 recipes 已有数据，立即设置观察器
  if (props.recipes.length > 0) {
    nextTick(() => setupObserver())
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
