import type { VNode } from 'vue'

interface ErrorBoundaryOptions {
  showDetails?: boolean
  fallbackMessage?: string
  preserveState?: boolean
  level?: 'component' | 'all'
}

interface ErrorInfo {
  component: string
  props: Record<string, unknown>
}

/**
 * Error Boundary Composable
 * 
 * Provides error state management and error capturing logic
 * for use in ErrorBoundary components.
 */
export function useErrorBoundary(options: ErrorBoundaryOptions = {}) {
  const { t } = useI18n()

  // Error state
  const hasError = ref(false)
  const errorMessage = ref('')
  const errorDetails = ref('')
  const errorComponent = ref('')
  const retryCount = ref(0)

  // Captured error for slot
  const capturedError = ref<Error | null>(null)

  // Error capture handler
  const handleErrorCaptured = (error: Error, instance: any, info: string) => {
    if (options.level === 'component' && info !== 'componentRender') {
      return false
    }

    hasError.value = true
    errorMessage.value = options.fallbackMessage || t('errorBoundary.defaultMessage')
    errorDetails.value = options.level === 'all' 
      ? `${error.message}\n\nStack:\n${error.stack}` 
      : info
    errorComponent.value = instance?.$options?.name || 'Unknown'
    capturedError.value = error

    if (error instanceof Error) {
      if (error.message.includes('undefined') || error.message.includes('null')) {
        errorMessage.value = t('errorBoundary.renderError')
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage.value = t('errorBoundary.networkError')
      } else if (!options.fallbackMessage) {
        errorMessage.value = `${t('errorBoundary.componentError')}: ${error.message.slice(0, 100)}`
      }
    }

    return false
  }

  // Reset error state
  const resetError = () => {
    hasError.value = false
    errorMessage.value = ''
    errorDetails.value = ''
    errorComponent.value = ''
    capturedError.value = null
    retryCount.value++
  }

  // Retry function
  const handleRetry = () => {
    resetError()
  }

  // Set up error capture
  onErrorCaptured(handleErrorCaptured)

  return {
    // State
    hasError,
    errorMessage,
    errorDetails,
    errorComponent,
    retryCount,
    capturedError,
    // Actions
    resetError,
    handleRetry,
  }
}
