<script setup lang="ts">
/**
 * RecipeGrid - 食谱网格布局组件
 *
 * 功能：
 * - 双列响应式网格布局
 * - 支持虚拟滚动优化大数据量渲染 (100+ 项)
 * - 自动分配食谱到左右两列
 * - 动态高度测量支持
 *
 * 性能优化点：
 * - 使用 shallowRef 避免深层响应式转换
 * - 增量更新列分配算法
 * - 虚拟滚动器动态导入 + 一次性初始化
 * - IntersectionObserver 独立设置，不依赖虚拟滚动器状态
 */
import type { Recipe } from '~/types'
import type { Virtualizer } from '~/types/virtualizer'

const props = withDefaults(defineProps<{
  recipes: Recipe[]
  useVirtualScrolling?: boolean
  hasMore?: boolean
  loadingMore?: boolean
}>(), {
  useVirtualScrolling: false,
  hasMore: true,
  loadingMore: false,
})

const emit = defineEmits<{
  loadMore: []
}>()

// 虚拟滚动上下文 - 供子组件检测是否处于虚拟滚动模式
provide('isVirtualScrolling', props.useVirtualScrolling)

const scrollContainerRef = ref<HTMLElement | null>(null)

// 虚拟列 ref - 用于同步滚动状态
const leftColumnRef = ref<{ syncVirtualizer: () => void } | null>(null)
const rightColumnRef = ref<{ syncVirtualizer: () => void } | null>(null)

// 虚拟滚动器实例
const leftVirtualizer = shallowRef<Virtualizer | null>(null)
const rightVirtualizer = shallowRef<Virtualizer | null>(null)

const COLUMN_GAP = 16
const CARD_HEIGHT = 280
const ESTIMATED_CARD_SIZE = CARD_HEIGHT + COLUMN_GAP

// 双列布局 - 使用 shallowRef 避免深层响应式转换
const columnRecipes = shallowRef({ left: [] as Recipe[], right: [] as Recipe[] })

// 列高度追踪（用于平衡分布）
interface ColumnState {
  recipes: Recipe[]
  totalHeight: number
}

