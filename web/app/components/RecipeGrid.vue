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

const recalculateColumns = (oldLength = 0) => {
  const totalLength = props.recipes.length

  // 新增数量超过阈值时使用全量重计算
  const newItems = totalLength - oldLength
  // 阈值降低到 15，提升增量更新频率，减少全量重算
  const useFullRecalc = oldLength === 0 || newItems > 15 || newItems > oldLength

  if (useFullRecalc) {
    // 最短列优先算法 - 减少列高差异，提升虚拟滚动效率
    // 预分配数组减少 push 操作
    const left: RecipeListItem[] = new Array(Math.ceil(totalLength / 2))
    const right: RecipeListItem[] = new Array(Math.floor(totalLength / 2))
    let leftHeight = 0
    let rightHeight = 0
    let leftIdx = 0
    let rightIdx = 0

    for (let i = 0; i < totalLength; i++) {
      const recipe = props.recipes[i]

      if (leftHeight <= rightHeight) {
        left[leftIdx++] = recipe
        leftHeight += ESTIMATED_CARD_SIZE
      } else {
        right[rightIdx++] = recipe
        rightHeight += ESTIMATED_CARD_SIZE
      }
    }
    columnRecipes.value = { left, right }
    return
  }

  // 增量更新：只处理新增部分，使用最短列优先
  // 优化：直接操作现有数组，避免 spread 创建新数组
  const left = columnRecipes.value.left
  const right = columnRecipes.value.right
  let leftHeight = left.length * ESTIMATED_CARD_SIZE
  let rightHeight = right.length * ESTIMATED_CARD_SIZE

  for (let i = oldLength; i < totalLength; i++) {
    const recipe = props.recipes[i]
    if (leftHeight <= rightHeight) {
      left.push(recipe)
      leftHeight += ESTIMATED_CARD_SIZE
    } else {
      right.push(recipe)
      rightHeight += ESTIMATED_CARD_SIZE
    }
  }
  // 触发响应式更新（由于是数组引用，只需替换对象）
  columnRecipes.value = { left, right }
}

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

// 待处理的测量任务（避免 ResizeObserver 首次回调前返回错误高度）
// 使用数组代替Set以支持LRU淘汰
const pendingMeasures = new Map<HTMLElement, number>() // element -> timestamp

// 全局 ResizeObserver 实例 - 复用避免重复创建
let globalResizeObserver: ResizeObserver | null = null
const elementsBeingObserved = new Set<HTMLElement>()

// RAF批量处理待更新的元素，避免每帧多次触发
let pendingResizeEntries: ResizeObserverEntry[] = []
let resizeRafId: number | null = null

const processResizeEntries = () => {
  if (pendingResizeEntries.length === 0) return

  const entries = pendingResizeEntries
  pendingResizeEntries = []

  for (const entry of entries) {
    const newHeight = entry.contentRect.height
    if (newHeight > 0) {
      const target = entry.target as HTMLElement
      measuredHeights.set(target, newHeight + COLUMN_GAP)
      pendingMeasures.delete(target)
      // 记录访问顺序用于LRU淘汰
      touchElement(target)
    }
  }

  // 批量淘汰：当缓存达到80%容量时开始淘汰，减少内存峰值
  if (measuredHeights.size > MAX_MEASURED_HEIGHTS * 0.8) {
    evictOldEntries()
  }

  // 清理超时的 pending 测量（超过5秒未返回的视为失败）
  // 优化：提高阈值避免频繁检查，只在 pending 较多时才检查
  if (pendingMeasures.size > 50) {
    const now = Date.now()
    const timeout = 5000
    for (const [el, timestamp] of pendingMeasures) {
      if (now - timestamp > timeout) {
        pendingMeasures.delete(el)
      }
    }
  }
}

// 初始化全局 ResizeObserver
const getGlobalResizeObserver = () => {
  if (!globalResizeObserver) {
    globalResizeObserver = new ResizeObserver((entries) => {
      // 收集所有 entries，在 RAF 时批量处理
      pendingResizeEntries.push(...entries)

      // 使用 RAF 批量更新，避免每帧多次触发重排
      if (resizeRafId === null) {
        resizeRafId = requestAnimationFrame(() => {
          resizeRafId = null
          processResizeEntries()
        })
      }
    })
  }
  return globalResizeObserver
}

// LRU淘汰：使用 Map 实现 O(1) 复杂度的淘汰
// 键为元素，值为时间戳（用于按时间排序）
const lruMap = new Map<HTMLElement, number>()
let isEvicting = false

// 防抖淘汰：使用 RAF 确保最多每帧执行一次
let evictRafId: number | null = null
let pendingEviction = false

const scheduleEviction = () => {
  if (pendingEviction) return
  pendingEviction = true

  if (evictRafId === null) {
    evictRafId = requestAnimationFrame(() => {
      evictRafId = null
      pendingEviction = false
      evictOldEntries()
    })
  }
}

