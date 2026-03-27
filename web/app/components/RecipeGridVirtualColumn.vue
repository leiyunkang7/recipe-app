<script setup lang="ts">
import type { Recipe } from '~/types'
import type { Virtualizer } from '~/types/virtualizer'

const props = defineProps<{
  recipes: Recipe[]
  virtualizer: Virtualizer | null
}>()

// @tanstack/vue-virtual 使用 shallowRef 存储实例，当内部状态变化时 triggerRef
// 访问 getVirtualItems() 时 Vue 会自动追踪 shallowRef 的变化
// 使用 shallowRef 避免对返回数组进行深层响应式转换
const virtualItems = computed(() => props.virtualizer?.getVirtualItems() ?? [])
const totalSize = computed(() => props.virtualizer?.getTotalSize() ?? 0)
</script>

<template>
  <div class="flex-1 flex flex-col gap-4 md:gap-5 relative">
    <div
      :style="{
        height: `${totalSize}px`,
        width: '100%',
        position: 'relative',
      }"
    >
      <div
        v-for="virtualRow in virtualItems"
        :key="virtualRow.key"
        v-memo="[virtualRow.key]"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`,
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