const recalculateColumns = (oldLength = 0) => {
  const totalLength = props.recipes.length

  // 新增数量超过阈值时使用全量重计算
  const newItems = totalLength - oldLength
  // 阈值提高到 50，减少频繁全量重算对滚动性能的影响
  // PAGE_SIZE=20，所以单页加载不会触发全量重算
  const useFullRecalc = oldLength === 0 || newItems > 50 || newItems > oldLength

  if (useFullRecalc) {
    // 最短列优先算法 - 减少列高差异，提升虚拟滚动效率
    const left: Recipe[] = []
    const right: Recipe[] = []
    let leftHeight = 0
    let rightHeight = 0

    for (let i = 0; i < totalLength; i++) {
      const recipe = props.recipes[i]
      // 估算卡片高度（实际高度在 measureElement 中测量）
      const estimatedHeight = ESTIMATED_CARD_SIZE

      if (leftHeight <= rightHeight) {
        left.push(recipe)
        leftHeight += estimatedHeight
      } else {
        right.push(recipe)
        rightHeight += estimatedHeight
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
    recalculateColumns(oldLength)
  } else {
    // 删除场景：重新分配两列食谱
    // 优化：使用 Map 快速查找删除的食谱，避免 filter 遍历整个数组
    const currentIds = new Set(props.recipes.map(r => r.id))
    const prevIds = new Set(columnRecipes.value.left.concat(columnRecipes.value.right).map(r => r.id))

    // 找出被删除的 id（存在于旧集合但不存在于新集合）
    const deletedIds = new Set<string>()
    for (const id of prevIds) {
      if (!currentIds.has(id)) {
        deletedIds.add(id)
      }
    }

    // 如果没有删除（理论上不应该发生），跳过
    if (deletedIds.size === 0) return

    // 增量删除：如果删除比例小于50%，尝试保留现有分配
    const deleteRatio = deletedIds.size / (oldLength || 1)
    if (deleteRatio < 0.5) {
      // 保留现有分配模式：过滤掉被删除的食谱
      const left = columnRecipes.value.left.filter(r => !deletedIds.has(r.id))
      const right = columnRecipes.value.right.filter(r => !deletedIds.has(r.id))
      columnRecipes.value = { left, right }
    } else {
      // 删除过多时全量重算
      recalculateColumns(0)
    }
  }
}, { immediate: true })

// 动态高度测量 - 完全使用 ResizeObserver 异步测量，避免任何强制重排
// 缓存测量结果，避免重复计算
// 限制缓存大小防止内存泄漏（LRU策略）
const MAX_MEASURED_HEIGHTS = 500
const measuredHeights = new Map<HTMLElement, number>()

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

  // 批量淘汰：只在缓存满时才执行，每批最多淘汰一次
  if (measuredHeights.size > MAX_MEASURED_HEIGHTS) {
    evictOldEntries()
  }

  // 清理超时的 pending 测量（超过5秒未返回的视为失败）
  if (pendingMeasures.size > 10) {
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

const evictOldEntries = () => {
  if (isEvicting) return
  isEvicting = true

  // 超过上限时，删除最老的 20% 条目
  const targetSize = Math.floor(MAX_MEASURED_HEIGHTS * 0.8)
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

  // 单次查询获取缓存高度，只有缓存不存在或待处理时才继续
  const cached = measuredHeights.get(el)
  if (cached !== undefined && !pendingMeasures.has(el)) {
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

// 清理指定元素的测量缓存
const cleanupElementObserver = (el: HTMLElement) => {
  measuredHeights.delete(el)
  pendingMeasures.delete(el)
  elementsBeingObserved.delete(el)
  lruMap.delete(el)
}

// 初始化虚拟滚动器 - 一次性完成，不重复调用
const initVirtualizers = async () => {
  if (!scrollContainerRef.value) return
  if (leftVirtualizer.value && rightVirtualizer.value) return // 已初始化

  const { useVirtualizer } = await loadVirtualizer()

  leftVirtualizer.value = useVirtualizer({
    count: columnRecipes.value.left.length,
    getScrollElement: () => scrollContainerRef.value,
    estimateSize: () => ESTIMATED_CARD_SIZE,
    measureElement,
    overscan: 5,
  })

  rightVirtualizer.value = useVirtualizer({
    count: columnRecipes.value.right.length,
    getScrollElement: () => scrollContainerRef.value,
    estimateSize: () => ESTIMATED_CARD_SIZE,
    measureElement,
    overscan: 5,
  })
  // child component's watcher will sync automatically via its own watcher
}

// 监听列长度变化，批量更新虚拟滚动器
const leftLength = computed(() => columnRecipes.value.left.length)
const rightLength = computed(() => columnRecipes.value.right.length)

// 上次更新时的长度 - 用于检测真正变化
let lastLeftLength = 0
let lastRightLength = 0

// 批量更新标志 - 避免在同一个 tick 中多次调用 setOptions
let pendingUpdate = false

watch([leftLength, rightLength], ([leftLen, rightLen]) => {
  if (!props.useVirtualScrolling) return
  if (!leftVirtualizer.value || !rightVirtualizer.value) return

  // 检测是否有任何列需要更新
  const needsLeftUpdate = leftLen !== lastLeftLength
  const needsRightUpdate = rightLen !== lastRightLength

  // 如果两者都没变化，跳过
  if (!needsLeftUpdate && !needsRightUpdate) return

  // 批量更新：使用 RAF 延迟到下一帧，避免在同一个 tick 中多次调用 setOptions
  if (pendingUpdate) return
  pendingUpdate = true

  requestAnimationFrame(() => {
    pendingUpdate = false
    // 重新检查当前值
    const currentLeft = columnRecipes.value.left.length
    const currentRight = columnRecipes.value.right.length
    if (currentLeft !== lastLeftLength && leftVirtualizer.value) {
      leftVirtualizer.value.setOptions({ count: currentLeft })
      lastLeftLength = currentLeft
    }
    if (currentRight !== lastRightLength && rightVirtualizer.value) {
      rightVirtualizer.value.setOptions({ count: currentRight })
      lastRightLength = currentRight
    }
  })
})

watch(() => props.useVirtualScrolling, (useVirtual) => {
  if (useVirtual) {
    requestAnimationFrame(() => initVirtualizers())
  }
})

onMounted(() => {
  if (props.useVirtualScrolling) {
    nextTick(() => initVirtualizers())
  }
})

// 虚拟滚动启用时设置滚动同步
watch(() => props.useVirtualScrolling, (useVirtual) => {
  if (useVirtual) {
    nextTick(() => {
      setupScrollSync()
    })
  } else {
    cleanupScrollSync()
  }
}, { immediate: true })

// 滚动同步 - 使用 RAF + 像素阈值节流获得更好的帧率
let rafId: number | null = null

// 上次滚动的垂直偏移量 - 用于检测滚动位置是否真正变化
let lastScrollTop = -1

// 滚动变化像素阈值 - 减少轻微滚动的更新频率
const SCROLL_PIXEL_THRESHOLD = 5

const onScrollSync = () => {
  const scrollTop = scrollContainerRef.value?.scrollTop ?? -1

  // 滚动位置变化未超过阈值，跳过同步
  if (Math.abs(scrollTop - lastScrollTop) < SCROLL_PIXEL_THRESHOLD) {
    return
  }

  lastScrollTop = scrollTop

  // 如果已有 RAF 在队列中，跳过
  if (rafId !== null) return

  rafId = requestAnimationFrame(() => {
    rafId = null
    // 直接使用 lastScrollTop（闭包中的值）
    leftColumnRef.value?.syncVirtualizer(lastScrollTop)
    rightColumnRef.value?.syncVirtualizer(lastScrollTop)
  })
}

const setupScrollSync = () => {
  if (!scrollContainerRef.value) return
  lastScrollTop = -1  // 重置滚动位置状态
  scrollContainerRef.value.addEventListener('scroll', onScrollSync, { passive: true })
}

const cleanupScrollSync = () => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  if (scrollContainerRef.value) {
    scrollContainerRef.value.removeEventListener('scroll', onScrollSync)
  }
  lastScrollTop = -1  // 重置滚动位置状态
}

onUnmounted(() => {
  if (leftVirtualizer.value) {
    leftVirtualizer.value.unmount()
    leftVirtualizer.value = null
  }
  if (rightVirtualizer.value) {
    rightVirtualizer.value.unmount()
    rightVirtualizer.value = null
  }
  // 清理全局 ResizeObserver
  if (globalResizeObserver) {
    globalResizeObserver.disconnect()
    globalResizeObserver = null
  }
  elementsBeingObserved.clear()
  measuredHeights.clear()
  pendingMeasures.clear()
  lruMap.clear()
  cleanupScrollSync()
})
</script>

<template>
  <!-- 虚拟滚动模式 - 仅使用 useVirtualScrolling 判断，因为虚拟滚动初始化需要先渲染容器 -->
  <div v-if="useVirtualScrolling" ref="scrollContainerRef" class="flex gap-4 md:gap-5 h-[calc(100vh-200px)] overflow-auto" style="contain: layout;">
    <template v-if="leftVirtualizer && rightVirtualizer">
      <RecipeGridVirtualColumn
        ref="leftColumnRef"
        :recipes="columnRecipes.left"
        :virtualizer="leftVirtualizer"
      />
      <RecipeGridVirtualColumn
        ref="rightColumnRef"
        :recipes="columnRecipes.right"
        :virtualizer="rightVirtualizer"
      />
    </template>
    <!-- 虚拟滚动加载中状态 - 2列骨架屏布局 -->
    <div v-else class="flex gap-4 md:gap-5 flex-1">
      <div class="flex-1 flex flex-col gap-4 md:gap-5">
        <div v-for="n in 3" :key="`skeleton-left-${n}`" class="bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm animate-pulse">
          <div class="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600 relative overflow-hidden">
            <div class="shimmer-bar"></div>
          </div>
          <div class="p-4 space-y-3">
            <div class="h-4 bg-gray-200 dark:bg-stone-700 rounded-lg w-3/4 relative overflow-hidden">
              <div class="shimmer-bar"></div>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-stone-700 rounded-lg w-1/2 relative overflow-hidden">
              <div class="shimmer-bar"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex-1 flex flex-col gap-4 md:gap-5">
        <div v-for="n in 3" :key="`skeleton-right-${n}`" class="bg-white dark:bg-stone-800 rounded-2xl overflow-hidden shadow-sm animate-pulse">
          <div class="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600 relative overflow-hidden">
            <div class="shimmer-bar"></div>
          </div>
          <div class="p-4 space-y-3">
            <div class="h-4 bg-gray-200 dark:bg-stone-700 rounded-lg w-3/4 relative overflow-hidden">
              <div class="shimmer-bar"></div>
            </div>
            <div class="h-3 bg-gray-200 dark:bg-stone-700 rounded-lg w-1/2 relative overflow-hidden">
              <div class="shimmer-bar"></div>
            </div>
          </div>
        </div>
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
.shimmer-bar {
  @apply absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .shimmer-bar {
    animation: none;
  }

  .animate-pulse {
    animation: none;
  }
}
</style>
