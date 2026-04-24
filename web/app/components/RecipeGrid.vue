<script setup lang="ts">
/**
 * RecipeGrid - 食谱网格布局组件
 * - 双列响应式网格，支持虚拟滚动优化
 * - 子组件: RecipeCardSkeleton, RecipeFilters, RecipeGridColumn, RecipeGridVirtualColumn
 */
import type { RecipeListItem } from '~/types'
import type { Virtualizer } from '~/types/virtualizer'
import {
  cleanupMeasurement,
  cleanupScrollSync,
  initVirtualizers,
  onVirtualScrollSync,
  onVisibilityChange,
  recalculateColumns,
  setupScrollSync,
} from '~/composables/useRecipeGridVirtualScroll'

const props = withDefaults(defineProps<{
  recipes: RecipeListItem[]
  useVirtualScrolling?: boolean
  hasMore?: boolean
  loadingMore?: boolean
  searchQuery?: string
}>(), {
  useVirtualScrolling: false,
  hasMore: true,
  loadingMore: false,
  searchQuery: '',
})

const isVirtualScrollingRef = ref(props.useVirtualScrolling)
provide('isVirtualScrolling', isVirtualScrollingRef)

watch(() => props.useVirtualScrolling, (val) => {
  isVirtualScrollingRef.value = val
})

const scrollContainerRef = ref<HTMLElement | null>(null)
const leftColumnRef = ref<{ syncVirtualizer: () => void } | null>(null)
const rightColumnRef = ref<{ syncVirtualizer: () => void } | null>(null)
const leftVirtualizer = shallowRef<Virtualizer | null>(null)
const rightVirtualizer = shallowRef<Virtualizer | null>(null)
const isInitializing = { value: false }  // Mutable ref for composable, not Vue reactive

const columnRecipes = shallowRef({ left: [] as RecipeListItem[], right: [] as RecipeListItem[] })

// 上次更新时的长度 - 用于检测真正变化
// Use refs instead of module-level vars to avoid state leak between component instances
const lastLeftLength = ref(0)
const lastRightLength = ref(0)
const pendingLeftLength = ref<number | null>(null)
const pendingRightLength = ref<number | null>(null)
const pendingUpdateRafId = ref<number | null>(null)
// Mutable refs for composable (non-reactive to avoid overhead on scroll-synced values)
const rafId = { value: null as number | null }
const lastScrollTop = { value: -1 }

// Unified watch: handles column distribution and virtualizer updates in a single pass
// Previously this was split into two separate watches that could trigger redundant recalculations
watch(() => props.recipes.length, (newLength, oldLength) => {
  if (newLength === oldLength) return
  const oldLen = oldLength ?? 0

  // Step 1: Recalculate column distribution
  if (newLength > oldLen) {
    columnRecipes.value = recalculateColumns(props.recipes, oldLen, columnRecipes.value)
  } else {
    // Fast-path: track deleted ids without building full Sets
    const left = columnRecipes.value.left
    const right = columnRecipes.value.right
    const currentIds = new Set(props.recipes.map(r => r.id))
    const deletedIds = new Set<string>()
    for (let i = 0; i < left.length; i++) {
      if (!currentIds.has(left[i].id)) deletedIds.add(left[i].id)
    }
    for (let i = 0; i < right.length; i++) {
      if (!currentIds.has(right[i].id)) deletedIds.add(right[i].id)
    }
    if (deletedIds.size === 0) return
    const prevTotal = oldLen || 1
    if (deletedIds.size / prevTotal < 0.5) {
      columnRecipes.value = {
        left: left.filter(r => !deletedIds.has(r.id)),
        right: right.filter(r => !deletedIds.has(r.id)),
      }
    } else {
      columnRecipes.value = recalculateColumns(props.recipes, 0, columnRecipes.value)
    }
  }

  // Step 2: Schedule virtualizer update via rAF (only if virtual scrolling is active)
  if (!props.useVirtualScrolling) return
  if (!leftVirtualizer.value || !rightVirtualizer.value) return

  const curLeft = columnRecipes.value.left.length
  const curRight = columnRecipes.value.right.length
  const needsLeftUpdate = curLeft !== lastLeftLength.value
  const needsRightUpdate = curRight !== lastRightLength.value
  if (!needsLeftUpdate && !needsRightUpdate) return

  if (pendingUpdateRafId.value !== null) {
    cancelAnimationFrame(pendingUpdateRafId.value)
    pendingUpdateRafId.value = null
  }
  pendingLeftLength.value = curLeft
  pendingRightLength.value = curRight
  pendingUpdateRafId.value = requestAnimationFrame(() => {
    pendingUpdateRafId.value = null
    const targetLeft = pendingLeftLength.value ?? lastLeftLength.value
    const targetRight = pendingRightLength.value ?? lastRightLength.value
    pendingLeftLength.value = null
    pendingRightLength.value = null
    const effectiveLeft = Math.min(targetLeft, columnRecipes.value.left.length)
    const effectiveRight = Math.min(targetRight, columnRecipes.value.right.length)
    if (effectiveLeft !== lastLeftLength.value && leftVirtualizer.value) {
      leftVirtualizer.value.setOptions({ count: effectiveLeft })
      lastLeftLength.value = effectiveLeft
    }
    if (effectiveRight !== lastRightLength.value && rightVirtualizer.value) {
      rightVirtualizer.value.setOptions({ count: effectiveRight })
      lastRightLength.value = effectiveRight
    }
  })
}, { immediate: true })