const evictOldEntries = () => {
  if (isEvicting) return
  isEvicting = true

  // 超过上限时，删除最老的 30% 条目，保持缓存更紧凑
  const targetSize = Math.floor(MAX_MEASURED_HEIGHTS * 0.7)
  const toDelete: HTMLElement[] = []

  // 收集最老的条目
  const iterator = lruMap.entries()
  let current = iterator.next()
  let count = 0
  const maxToDelete = MAX_MEASURED_HEIGHTS - targetSize

  while (!current.done && count < maxToDelete) {
    toDelete.push(current.value[0])
    current = iterator.next()
    count++
  }

  // 批量删除
  for (const el of toDelete) {
    lruMap.delete(el)
    measuredHeights.delete(el)
    elementsBeingObserved.delete(el)
  }

  isEvicting = false
}

// 记录访问顺序 - LRU 策略
const touchElement = (el: HTMLElement) => {
  const now = Date.now()
  // 如果已存在，先删除再插入（更新顺序）
  if (lruMap.has(el)) {
    lruMap.delete(el)
  }
  lruMap.set(el, now)
}

const measureElement = (el: HTMLElement | null) => {
  if (!el) return ESTIMATED_CARD_SIZE

  // 如果有缓存的高度，直接返回（即使有待处理的测量也优先使用已缓存的值）
  const cached = measuredHeights.get(el)
  if (cached !== undefined) {
    return cached
  }

  // 需要注册观察器
  if (!elementsBeingObserved.has(el)) {
    const observer = getGlobalResizeObserver()
    observer.observe(el)
    elementsBeingObserved.add(el)
    pendingMeasures.set(el, Date.now())
  }

  return ESTIMATED_CARD_SIZE
}

// 初始化虚拟滚动器 - 一次性完成，不重复调用
const initVirtualizers = async () => {
  if (!scrollContainerRef.value) return
  if (leftVirtualizer.value && rightVirtualizer.value) return // 已初始化
  if (isInitializing) return // 防止重复初始化
  isInitializing = true

  const { useVirtualizer } = await import('@tanstack/vue-virtual')

  leftVirtualizer.value = useVirtualizer({
    count: columnRecipes.value.left.length,
    getScrollElement: () => scrollContainerRef.value,
    estimateSize: () => ESTIMATED_CARD_SIZE,
    measureElement,
    overscan: VIRTUAL_OVERSCAN,
  })

  rightVirtualizer.value = useVirtualizer({
    count: columnRecipes.value.right.length,
    getScrollElement: () => scrollContainerRef.value,
    estimateSize: () => ESTIMATED_CARD_SIZE,
    measureElement,
    overscan: VIRTUAL_OVERSCAN,
  })
  // child component's watcher will sync automatically via its own watcher
  isInitializing = false
}

// 上次更新时的长度 - 用于检测真正变化
let lastLeftLength = 0
let lastRightLength = 0
let pendingLeftLength: number | null = null
let pendingRightLength: number | null = null
let pendingUpdateRafId: number | null = null
const rafId = { value: null as number | null }
const lastScrollTop = { value: -1 }

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
  <!-- 虚拟滚动模式 - 仅使用 useVirtualScrolling 判断，因为虚拟滚动初始化需要先渲染容器 -->
  <div v-if="useVirtualScrolling" ref="scrollContainerRef" class="flex gap-4 md:gap-5 h-[calc(100dvh-220px)] md:h-[calc(100vh-200px)] overflow-auto" style="contain: strict;">
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
        <div v-for="n in 3" :key="`skeleton-left-${n}`" class="bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm animate-pulse">
          <div class="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600 relative overflow-hidden">
            <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          </div>
          <div class="p-4 space-y-3">
            <div class="h-4 bg-gray-200 dark:bg-stone-700 rounded-lg w-3/4 relative overflow-hidden">
              <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-stone-700 rounded-lg w-1/2 relative overflow-hidden">
              <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex-1 flex flex-col gap-4 md:gap-5">
        <div v-for="n in 3" :key="`skeleton-right-${n}`" class="bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm animate-pulse">
          <div class="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600 relative overflow-hidden">
            <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
          </div>
          <div class="p-4 space-y-3">
            <div class="h-4 bg-gray-200 dark:bg-stone-700 rounded-lg w-3/4 relative overflow-hidden">
              <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-stone-700 rounded-lg w-1/2 relative overflow-hidden">
              <div class="animate-shimmer absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 标准模式 -->
  <div v-else class="flex gap-3 sm:gap-4 md:gap-5">
    <RecipeGridColumn :recipes="columnRecipes.left" />
    <RecipeGridColumn :recipes="columnRecipes.right" :enter-delay-base="columnRecipes.left.length * 50" />
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .animate-pulse {
    animation: none;
  }
}
</style>
