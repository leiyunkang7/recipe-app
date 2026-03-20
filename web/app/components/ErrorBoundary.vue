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
  /** 是否显示详细错误信息（开发环境默认显示） */
  showDetails?: boolean
  /** 自定义错误消息 */
  fallbackMessage?: string
  /** 重试时是否保留之前的状态 */
  preserveState?: boolean
  /** 错误级别：'component' 仅捕获组件错误，'all' 捕获所有错误 */
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
  // 记录错误信息
  console.error('[ErrorBoundary] Caught error:', error)
  console.error('[ErrorBoundary] Component:', instance?.$options?.name || 'Anonymous')
  console.error('[ErrorBoundary] Error info:', info)

  // 根据级别判断是否拦截
  if (props.level === 'component' && info !== 'componentRender') {
    // 对于非组件渲染错误，选择性处理
    return false
  }

  // 设置错误状态
  hasError.value = true
  errorMessage.value = props.fallbackMessage || t('errorBoundary.defaultMessage')
  errorDetails.value = props.level === 'all' ? `${error.message}\n\nStack:\n${error.stack}` : info
  errorComponent.value = instance?.$options?.name || 'Unknown'
  capturedError.value = error

  // 提取有用的错误信息
  if (error instanceof Error) {
    // 如果是运行时错误，显示更有意义的错误消息
    if (error.message.includes('undefined') || error.message.includes('null')) {
      errorMessage.value = t('errorBoundary.renderError')
    } else if (error.message.includes('fetch') || error.message.includes('network')) {
      errorMessage.value = t('errorBoundary.networkError')
    } else if (!props.fallbackMessage) {
      errorMessage.value = `${t('errorBoundary.componentError')}: ${error.message.slice(0, 100)}`
    }
  }

  // 发送错误事件
  emit('error', error, { component: errorComponent.value, props: instance?.$props || {} })

  // 返回 true 阻止错误继续向上传播
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

// 展开/收起详情
const isDetailsExpanded = ref(false)
const toggleDetails = () => {
  isDetailsExpanded.value = !isDetailsExpanded.value
}
</script>

<template>
  <div class="error-boundary">
    <!-- 正常内容 -->
    <slot v-if="!hasError" />

    <!-- 错误状态 UI -->
    <div
      v-else
      class="error-boundary-fallback"
      role="alert"
      aria-live="assertive"
    >
      <div class="bg-gradient-to-br from-stone-50 to-orange-50 dark:from-stone-900 dark:to-red-900/20 min-h-[200px] flex items-center justify-center p-6 rounded-2xl border border-red-200 dark:border-red-800/50">
        <div class="text-center max-w-sm mx-auto">
          <!-- 错误图标 -->
          <div class="text-6xl mb-4 animate-pulse">⚠️</div>

          <!-- 错误标题 -->
          <h3 class="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">
            {{ t('errorBoundary.title') }}
          </h3>

          <!-- 错误消息 -->
          <p class="text-sm text-red-600 dark:text-red-400 mb-4">
            {{ errorMessage }}
          </p>

          <!-- 操作按钮 -->
          <div class="flex flex-wrap justify-center gap-2">
            <button
              @click="handleRetry"
              class="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl transition-all shadow-lg shadow-orange-200 dark:shadow-orange-900/30 font-medium text-sm active:scale-95"
            >
              {{ t('errorBoundary.retry') }}
            </button>

            <button
              @click="toggleDetails"
              v-if="showDetails && errorDetails"
              class="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl transition-colors font-medium text-sm"
            >
              {{ isDetailsExpanded ? t('errorBoundary.hideDetails') : t('errorBoundary.showDetails') }}
            </button>
          </div>

          <!-- 错误详情（可展开） -->
          <div
            v-if="showDetails && errorDetails && isDetailsExpanded"
            class="mt-4 p-3 bg-stone-100 dark:bg-stone-800 rounded-xl text-left"
          >
            <p class="text-xs font-mono text-stone-600 dark:text-stone-400 whitespace-pre-wrap break-all">
              {{ errorDetails }}
            </p>
          </div>

          <!-- 组件名称提示 -->
          <p v-if="errorComponent && showDetails" class="mt-3 text-xs text-stone-400 dark:text-stone-500">
            {{ t('errorBoundary.component') }}: {{ errorComponent }}
          </p>
        </div>
      </div>
    </div>

    <!-- 自定义 fallback 插槽 -->
    <slot v-if="hasError" name="fallback" :error="capturedError" :reset="handleRetry" />
  </div>
</template>

<style scoped>
.error-boundary {
  display: contents;
}

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

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .animate-pulse {
    animation: none;
  }

  .error-boundary-fallback {
    animation: none;
  }
}
</style>
