<script setup lang="ts">
/**
 * ErrorAlert - 错误提示 Alert 组件
 *
 * 功能：
 * - 显示错误消息
 * - 支持 dark mode
 * - 可选的包裹容器（带 padding）
 * - 可选的 margin-bottom
 *
 * 使用方式：
 * <ErrorAlert :error="errorMessage" />
 * <ErrorAlert :error="errorMessage" wrapped />
 * <ErrorAlert :error="errorMessage" no-margin />
 */
const props = withDefaults(defineProps<{
  error: string | null | undefined
  wrapped?: boolean
  noMargin?: boolean
}>(), {
  wrapped: false,
  noMargin: false,
})
</script>

<template>
  <div
    v-if="error"
    :class="[
      'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4',
      wrapped ? 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' : '',
      !noMargin ? 'mb-6' : ''
    ]"
  >
    <p class="text-red-800 dark:text-red-300">{{ error }}</p>
  </div>
</template>