const onScrollSync = () => {
  onVirtualScrollSync(scrollContainerRef.value, leftVirtualizer, leftColumnRef)
}

const onVisibilityChangeHandler = () => {
  onVisibilityChange(
    pendingUpdateRafId,
    pendingLeftLength,
    pendingRightLength,
    rafId,
    lastScrollTop
  )
}

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChangeHandler)
})

// Initialize and re-initialize virtualizers when useVirtualScrolling is/changes to true
// { immediate: true } ensures initialization on mount when prop is already true
watch(() => props.useVirtualScrolling, (useVirtual) => {
  if (useVirtual) {
    nextTick(() => {
      initVirtualizers(scrollContainerRef.value, columnRecipes.value.left, columnRecipes.value.right, leftVirtualizer, rightVirtualizer, isInitializing)
      setupScrollSync(scrollContainerRef.value, leftVirtualizer, leftColumnRef, onScrollSync)
    })
  }
}, { immediate: true })

onUnmounted(() => {
  isInitializing.value = false
  document.removeEventListener('visibilitychange', onVisibilityChangeHandler)
  cleanupMeasurement()
  if (leftVirtualizer.value) { leftVirtualizer.value.unmount(); leftVirtualizer.value = null }
  if (rightVirtualizer.value) { rightVirtualizer.value.unmount(); rightVirtualizer.value = null }
  cleanupScrollSync(scrollContainerRef.value, onScrollSync)
  if (pendingUpdateRafId.value !== null) { cancelAnimationFrame(pendingUpdateRafId.value); pendingUpdateRafId.value = null }
  pendingLeftLength.value = null
  pendingRightLength.value = null
})
</script>

<template>
  <!-- 虚拟滚动模式 - 仅使用 useVirtualScrolling 判断，因为虚拟滚动初始化需要先渲染容器 -->
  <div v-if="useVirtualScrolling" ref="scrollContainerRef" class="flex gap-4 md:gap-5 h-[calc(100dvh-220px)] md:h-[calc(100vh-200px)] overflow-auto" style="contain: strict;" role="list" aria-label="Recipe list">
    <template v-if="leftVirtualizer && rightVirtualizer">
      <RecipeGridVirtualColumn
        ref="leftColumnRef"
        :recipes="columnRecipes.left"
        :virtualizer="leftVirtualizer"
        :column-index="0"
      />
      <RecipeGridVirtualColumn
        ref="rightColumnRef"
        :recipes="columnRecipes.right"
        :virtualizer="rightVirtualizer"
        :column-index="1"
      />
    </template>
    <!-- 虚拟滚动加载中状态 -->
    <div v-else class="flex gap-4 md:gap-5 flex-1">
      <div v-for="col in 2" :key="`skeleton-col-${col}`" class="flex-1 flex flex-col gap-4 md:gap-5">
        <div v-for="n in 3" :key="`skeleton-${col === 1 ? 'left' : 'right'}-${n}`" class="bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm animate-pulse">
          <ShimmerShimmer aspect-ratio="4/3" />
          <div class="p-4 space-y-3">
            <ShimmerShimmer class="h-4 w-3/4 rounded-lg" />
            <ShimmerShimmer class="h-3 w-1/2 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 标准模式 -->
  <div v-else class="flex gap-3 sm:gap-4 md:gap-5" role="list" aria-label="Recipe list">
    <RecipeGridColumn :recipes="columnRecipes.left" :search-query="searchQuery" />
    <RecipeGridColumn :recipes="columnRecipes.right" :enter-delay-base="columnRecipes.left.length * 50" :search-query="searchQuery" />
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .animate-pulse {
    animation: none;
  }
}
</style>
