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

// 同步虚拟滚动器状态 - 父组件 RAF 调度，子组件直接更新
// 核心优化：
// 1. 首尾 key + count 比较判断变化，O(1) 复杂度
// 2. 只在边界真正变化时更新缓存
// 3. 手动调用 update() 确保测量数据最新
// 4. v-memo 使用 [key, index, size, start] 完整比较
// 5. 移除子组件 RAF，由父组件统一调度
const syncVirtualizer = () => {
  if (!props.virtualizer) return

  // 手动触发虚拟滚动器更新（重新计算可见项和测量）
  props.virtualizer.update()

  const items = props.virtualizer.getVirtualItems()
  const newTotalSize = props.virtualizer.getTotalSize()

  const firstKey = items[0]?.key
  const lastKey = items[items.length - 1]?.key
  const count = items.length

  // 边界没变时，跳过更新
  if (count === lastSyncedCount && firstKey === lastSyncedFirstKey && lastKey === lastSyncedLastKey) {
    return
  }

  // 更新边界状态
  lastSyncedFirstKey = firstKey
  lastSyncedLastKey = lastKey
  lastSyncedCount = count

  // 批量更新 totalSize
  if (newTotalSize !== totalSizeRef.value) {
    totalSizeRef.value = newTotalSize
  }

  // items 数组引用比较
  if (virtualItemsCache.value !== items) {
    virtualItemsCache.value = items
  }
}

// 监听 virtualizer 变化
watch(() => props.virtualizer, (virtualizer) => {
  if (virtualizer) {
    lastSyncedFirstKey = undefined
    lastSyncedLastKey = undefined
    lastSyncedCount = 0
    syncVirtualizer()
  } else {
    virtualItemsCache.value = []
    totalSizeRef.value = 0
    lastSyncedFirstKey = undefined
    lastSyncedLastKey = undefined
    lastSyncedCount = 0
  }
}, { immediate: true })

// 暴露同步方法给父组件（父组件负责滚动监听和 RAF 调度）
defineExpose({ syncVirtualizer })
</script>

<template>
  <div class="flex-1 flex flex-col gap-4 md:gap-5 relative">
    <div
      :style="{
        height: `${totalSizeRef.value}px`,
        width: '100%',
        position: 'relative',
        contain: 'layout style paint',
      }"
    >
      <template v-for="virtualRow in virtualItemsCache.value" :key="virtualRow.key">
        <div
          v-memo="[virtualRow.key, virtualRow.index, virtualRow.size, virtualRow.start]"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
            contain: 'layout style paint',
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
