<script setup lang="ts">
import type { Recipe } from '~/types'
import type { Virtualizer } from '~/types/virtualizer'

const props = defineProps<{
  recipes: Recipe[]
  virtualizer: Virtualizer | null
}>()

// 使用普通变量存储虚拟项缓存 - 避免 shallowRef 的开销
// 只有当内容真正变化时才触发响应式更新
let cachedVirtualItems: ReturnType<Virtualizer['getVirtualItems']> = []
let cachedTotalSize = 0

// totalSize 的响应式引用 - 只在真正需要时更新
const totalSizeRef = ref(0)

// 上次同步的状态 - 使用原始值比较避免每次创建 Set
let lastSyncedFirstKey: string | number | undefined
let lastSyncedLastKey: string | number | undefined
let lastSyncedCount = 0

// 虚拟项数据的响应式触发器 - 只在项数组引用变化时触发
const virtualItemsVersion = ref(0)

// 虚拟项列表 - 通过 virtualItemsVersion 缓存版本
const virtualItemsList = computed(() => {
  // 依赖 virtualItemsVersion 以触发更新
  virtualItemsVersion.value
  return cachedVirtualItems
})

// 同步虚拟滚动器状态 - 高度优化版本
// 核心思路：只在边界键变化时才更新，忽略内部的微小变化
const syncVirtualizer = () => {
  if (!props.virtualizer) return

  const items = props.virtualizer.getVirtualItems()
  const totalSize = props.virtualizer.getTotalSize()

  // 边界键
  const firstKey = items[0]?.key
  const lastKey = items[items.length - 1]?.key
  const count = items.length

  // 快速路径：边界键和计数都没变，说明可见项完全没变
  // 这是最常见的情况（用户缓慢滚动）
  if (count === lastSyncedCount && firstKey === lastSyncedFirstKey && lastKey === lastSyncedLastKey) {
    // 只有 totalSize 变化（卡片高度测量后）时才更新
    if (totalSize === cachedTotalSize) return
    cachedTotalSize = totalSize
    totalSizeRef.value = totalSize
    return
  }

  // 边界变了但数量相同 - 可能是滚动导致的正常位移，跳过内部检查
  // 只有当 firstKey 或 lastKey 与缓存不同时才需要更新
  if (count === lastSyncedCount && (firstKey !== lastSyncedFirstKey || lastKey !== lastSyncedLastKey)) {
    cachedVirtualItems = items
    cachedTotalSize = totalSize
    lastSyncedFirstKey = firstKey
    lastSyncedLastKey = lastKey
    totalSizeRef.value = totalSize
    virtualItemsVersion.value++
    return
  }

  // 数量变了（加载更多或删除）- 需要完全更新
  cachedVirtualItems = items
  cachedTotalSize = totalSize
  lastSyncedFirstKey = firstKey
  lastSyncedLastKey = lastKey
  lastSyncedCount = count
  totalSizeRef.value = totalSize
  virtualItemsVersion.value++
}

// 监听 virtualizer 变化，更新缓存
watch(() => props.virtualizer, (virtualizer) => {
  if (virtualizer) {
    lastSyncedFirstKey = undefined
    lastSyncedLastKey = undefined
    lastSyncedCount = 0
    syncVirtualizer()
  } else {
    cachedVirtualItems = []
    cachedTotalSize = 0
    lastSyncedFirstKey = undefined
    lastSyncedLastKey = undefined
    lastSyncedCount = 0
    totalSizeRef.value = 0
    virtualItemsVersion.value++
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
      <template v-for="(virtualRow, idx) in virtualItemsList" :key="virtualRow.key">
        <div
          v-memo="[virtualRow.key, virtualRow.start, virtualRow.size, recipes[virtualRow.index]?.id]"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translate3d(0, ${virtualRow.start}px, 0)`,
            contain: 'layout',
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
