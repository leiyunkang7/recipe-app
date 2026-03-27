<script setup lang="ts">
/**
 * ErrorDisplay - 错误信息展示组件
 *
 * 功能：
 * - 显示错误消息
 * - 可展开的错误详情
 * - 重试按钮
 * - 错误内容渲染
 *
 * 使用方式：
 * <ErrorDisplay
 *   :error-message="msg"
 *   :error-details="details"
 *   :show-details="true"
 *   @retry="handleRetry"
 * />
 */
defineProps<{
  errorMessage: string
  errorDetails: string
  errorComponent: string
  showDetails: boolean
}>()

const emit = defineEmits<{
  retry: []
  toggleDetails: []
}>()

const isDetailsExpanded = ref(false)

const handleToggleDetails = () => {
  isDetailsExpanded.value = !isDetailsExpanded.value
  emit('toggleDetails')
}
</script>

<template>
  <ErrorBoundaryContent
    :error-message="errorMessage"
    :error-details="errorDetails"
    :error-component="errorComponent"
    :show-details="showDetails"
    :is-details-expanded="isDetailsExpanded"
    @retry="emit('retry')"
    @toggle-details="handleToggleDetails"
  />
</template>

<style scoped>
.error-boundary-fallback {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .animate-pulse {
    animation: none;
  }

  .error-boundary-fallback {
    animation: none;
  }
}
</style>
