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
}>(), {
  useVirtualScrolling: false,
  hasMore: true,
  loadingMore: false,
})

provide('isVirtualScrolling', props.useVirtualScrolling)
const sharedVirtualItems = shallowRef<{ items: import('~/types/virtualizer').VirtualItem[]; totalSize: number; masterColumnIndex: number }>({ items: [], totalSize: 0, masterColumnIndex: 0 })
provide('sharedVirtualItems', sharedVirtualItems)

const scrollContainerRef = ref<HTMLElement | null>(null)
const leftColumnRef = ref<{ syncVirtualizer: () => void } | null>(null)
const rightColumnRef = ref<{ syncVirtualizer: () => void } | null>(null)
const leftVirtualizer = shallowRef<Virtualizer | null>(null)
const rightVirtualizer = shallowRef<Virtualizer | null>(null)
const isInitializing = { value: false }

const columnRecipes = shallowRef({ left: [] as RecipeListItem[], right: [] as RecipeListItem[] })

watch(() => props.recipes.length, (newLength, oldLength) => {
  if (newLength === oldLength) return
  if (newLength > oldLength) {
    columnRecipes.value = recalculateColumns(props.recipes, oldLength, columnRecipes.value)
  } else {
    const currentIds = new Set(props.recipes.map(r => r.id))
    const prevIds = new Set(columnRecipes.value.left.concat(columnRecipes.value.right).map(r => r.id))
    const deletedIds = new Set<string>()
    for (const id of prevIds) {
      if (!currentIds.has(id)) deletedIds.add(id)
    }
    if (deletedIds.size === 0) return
    const deleteRatio = deletedIds.size / (oldLength || 1)
    if (deleteRatio < 0.5) {
      const left = columnRecipes.value.left.filter(r => !deletedIds.has(r.id))
      const right = columnRecipes.value.right.filter(r => !deletedIds.has(r.id))
      columnRecipes.value = { left, right }
    } else {
      columnRecipes.value = recalculateColumns(props.recipes, 0, columnRecipes.value)
    }
  }
}, { immediate: true })


let lastLeftLength = 0
let lastRightLength = 0
let pendingLeftLength: number | null = null
let pendingRightLength: number | null = null
let pendingUpdateRafId: number | null = null
const rafId = { value: null as number | null }
const lastScrollTop = { value: -1 }

const leftLength = computed(() => columnRecipes.value.left.length)
const rightLength = computed(() => columnRecipes.value.right.length)

watch([leftLength, rightLength], ([leftLen, rightLen]) => {
  if (!props.useVirtualScrolling) return
  if (!leftVirtualizer.value || !rightVirtualizer.value) return
  const needsLeftUpdate = leftLen !== lastLeftLength
  const needsRightUpdate = rightLen !== lastRightLength
  if (!needsLeftUpdate && !needsRightUpdate) return
  if (pendingUpdateRafId !== null) {
    cancelAnimationFrame(pendingUpdateRafId)
    pendingUpdateRafId = null
  }
  pendingLeftLength = leftLen
  pendingRightLength = rightLen
  pendingUpdateRafId = requestAnimationFrame(() => {
    pendingUpdateRafId = null
    const targetLeft = pendingLeftLength ?? lastLeftLength
    const targetRight = pendingRightLength ?? lastRightLength
    pendingLeftLength = null
    pendingRightLength = null
    const currentLeft = columnRecipes.value.left.length
    const currentRight = columnRecipes.value.right.length
    const effectiveLeft = Math.min(targetLeft, currentLeft)
    const effectiveRight = Math.min(targetRight, currentRight)
    if (effectiveLeft !== lastLeftLength && leftVirtualizer.value) {
      leftVirtualizer.value.setOptions({ count: effectiveLeft })
      lastLeftLength = effectiveLeft
    }
    if (effectiveRight !== lastRightLength && rightVirtualizer.value) {
      rightVirtualizer.value.setOptions({ count: effectiveRight })
      lastRightLength = effectiveRight
    }
  })
})

watch(() => props.useVirtualScrolling, (useVirtual) => {
  if (useVirtual) {
    initVirtualizers(scrollContainerRef.value, columnRecipes.value.left, columnRecipes.value.right, leftVirtualizer, rightVirtualizer, isInitializing)
    setupScrollSync(scrollContainerRef.value, leftVirtualizer, leftColumnRef, onScrollSync)
  }
})


const onScrollSync = () => {
  onVirtualScrollSync(scrollContainerRef, leftVirtualizer, leftColumnRef)
}

onMounted(() => {
  document.addEventListener('visibilitychange', () => {
    onVisibilityChange(
      { value: pendingUpdateRafId as number | null },
      { value: pendingLeftLength as number | null },
      { value: pendingRightLength as number | null },
      rafId,
      lastScrollTop
    )
  })
  if (props.useVirtualScrolling) {
    nextTick(() => {
      initVirtualizers(
        scrollContainerRef.value,
        columnRecipes.value.left,
        columnRecipes.value.right,
        leftVirtualizer,
        rightVirtualizer,
        isInitializing
      )
      setupScrollSync(scrollContainerRef.value, leftVirtualizer, leftColumnRef, onScrollSync)
    })
  }
})

onUnmounted(() => {
  isInitializing.value = false
  cleanupMeasurement()
  if (leftVirtualizer.value) { leftVirtualizer.value.unmount(); leftVirtualizer.value = null }
  if (rightVirtualizer.value) { rightVirtualizer.value.unmount(); rightVirtualizer.value = null }
  cleanupScrollSync(scrollContainerRef.value, onScrollSync)
  if (pendingUpdateRafId !== null) { cancelAnimationFrame(pendingUpdateRafId); pendingUpdateRafId = null }
  pendingLeftLength = null
  pendingRightLength = null
})
</script>

<template>
  <!-- 虚拟滚动模式 -->
  <div v-if="useVirtualScrolling" ref="scrollContainerRef" class="flex gap-4 md:gap-5 h-[calc(100vh-200px)] overflow-auto" style="contain: strict;">
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
      <div class="flex-1 flex flex-col gap-4 md:gap-5">
        <RecipeCardSkeleton v-for="n in 3" :key="`skeleton-left-${n}`" :index="n" />
      </div>
      <div class="flex-1 flex flex-col gap-4 md:gap-5">
        <RecipeCardSkeleton v-for="n in 3" :key="`skeleton-right-${n}`" :index="n + 3" />
      </div>
    </div>
  </div>

  <!-- 标准模式 -->
  <div v-else class="flex gap-4 md:gap-5">
    <RecipeGridColumn :recipes="columnRecipes.left" />
    <RecipeGridColumn :recipes="columnRecipes.right" :enter-delay-base="columnRecipes.left.length * 50" />
  </div>
</template>

<style scoped>
/* Styles handled by RecipeCardSkeleton */
</style>
