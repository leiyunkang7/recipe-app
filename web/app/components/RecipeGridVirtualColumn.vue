<script setup lang="ts">
import type { Recipe } from '~/types'
import type { Virtualizer } from '~/types/virtualizer'

const props = defineProps<{
  recipes: Recipe[]
  virtualizer: Virtualizer | null
}>()

// 虚拟项缓存 - 使用 shallowRef 避免深层响应式
const cachedVirtualItems = shallowRef<ReturnType<Virtualizer['getVirtualItems']>>([])

// totalSize 缓存
const cachedTotalSize = ref(0)

// 上次同步的状态 - 使用原始值比较避免每次创建 Set
let lastSyncedFirstKey: string | number | undefined
let lastSyncedLastKey: string | number | undefined
let lastSyncedCount = 0

// 同步虚拟滚动器状态 - 优化版本减少 GC 开销
const syncVirtualizer = () => {
  if (!props.virtualizer) return

  const items = props.virtualizer.getVirtualItems()
  const totalSize = props.virtualizer.getTotalSize()

  // 快速路径：比较边界键和计数，避免创建 Set 对象
  const firstKey = items[0]?.key
  const lastKey = items[items.length - 1]?.key
  const count = items.length

  // 如果计数和边界键都没变，认为没有变化（位置变化由 translateY 处理）
  if (count === lastSyncedCount && firstKey === lastSyncedFirstKey && lastKey === lastSyncedLastKey) {
    // 只有 totalSize 变化时才更新
    if (totalSize === cachedTotalSize.value) return
    cachedTotalSize.value = totalSize
    return
  }

  // 更新缓存
  cachedVirtualItems.value = items
  cachedTotalSize.value = totalSize
  lastSyncedFirstKey = firstKey
  lastSyncedLastKey = lastKey
  lastSyncedCount = count
}

// 监听 virtualizer 变化，更新缓存
watch(() => props.virtualizer, (virtualizer) => {
  if (virtualizer) {
    lastSyncedFirstKey = undefined
    lastSyncedLastKey = undefined
    lastSyncedCount = 0
    syncVirtualizer()
  } else {
    cachedVirtualItems.value = []
    cachedTotalSize.value = 0
    lastSyncedFirstKey = undefined
    lastSyncedLastKey = undefined
    lastSyncedCount = 0
  }
}, { immediate: true })

// 暴露同步方法给父组件（父组件负责滚动监听）
defineExpose({ syncVirtualizer })
</script>

<template>
  <div class="flex-1 flex flex-col gap-4 md:gap-5 relative">
    <div
      :style="{
        height: `${cachedTotalSize}px`,
        width: '100%',
        position: 'relative',
      }"
    >
      <div
        v-for="(virtualRow, idx) in cachedVirtualItems"
        :key="virtualRow.key"
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
    </div>
  </div>
</template>
