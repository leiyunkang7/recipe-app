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

const { t } = useI18n()

// 错误状态
const hasError = ref(false)
const errorMessage = ref('')
const errorDetails = ref('')
const errorComponent = ref('')
const retryCount = ref(0)

// 捕获错误的来源组件
const capturedError = ref<Error | null>(null)

// 错误边界核心逻辑
onErrorCaptured((error, instance, info) => {
  console.error('[ErrorBoundary] Caught error:', error)
  console.error('[ErrorBoundary] Component:', instance?.$options?.name || 'Anonymous')
  console.error('[ErrorBoundary] Error info:', info)

  if (props.level === 'component' && info !== 'componentRender') {
    return false
  }

  hasError.value = true
  errorMessage.value = props.fallbackMessage || t('errorBoundary.defaultMessage')
  errorDetails.value = props.level === 'all' ? `${error.message}\n\nStack:\n${error.stack}` : info
  errorComponent.value = instance?.$options?.name || 'Unknown'
  capturedError.value = error

  if (error instanceof Error) {
    if (error.message.includes('undefined') || error.message.includes('null')) {
      errorMessage.value = t('errorBoundary.renderError')
    } else if (error.message.includes('fetch') || error.message.includes('network')) {
      errorMessage.value = t('errorBoundary.networkError')
    } else if (!props.fallbackMessage) {
      errorMessage.value = `${t('errorBoundary.componentError')}: ${error.message.slice(0, 100)}`
    }
  }

  emit('error', error, { component: errorComponent.value, props: instance?.$props || {} })

  return false
})

// 重置错误状态
const resetError = () => {
  hasError.value = false
  errorMessage.value = ''
  errorDetails.value = ''
  errorComponent.value = ''
  capturedError.value = null
  retryCount.value++
  emit('recovered')
}

// 重试函数
const handleRetry = () => {
  resetError()
}
</script>

<template>
  <div class="error-boundary">
    <!-- 正常内容 -->
    <slot v-if="!hasError" />

    <!-- 错误状态 UI -->
    <ErrorDisplay
      v-else
      :error-message="errorMessage"
      :error-details="errorDetails"
      :error-component="errorComponent"
      :show-details="showDetails"
      @retry="handleRetry"
    />

    <!-- 自定义 fallback 插槽 -->
    <slot v-if="hasError" name="fallback" :error="capturedError" :reset="handleRetry" />
  </div>
</template>

<style scoped>
.error-boundary {
  display: contents;
}
</style>
