<script setup lang="ts">
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

// 无限滚动
const loadMoreTrigger = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const useVirtualScrolling = computed(() => props.recipes.length >= VIRTUAL_SCROLL_THRESHOLD)

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
})

onUnmounted(() => {
  if (observer) {
    observer.disconnect()
  }
})
</script>

<template>
  <!-- Loading状态 - 骨架屏 -->
  <RecipeSkeletonLoader v-if="loading" :count="8" />

  <!-- 错误状态 -->
  <RecipeErrorState 
    v-else-if="error" 
    :error="error" 
    @retry="emit('retry')" 
  />

  <!-- 空状态 -->
  <RecipeEmptyState 
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
