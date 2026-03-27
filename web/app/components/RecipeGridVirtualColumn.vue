<script setup lang="ts">
import type { Recipe } from '~/types'
import type { Virtualizer } from '~/types/virtualizer'

const props = defineProps<{
  recipes: Recipe[]
  virtualizer: Virtualizer | null
}>()

// 虚拟项缓存 - 使用 markRaw 避免响应式转换开销
let cachedVirtualItems: ReturnType<Virtualizer['getVirtualItems']> = []
let cachedTotalSize = 0

// totalSize 的响应式引用 - 只在真正需要时更新
const totalSizeRef = ref(0)

// 上次同步的边界状态
let lastSyncedFirstKey: string | number | undefined
let lastSyncedLastKey: string | number | undefined
let lastSyncedCount = 0

// 虚拟项版本号 - 用于触发模板更新
let virtualItemsVersion = 0

// 虚拟项列表 - 直接返回缓存，不通过 computed 包装减少追踪开销
const getVirtualItems = () => cachedVirtualItems

// 同步虚拟滚动器状态 - 高性能版本
// 核心优化：使用 markRaw 避免数组响应式转换，只在必要时触发更新
const syncVirtualizer = () => {
  if (!props.virtualizer) return

  const items = props.virtualizer.getVirtualItems()
  const totalSize = props.virtualizer.getTotalSize()

  const firstKey = items[0]?.key
  const lastKey = items[items.length - 1]?.key
  const count = items.length

  // 快速路径：边界键和计数都没变，完全跳过处理
  if (count === lastSyncedCount && firstKey === lastSyncedFirstKey && lastKey === lastSyncedLastKey) {
    return
  }

  // 边界变了或数量变了 - 使用 markRaw 避免响应式转换
  cachedVirtualItems = markRaw(items)
  lastSyncedFirstKey = firstKey
  lastSyncedLastKey = lastKey
  lastSyncedCount = count

  // 只有 totalSize 变化超过阈值时才更新（减少 setOptions 调用）
  const sizeDiff = Math.abs(totalSize - cachedTotalSize)
  if (sizeDiff > 10 || (count !== lastSyncedCount && sizeDiff > 0)) {
    cachedTotalSize = totalSize
    totalSizeRef.value = totalSize
    virtualItemsVersion++
  }
}

// 监听 virtualizer 变化，更新缓存
watch(() => props.virtualizer, (virtualizer) => {
  if (virtualizer) {
    lastSyncedFirstKey = undefined
    lastSyncedLastKey = undefined
    lastSyncedCount = 0
    virtualItemsVersion++
    syncVirtualizer()
  } else {
    cachedVirtualItems = []
    cachedTotalSize = 0
    lastSyncedFirstKey = undefined
    lastSyncedLastKey = undefined
    lastSyncedCount = 0
    totalSizeRef.value = 0
    virtualItemsVersion++
  }
}, { immediate: true })

// 暴露同步方法给父组件（父组件负责滚动监听）
defineExpose({ syncVirtualizer })
</script>

<template>
  <div class="flex-1 flex flex-col gap-4 md:gap-5 relative">
    <div
      :style="{
        height: `${totalSizeRef}px`,
        width: '100%',
        position: 'relative',
      }"
    >
      <template v-for="(virtualRow, idx) in getVirtualItems()" :key="virtualRow.key">
        <div
          v-memo="[virtualRow.key, virtualRow.start, virtualRow.size]"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translate3d(0, ${virtualRow.start}px, 0)`,
            contain: 'layout',
            willChange: 'transform',
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
