<script setup lang="ts">
/**
 * ResponsiveContainer - 响应式布局容器
 * 
 * 提供一致的响应式布局规则：
 * - 移动端：全宽 + 水平内边距
 * - 平板：最大宽度 + 居中
 * - 桌面：更大最大宽度 + 更多内边距
 */

interface Props {
  /** 尺寸变体 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** 是否禁用默认内边距 */
  noPadding?: boolean
  /** 自定义类名 */
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'lg',
  noPadding: false,
  className: '',
})

// 尺寸对应的 max-width
const sizeClasses = {
  sm: 'max-w-screen-sm',   // 640px
  md: 'max-w-screen-md',   // 768px
  lg: 'max-w-screen-lg',   // 1024px
  xl: 'max-w-screen-xl',   // 1280px
  full: 'max-w-none',      // 无限制
}

// 响应式内边距
const paddingClasses = computed(() => {
  if (props.noPadding) return ''
  return 'px-3 sm:px-4 md:px-6 lg:px-8'
})

const containerClasses = computed(() => [
  'mx-auto w-full',
  sizeClasses[props.size],
  paddingClasses.value,
  props.className,
].filter(Boolean).join(' '))
</script>

<template>
  <div :class="containerClasses">
    <slot />
  </div>
</template>
