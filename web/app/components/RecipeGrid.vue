<script setup lang="ts">
import type { Recipe } from '~/types'
import type { Virtualizer } from '~/types/virtualizer'

const props = defineProps<{
  recipes: Recipe[]
  useVirtualScrolling: boolean
}>()

const scrollContainerRef = ref<HTMLElement | null>(null)

// Dynamic import for virtual scrolling - only loaded when needed (100+ items)
const leftVirtualizer = ref<Virtualizer | null>(null)
const rightVirtualizer = ref<Virtualizer | null>(null)

const COLUMN_GAP = 16
const CARD_HEIGHT = 280

// 双列布局 - 单次遍历同时计算两列索引，避免多层 computed 依赖
const columnRecipes = computed(() => {
  const left: typeof props.recipes = []
  const right: typeof props.recipes = []
  for (let i = 0; i < props.recipes.length; i++) {
    (i % 2 === 0 ? left : right).push(props.recipes[i])
  }
  return { left, right }
})

// 动态高度测量
const measureElement = (el: HTMLElement | null) => {
  if (!el) return 0
  return el.getBoundingClientRect().height + COLUMN_GAP
}

const initVirtualizers = async () => {
  if (!scrollContainerRef.value) return

  // Dynamic import @tanstack/vue-virtual only when virtual scrolling is enabled
  const { useVirtualizer } = await import('@tanstack/vue-virtual')

  leftVirtualizer.value = useVirtualizer({
    count: columnRecipes.value.left.length,
    getScrollElement: () => scrollContainerRef.value,
    estimateSize: () => CARD_HEIGHT + COLUMN_GAP,
    measureElement,
    overscan: 3,
  })

  rightVirtualizer.value = useVirtualizer({
    count: columnRecipes.value.right.length,
    getScrollElement: () => scrollContainerRef.value,
    estimateSize: () => CARD_HEIGHT + COLUMN_GAP,
    measureElement,
    overscan: 3,
  })
}

// 监听 recipes 变化，触发虚拟滚动初始化（使用 nextTick 确保 DOM 已更新）
watch([columnRecipes], () => {
  if (!props.useVirtualScrolling) return

  nextTick(() => {
    if (!scrollContainerRef.value) return

    if (!leftVirtualizer.value || !rightVirtualizer.value) {
      initVirtualizers()
      return
    }

    leftVirtualizer.value.setOptions({ count: columnRecipes.value.left.length })
    rightVirtualizer.value.setOptions({ count: columnRecipes.value.right.length })
  })
})

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

onUnmounted(() => {
  if (leftVirtualizer.value) {
    leftVirtualizer.value.unmount()
    leftVirtualizer.value = null
  }
  if (rightVirtualizer.value) {
    rightVirtualizer.value.unmount()
    rightVirtualizer.value = null
  }
})
</script>

<template>
  <!-- 虚拟滚动模式 - 仅使用 useVirtualScrolling 判断，因为虚拟滚动初始化需要先渲染容器 -->
  <div v-if="useVirtualScrolling" ref="scrollContainerRef" class="flex gap-4 md:gap-5 h-[calc(100vh-200px)] overflow-auto">
    <template v-if="leftVirtualizer && rightVirtualizer">
      <RecipeGridVirtualColumn
        :recipes="columnRecipes.left"
        :virtualizer="leftVirtualizer"
        :column-gap="COLUMN_GAP"
      />
      <RecipeGridVirtualColumn
        :recipes="columnRecipes.right"
        :virtualizer="rightVirtualizer"
        :column-gap="COLUMN_GAP"
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
