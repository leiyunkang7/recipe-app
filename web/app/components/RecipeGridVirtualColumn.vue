<script setup lang="ts">
import type { Recipe } from '~/types'
import type { Virtualizer } from '~/types/virtualizer'

const props = defineProps<{
  recipes: Recipe[]
  virtualizer: Virtualizer | null
}>()

// 虚拟项缓存 - 使用 shallowRef 避免深层响应式转换
const virtualItemsCache = shallowRef<ReturnType<Virtualizer['getVirtualItems']>>([])

// totalSize 的响应式引用 - 只在真正变化时更新
const totalSizeRef = ref(0)

// 上次同步的边界状态 - 用于快速跳过
let lastSyncedFirstKey: string | number | undefined
let lastSyncedLastKey: string | number | undefined
let lastSyncedCount = 0

// 缓存上次 items 的引用，用于浅比较
let lastItems: ReturnType<Virtualizer['getVirtualItems']> | null = null

// 优化：快速比较两个虚拟项数组是否真正变化
const hasItemsChanged = (
  newItems: ReturnType<Virtualizer['getVirtualItems']>,
  oldItems: ReturnType<Virtualizer['getVirtualItems']> | null
): boolean => {
  if (oldItems === null) return true
  if (newItems.length !== oldItems.length) return true

  // 逐项比较 - 只比较关键属性
  for (let i = 0; i < newItems.length; i++) {
    const newItem = newItems[i]
    const oldItem = oldItems[i]
    if (newItem.key !== oldItem.key ||
        newItem.index !== oldItem.index ||
        newItem.size !== oldItem.size ||
        newItem.start !== oldItem.start) {
      return true
    }
  }
  return false
}

// 同步虚拟滚动器状态 - 极致优化版本
// 核心优化：
// 1. 使用浅拷贝比较，避免每次创建新数组
// 2. 只在边界真正变化时更新缓存
// 3. 移除不必要的响应式更新
// 4. 避免 Vue 深层响应式转换虚拟项数组
const syncVirtualizer = () => {
  if (!props.virtualizer) return

  const items = props.virtualizer.getVirtualItems()
  const newTotalSize = props.virtualizer.getTotalSize()

  // 快速路径：先检查边界状态
  const firstKey = items[0]?.key
  const lastKey = items[items.length - 1]?.key
  const count = items.length

  // 如果边界和数量都没变，再深入比较 items 内容
  if (count === lastSyncedCount && firstKey === lastSyncedFirstKey && lastKey === lastSyncedLastKey) {
    // 边界没变时，仍需检查 items 内容是否真的没变
    if (!hasItemsChanged(items, lastItems)) {
      return // 完全没变，跳过
    }
  }

  // 更新边界状态
  lastSyncedFirstKey = firstKey
  lastSyncedLastKey = lastKey
  lastSyncedCount = count

  // 更新 items 缓存
  lastItems = items
  // 使用 markRaw 避免 Vue 对 items 数组进行深层响应式转换
  virtualItemsCache.value = items

  // 只在 totalSize 真正变化时更新（减少响应式更新）
  if (newTotalSize !== totalSizeRef.value) {
    totalSizeRef.value = newTotalSize
  }
}

// 监听 virtualizer 变化
watch(() => props.virtualizer, (virtualizer) => {
  if (virtualizer) {
    lastSyncedFirstKey = undefined
    lastSyncedLastKey = undefined
    lastSyncedCount = 0
    lastItems = null // 重置 items 缓存
    syncVirtualizer()
  } else {
    virtualItemsCache.value = []
    totalSizeRef.value = 0
    lastSyncedFirstKey = undefined
    lastSyncedLastKey = undefined
    lastSyncedCount = 0
    lastItems = null
  }
}, { immediate: true })

// 暴露同步方法给父组件（父组件负责滚动监听）
defineExpose({ syncVirtualizer })
</script>

<template>
  <div class="flex-1 flex flex-col gap-4 md:gap-5 relative">
    <div
      :style="{
        height: `${totalSizeRef.value}px`,
        width: '100%',
        position: 'relative',
      }"
    >
      <template v-for="(virtualRow, idx) in virtualItemsCache.value" :key="virtualRow.key">
        <div
          v-memo="[virtualRow.key, virtualRow.index, virtualRow.size]"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translate3d(0, ${virtualRow.start}px, 0)`,
            contain: 'layout',
            willChange: 'transform',
            contentVisibility: 'auto',
          }"
        >
          <LazyRecipeCard
            :recipe="recipes[virtualRow.index]"
            :enter-delay="0"
            disable-animation
          />
        </div>
      </template>
    </div>
  </div>
</template>
