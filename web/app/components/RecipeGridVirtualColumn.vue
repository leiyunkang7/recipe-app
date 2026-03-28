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

// 列可见性检测 - 跳过不可见列的更新
const columnRef = ref<HTMLElement | null>(null)
let isVisible = true

// 监听列可见性变化
onMounted(() => {
  if (!columnRef.value) return

  const observer = new IntersectionObserver((entries) => {
    isVisible = entries[0].isIntersecting
  }, { threshold: 0 })

  observer.observe(columnRef.value)

  onUnmounted(() => observer.disconnect())
})

// 上次同步的边界状态 - 用于快速跳过
let lastSyncedFirstKey: string | number | undefined
let lastSyncedLastKey: string | number | undefined
let lastSyncedCount = 0
// 上次同步的 totalSize - 用于检测是否真的需要更新
let lastSyncedTotalSize = 0
// 上次同步的滚动偏移量 - 用于检测是否真的需要同步
let lastSyncedScrollTop = -1

// 同步虚拟滚动器状态 - 父组件 RAF 调度，子组件直接更新
// 核心优化：
// 1. 先检测 scrollTop 是否真的变了，没变则跳过
// 2. 调用 update() 后再检查首尾边界，边界没变则跳过
// 3. 跳过不可见列的 update() 调用
// 4. v-memo 使用 [key, index, start] 避免 transform 变化时跳过子组件更新
// 5. 移除子组件 RAF，由父组件统一调度
const syncVirtualizer = (scrollTop: number) => {
  if (!props.virtualizer) return

  // 跳过不可见列的更新 - 避免不必要的测量计算
  if (!isVisible) return

  // 滚动位置没变，跳过同步
  if (scrollTop === lastSyncedScrollTop) return
  lastSyncedScrollTop = scrollTop

  // 手动触发虚拟滚动器更新（重新计算可见项和测量）
  props.virtualizer.update()

  const items = props.virtualizer.getVirtualItems()
  const newTotalSize = props.virtualizer.getTotalSize()

  const firstKey = items[0]?.key
  const lastKey = items[items.length - 1]?.key
  const count = items.length

  // totalSize 没变且边界没变时，跳过更新
  if (newTotalSize === lastSyncedTotalSize && count === lastSyncedCount && firstKey === lastSyncedFirstKey && lastKey === lastSyncedLastKey) {
    return
  }

  // 更新边界状态
  lastSyncedFirstKey = firstKey
  lastSyncedLastKey = lastKey
  lastSyncedCount = count
  lastSyncedTotalSize = newTotalSize

  // 批量更新
  totalSizeRef.value = newTotalSize
  virtualItemsCache.value = items
}

// 监听 virtualizer 变化
watch(() => props.virtualizer, (virtualizer) => {
  if (virtualizer) {
    lastSyncedFirstKey = undefined
    lastSyncedLastKey = undefined
    lastSyncedCount = 0
    lastSyncedTotalSize = 0
    lastSyncedScrollTop = -1
  } else {
    virtualItemsCache.value = []
    totalSizeRef.value = 0
    lastSyncedFirstKey = undefined
    lastSyncedLastKey = undefined
    lastSyncedCount = 0
    lastSyncedTotalSize = 0
    lastSyncedScrollTop = -1
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
        contain: 'content',
      }"
    >
      <template v-for="virtualRow in virtualItemsCache" :key="virtualRow.key">
        <div
          v-memo="[virtualRow.key, virtualRow.index]"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
            contain: 'content',
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
