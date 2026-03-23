<script setup lang="ts">
/**
 * ErrorBoundary - Vue 错误边界组件
 * 
 * 功能：
 * - 捕获子组件渲染错误，防止整个应用崩溃
 * - 显示友好的错误提示 UI
 * - 支持重试功能
 * - 支持自定义 fallback 插槽
 * - 错误日志记录
 * 
 * 使用方式：
 * <ErrorBoundary>
 *   <可能出错的组件 />
 * </ErrorBoundary>
 */

interface Props {
  showDetails?: boolean
  fallbackMessage?: string
  preserveState?: boolean
  level?: 'component' | 'all'
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: import.meta.env.DEV,
  preserveState: true,
  level: 'component',
})

const emit = defineEmits<{
  error: [error: Error, errorInfo: { component: string; props: Record<string, unknown> }]
  recovered: []
}>()

const {
  hasError,
  errorMessage,
  errorDetails,
  errorComponent,
  capturedError,
  handleRetry,
} = useErrorBoundary({
  showDetails: props.showDetails,
  fallbackMessage: props.fallbackMessage,
  level: props.level,
})

const resetError = () => {
  handleRetry()
  emit('recovered')
}
</script>

<template>
  <div class="error-boundary">
    <slot v-if="!hasError" />

    <ErrorDisplay
      v-else
      :error-message="errorMessage"
      :error-details="errorDetails"
      :error-component="errorComponent"
      :show-details="showDetails"
      @retry="resetError"
    />

    <slot v-if="hasError" name="fallback" :error="capturedError" :reset="resetError" />
  </div>
</template>

<style scoped>
.error-boundary {
  display: contents;
}
</style>
