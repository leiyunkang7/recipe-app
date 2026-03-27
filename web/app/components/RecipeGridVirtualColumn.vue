<script setup lang="ts">
import type { Recipe } from '~/types'
import type { Virtualizer } from '~/types/virtualizer'

const props = defineProps<{
  recipes: Recipe[]
  virtualizer: Virtualizer | null
}>()

// 虚拟项缓存 - 避免每次滚动都创建新数组
// getVirtualItems() 返回的数组虽然引用相同，但内容会变化
// 使用 markRaw 避免 Vue 对数组元素进行深层响应式追踪
const cachedVirtualItems = shallowRef<ReturnType<Virtualizer['getVirtualItems']>>([])

// totalSize 缓存 - 只在容器大小变化时更新
const cachedTotalSize = ref(0)

// 监听 virtualizer 变化，更新缓存
watch(() => props.virtualizer, (virtualizer) => {
  if (virtualizer) {
    cachedVirtualItems.value = markRaw(virtualizer.getVirtualItems())
    cachedTotalSize.value = virtualizer.getTotalSize()
  } else {
    cachedVirtualItems.value = []
    cachedTotalSize.value = 0
  }
}, { immediate: true })

// 手动同步虚拟项 - 由父组件在需要时调用
const syncVirtualizer = () => {
  if (!props.virtualizer) return
  cachedVirtualItems.value = markRaw(props.virtualizer.getVirtualItems())
  cachedTotalSize.value = props.virtualizer.getTotalSize()
}

// 暴露同步方法给父组件
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
        v-for="virtualRow in cachedVirtualItems"
        :key="virtualRow.key"
        v-memo="[virtualRow.key, virtualRow.start, virtualRow.size]"
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
