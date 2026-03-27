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

const scrollContainerRef = ref<HTMLElement | null>(null)
const loadMoreTriggerRef = ref<HTMLElement | null>(null)

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

// 增量更新列分配
const recalculateColumns = (oldLength = 0) => {
  const newItems = props.recipes.slice(oldLength)
  const leftNew: Recipe[] = []
  const rightNew: Recipe[] = []

  for (let i = 0; i < newItems.length; i++) {
    const globalIndex = oldLength + i
    if (globalIndex % 2 === 0) {
      leftNew.push(newItems[i])
    } else {
      rightNew.push(newItems[i])
    }
  }

  if (oldLength === 0) {
    columnRecipes.value = { left: leftNew, right: rightNew }
  } else {
    columnRecipes.value = {
      left: [...columnRecipes.value.left, ...leftNew],
      right: [...columnRecipes.value.right, ...rightNew],
    }
  }
}

watch(() => props.recipes.length, (newLength, oldLength) => {
  if (newLength === oldLength) return
  if (newLength > oldLength) {
    recalculateColumns(oldLength)
  } else {
    recalculateColumns(0)
  }
}, { immediate: true })

// 动态高度测量 - 使用 WeakMap 允许 GC
const measuredHeights = new WeakMap<HTMLElement, number>()

const measureElement = (el: HTMLElement | null) => {
  if (!el) return ESTIMATED_CARD_SIZE
  const cached = measuredHeights.get(el)
  if (cached !== undefined) return cached
  const height = el.offsetHeight || CARD_HEIGHT
  measuredHeights.set(el, height + COLUMN_GAP)
  return height + COLUMN_GAP
}

// 初始化虚拟滚动器 - 一次性完成，不重复调用
const initVirtualizers = async () => {
  if (!scrollContainerRef.value) return
  if (leftVirtualizer.value && rightVirtualizer.value) return // 已初始化

  const { useVirtualizer } = await import('@tanstack/vue-virtual')

  leftVirtualizer.value = useVirtualizer({
    count: columnRecipes.value.left.length,
    getScrollElement: () => scrollContainerRef.value,
    estimateSize: () => ESTIMATED_CARD_SIZE,
    measureElement,
    overscan: 3,
  })

  rightVirtualizer.value = useVirtualizer({
    count: columnRecipes.value.right.length,
    getScrollElement: () => scrollContainerRef.value,
    estimateSize: () => ESTIMATED_CARD_SIZE,
    measureElement,
    overscan: 3,
  })
  // child component's watcher will sync automatically via its own watcher
}

// 监听列长度变化，批量更新虚拟滚动器
const leftLength = computed(() => columnRecipes.value.left.length)
const rightLength = computed(() => columnRecipes.value.right.length)

// 合并两个 watcher 为一个，减少更新次数
// setOptions 会自动触发更新，无需手动调用 update()
watch([leftLength, rightLength], ([leftLen, rightLen]) => {
  if (!props.useVirtualScrolling) return
  if (leftVirtualizer.value) {
    leftVirtualizer.value.setOptions({ count: leftLen })
  }
  if (rightVirtualizer.value) {
    rightVirtualizer.value.setOptions({ count: rightLen })
  }
})

watch(() => props.useVirtualScrolling, (useVirtual) => {
  if (useVirtual) {
    nextTick(() => initVirtualizers())
  }
})

onMounted(() => {
  if (props.useVirtualScrolling) {
    nextTick(() => initVirtualizers())
  }
})

// 虚拟滚动模式下的无限滚动 - 独立于虚拟滚动器初始化
let virtualScrollObserver: IntersectionObserver | null = null

const setupVirtualScrollObserver = () => {
  if (!loadMoreTriggerRef.value || !scrollContainerRef.value) return

  virtualScrollObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && props.hasMore && !props.loadingMore) {
      emit('loadMore')
    }
  }, {
    threshold: 0,
    root: scrollContainerRef.value,
  })

  virtualScrollObserver.observe(loadMoreTriggerRef.value)
}

const cleanupVirtualScrollObserver = () => {
  if (virtualScrollObserver) {
    virtualScrollObserver.disconnect()
    virtualScrollObserver = null
  }
}

// 虚拟滚动启用时立即设置 Observer，不等待虚拟滚动器
watch(() => props.useVirtualScrolling, (useVirtual) => {
  if (useVirtual) {
    nextTick(() => {
      cleanupVirtualScrollObserver()
      setupVirtualScrollObserver()
      setupScrollSync()
    })
  } else {
    cleanupVirtualScrollObserver()
    cleanupScrollSync()
  }
}, { immediate: true })

// 滚动同步 - 使用时间戳节流避免频繁更新（约60fps）
let lastSyncTime = 0
const SYNC_MIN_INTERVAL = 16 // ms，约60fps

const onScrollSync = () => {
  const now = performance.now()
  if (now - lastSyncTime < SYNC_MIN_INTERVAL) return

  lastSyncTime = now
  leftColumnRef.value?.syncVirtualizer()
  rightColumnRef.value?.syncVirtualizer()
}

const setupScrollSync = () => {
  if (!scrollContainerRef.value) return
  scrollContainerRef.value.addEventListener('scroll', onScrollSync, { passive: true })
}

const cleanupScrollSync = () => {
  lastSyncTime = 0
  if (scrollContainerRef.value) {
    scrollContainerRef.value.removeEventListener('scroll', onScrollSync)
  }
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
  cleanupVirtualScrollObserver()
  cleanupScrollSync()
})
</script>

<template>
  <!-- 虚拟滚动模式 - 仅使用 useVirtualScrolling 判断，因为虚拟滚动初始化需要先渲染容器 -->
  <div v-if="useVirtualScrolling" ref="scrollContainerRef" class="flex gap-4 md:gap-5 h-[calc(100vh-200px)] overflow-auto">
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
    <!-- 虚拟滚动加载中状态 -->
    <div v-else class="flex-1 flex flex-col gap-4 md:gap-5">
      <RecipeSkeletonLoader :count="6" />
    </div>
  </div>

  <!-- 标准模式 -->
  <div v-else class="flex gap-4 md:gap-5">
    <RecipeGridColumn :recipes="columnRecipes.left" />
    <RecipeGridColumn :recipes="columnRecipes.right" :enter-delay-base="columnRecipes.left.length * 50" />
  </div>
</template>
