<script setup lang="ts">
/**
 * LoadingSpinner - 加载旋转动画组件
 *
 * 功能：
 * - 旋转加载动画
 * - 三种尺寸可选 (sm, md, lg)
 * - 橙色主题色
 *
 * 使用方式：
 * <LoadingSpinner size="md" />
 */
import type { SizeVariant } from '~/types/component-props'

withDefaults(defineProps<{
  size?: SizeVariant
}>(), {
  size: 'md'
})

const sizeClasses: Record<SizeVariant, string> = {
  sm: 'h-6 w-6 border-2',
  md: 'h-12 w-12 border-b-2',
  lg: 'h-16 w-16 border-3',
}
</script>

<template>
  <div class="flex justify-center items-center py-12">
    <div
      class="animate-spin rounded-full border-orange-600"
      :class="sizeClasses[size]"
    ></div>
  </div>
</template>
