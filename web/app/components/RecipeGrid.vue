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
 * 使用方式：
 * <RecipeGrid :recipes="recipes" :use-virtual-scrolling="true" />
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

// Dynamic import for virtual scrolling - only loaded when needed (100+ items)
const leftVirtualizer = ref<Virtualizer | null>(null)
const rightVirtualizer = ref<Virtualizer | null>(null)

const COLUMN_GAP = 16
const CARD_HEIGHT = 280
const ESTIMATED_CARD_SIZE = CARD_HEIGHT + COLUMN_GAP

// 双列布局 - 使用 shallowRef 避免深层响应式转换
// 只有当 recipes.length 真正变化时才重新计算
const columnRecipes = shallowRef({ left: [] as Recipe[], right: [] as Recipe[] })

// 追踪上次的长度，只处理新增的项
let previousLength = 0

const recalculateColumns = (oldLength = 0) => {
  const newItems = props.recipes.slice(oldLength)
  const leftNew: Recipe[] = []
  const rightNew: Recipe[] = []

  // 增量更新：只处理新增的项，使用奇偶索引分配到对应列
  for (let i = 0; i < newItems.length; i++) {
    const globalIndex = oldLength + i
    if (globalIndex % 2 === 0) {
      leftNew.push(newItems[i])
    } else {
      rightNew.push(newItems[i])
    }
  }

  columnRecipes.value = {
    left: oldLength === 0 ? leftNew : [...columnRecipes.value.left, ...leftNew],
    right: oldLength === 0 ? rightNew : [...columnRecipes.value.right, ...rightNew],
  }
  previousLength = props.recipes.length
}

// 监听 recipes.length 变化，只在长度变化时重算
watch(() => props.recipes.length, (newLength, oldLength) => {
  if (newLength === oldLength) return

  if (newLength > oldLength) {
    // 追加模式：增量添加
    recalculateColumns(oldLength)
  } else {
    // 缩减模式：重新计算
    recalculateColumns(0)
  }
}, { immediate: true })

// 动态高度测量 - 使用 offsetHeight 避免触发重排
// 使用 WeakMap 替代 Map，允许垃圾回收被移除的元素
const measuredHeights = new WeakMap<HTMLElement, number>()

const measureElement = (el: HTMLElement | null) => {
  if (!el) return ESTIMATED_CARD_SIZE

  // Check cache first
  const cached = measuredHeights.get(el)
  if (cached !== undefined) return cached

  // offsetHeight 不会触发重排，比 getBoundingClientRect 性能更好
  const height = el.offsetHeight || CARD_HEIGHT
  const measuredSize = height + COLUMN_GAP
  measuredHeights.set(el, measuredSize)

  return measuredSize
}

const initVirtualizers = async () => {
  if (!scrollContainerRef.value) return

  // Dynamic import @tanstack/vue-virtual only when virtual scrolling is enabled
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
}

// 监听列长度变化，精确触发虚拟滚动更新（避免监听整个对象引用）
// 使用 prevLengths 追踪上次值，避免长度未变化时的不必要更新
const prevLengths = ref({ left: 0, right: 0 })

watch(
  () => [columnRecipes.value.left.length, columnRecipes.value.right.length],
  ([leftLen, rightLen]) => {
    if (!props.useVirtualScrolling) return

    // Skip if lengths haven't changed (avoids unnecessary nextTick + virtualizer updates)
    if (leftLen === prevLengths.value.left && rightLen === prevLengths.value.right) return
    prevLengths.value = { left: leftLen, right: rightLen }

    nextTick(() => {
      if (!scrollContainerRef.value) return

      if (!leftVirtualizer.value || !rightVirtualizer.value) {
        initVirtualizers()
        return
      }

      leftVirtualizer.value.setOptions({ count: leftLen })
      rightVirtualizer.value.setOptions({ count: rightLen })
    })
  }
)

// 监听虚拟滚动开关变化
watch(() => props.useVirtualScrolling, (useVirtual) => {
  if (useVirtual) {
    nextTick(() => {
      if (scrollContainerRef.value && !leftVirtualizer.value) {
        initVirtualizers()
      }
    })
  }
})

onMounted(() => {
  if (props.useVirtualScrolling) {
    nextTick(() => initVirtualizers())
  }
})

// 虚拟滚动模式下的无限滚动 - 监听滚动容器底部
// 使用 IntersectionObserver 观察虚拟滚动列的底部
let virtualScrollObserver: IntersectionObserver | null = null

const setupVirtualScrollObserver = () => {
  if (!scrollContainerRef.value || !props.useVirtualScrolling) return

  virtualScrollObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && props.hasMore && !props.loadingMore) {
      emit('loadMore')
    }
  }, {
    threshold: 0,
    root: scrollContainerRef.value,
  })

  // 观察滚动容器底部
  if (loadMoreTriggerRef.value) {
    virtualScrollObserver.observe(loadMoreTriggerRef.value)
  }
}

const cleanupVirtualScrollObserver = () => {
  if (virtualScrollObserver) {
    virtualScrollObserver.disconnect()
    virtualScrollObserver = null
  }
}

// 在虚拟滚动模式下，当虚拟化器准备好后设置观察器
watch([leftVirtualizer, rightVirtualizer], ([left, right]) => {
  if (left && right && props.useVirtualScrolling) {
    nextTick(() => {
      cleanupVirtualScrollObserver()
      setupVirtualScrollObserver()
    })
  }
})

onUnmounted(() => {
  // 清理虚拟滚动器
  if (leftVirtualizer.value) {
    leftVirtualizer.value.unmount()
    leftVirtualizer.value = null
  }
  if (rightVirtualizer.value) {
    rightVirtualizer.value.unmount()
    rightVirtualizer.value = null
  }
  // 清理观察器
  cleanupVirtualScrollObserver()
})
</script>

<template>
  <!-- 虚拟滚动模式 - 仅使用 useVirtualScrolling 判断，因为虚拟滚动初始化需要先渲染容器 -->
  <div v-if="useVirtualScrolling" ref="scrollContainerRef" class="flex gap-4 md:gap-5 h-[calc(100vh-200px)] overflow-auto">
    <template v-if="leftVirtualizer && rightVirtualizer">
      <RecipeGridVirtualColumn
        :recipes="columnRecipes.left"
        :virtualizer="leftVirtualizer"
      />
      <RecipeGridVirtualColumn
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
