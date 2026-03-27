<script setup lang="ts">
import type { Recipe } from '~/types'
import type { Virtualizer } from '~/types/virtualizer'

const props = defineProps<{
  recipes: Recipe[]
  virtualizer: Virtualizer | null
}>()

// 虚拟项缓存 - 使用普通数组避免每次scroll都创建新数组
let cachedVirtualItems: ReturnType<Virtualizer['getVirtualItems']> = []
let cachedTotalSize = 0

// totalSize 的响应式引用 - 只在真正需要时更新
const totalSizeRef = ref(0)

// 上次同步的边界状态
let lastSyncedFirstKey: string | number | undefined
let lastSyncedLastKey: string | number | undefined
let lastSyncedCount = 0

// 虚拟项数据的响应式触发器 - 只在项数组引用变化时触发
const virtualItemsVersion = ref(0)

// 虚拟项列表 - 通过 virtualItemsVersion 缓存版本
const virtualItemsList = computed(() => {
  virtualItemsVersion.value
  return cachedVirtualItems
})

// v-memo 依赖值 - 直接使用虚拟项的原始属性，避免函数调用开销
// 注意：模板中直接使用 virtualRow.key 等属性

// 同步虚拟滚动器状态 - 优化版本
// 核心优化：只在边界键变化或数量变化时才更新，避免不必要的数组创建
const syncVirtualizer = () => {
  if (!props.virtualizer) return

  const items = props.virtualizer.getVirtualItems()
  const totalSize = props.virtualizer.getTotalSize()

  const firstKey = items[0]?.key
  const lastKey = items[items.length - 1]?.key
  const count = items.length

  // 快速路径：边界键和计数都没变，完全跳过处理
  if (count === lastSyncedCount && firstKey === lastSyncedFirstKey && lastKey === lastSyncedLastKey) {
    // 即使 totalSize 变化也不更新 - 虚拟滚动器内部会处理
    return
  }

  // 边界变了或数量变了 - 更新缓存
  cachedVirtualItems = items
  lastSyncedFirstKey = firstKey
  lastSyncedLastKey = lastKey
  lastSyncedCount = count

  // 只有 totalSize 真正变化且超过阈值时才更新（避免频繁更新）
  if (Math.abs(totalSize - cachedTotalSize) > 10) {
    cachedTotalSize = totalSize
    totalSizeRef.value = totalSize
    virtualItemsVersion.value++
  } else if (count !== lastSyncedCount) {
    // 数量变化但 totalSize 变化不大，也需要更新版本以刷新列表
    virtualItemsVersion.value++
  }
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
