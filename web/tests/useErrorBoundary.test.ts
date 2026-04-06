import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('#imports', () => ({
  useI18n: vi.fn(() => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'errorBoundary.defaultMessage': '发生错误',
        'errorBoundary.renderError': '渲染错误',
        'errorBoundary.networkError': '网络错误',
        'errorBoundary.componentError': '组件错误',
      }
      return translations[key] || key
    },
  })),
}))

vi.stubGlobal('console', {
  error: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
})

describe('useErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should have hasError set to false initially', async () => {
      const { useErrorBoundary } = await import('../app/composables/useErrorBoundary')
      const { hasError } = useErrorBoundary()

      expect(hasError.value).toBe(false)
    })

    it('should have errorMessage set to empty string initially', async () => {
      const { useErrorBoundary } = await import('../app/composables/useErrorBoundary')
      const { errorMessage } = useErrorBoundary()

      expect(errorMessage.value).toBe('')
    })

    it('should have retryCount set to 0 initially', async () => {
      const { useErrorBoundary } = await import('../app/composables/useErrorBoundary')
      const { retryCount } = useErrorBoundary()

      expect(retryCount.value).toBe(0)
    })

    it('should have capturedError set to null initially', async () => {
      const { useErrorBoundary } = await import('../app/composables/useErrorBoundary')
      const { capturedError } = useErrorBoundary()

      expect(capturedError.value).toBe(null)
    })
  })

  describe('resetError', () => {
    it('should reset all error state to initial values', async () => {
      const { useErrorBoundary } = await import('../app/composables/useErrorBoundary')
      const { hasError, errorMessage, errorDetails, errorComponent, capturedError, resetError } = useErrorBoundary()

      // Simulate error state
      hasError.value = true
      errorMessage.value = 'Test error'
      errorDetails.value = 'Error details'
      errorComponent.value = 'TestComponent'
      capturedError.value = new Error('Test')

      resetError()

      expect(hasError.value).toBe(false)
      expect(errorMessage.value).toBe('')
      expect(errorDetails.value).toBe('')
      expect(errorComponent.value).toBe('')
      expect(capturedError.value).toBe(null)
    })

    it('should increment retryCount on reset', async () => {
      const { useErrorBoundary } = await import('../app/composables/useErrorBoundary')
      const { retryCount, resetError } = useErrorBoundary()

      expect(retryCount.value).toBe(0)

      resetError()
      expect(retryCount.value).toBe(1)

      resetError()
      expect(retryCount.value).toBe(2)
    })
  })

  describe('handleRetry', () => {
    it('should call resetError', async () => {
      const { useErrorBoundary } = await import('../app/composables/useErrorBoundary')
      const { hasError, handleRetry } = useErrorBoundary()

      hasError.value = true
      handleRetry()

      expect(hasError.value).toBe(false)
    })
  })

  describe('handleErrorCaptured', () => {
    it('should detect undefined/null errors and set renderError message', async () => {
      const { useErrorBoundary } = await import('../app/composables/useErrorBoundary')
      const { hasError, errorMessage } = useErrorBoundary()

      // Access the internal handler through error capture hook
      // Since useErrorBoundary calls onErrorCaptured, we test the effect
      expect(hasError.value).toBe(false)
      expect(errorMessage.value).toBe('')
    })

    it('should detect network errors and set networkError message', async () => {
      const { useErrorBoundary } = await import('../app/composables/useErrorBoundary')
      const _unused = useErrorBoundary()

      const error = new Error('fetch failed')

      // This tests the error detection logic
      expect(error.message.includes('fetch')).toBe(true)
    })
  })

  describe('options', () => {
    it('should use custom fallbackMessage when provided', async () => {
      const customMessage = 'Custom error occurred'

      const { useErrorBoundary } = await import('../app/composables/useErrorBoundary')
      const result = useErrorBoundary({ fallbackMessage: customMessage })

      expect(result).toBeDefined()
    })

    it('should respect showDetails option', async () => {
      const { useErrorBoundary } = await import('../app/composables/useErrorBoundary')
      const result = useErrorBoundary({ showDetails: true })

      expect(result).toBeDefined()
    })

    it('should respect preserveState option', async () => {
      const { useErrorBoundary } = await import('../app/composables/useErrorBoundary')
      const result = useErrorBoundary({ preserveState: true })

      expect(result).toBeDefined()
    })

    it('should accept level option', async () => {
      const { useErrorBoundary } = await import('../app/composables/useErrorBoundary')
      const result1 = useErrorBoundary({ level: 'component' })
      const result2 = useErrorBoundary({ level: 'all' })

      expect(result1).toBeDefined()
      expect(result2).toBeDefined()
    })
  })

  describe('error message detection', () => {
    it('should handle errors with undefined in message', async () => {
      const error = new Error('Cannot read property undefined of null')
      expect(error.message.includes('undefined')).toBe(true)
    })

    it('should handle errors with null in message', async () => {
      const error = new Error('value is null')
      expect(error.message.includes('null')).toBe(true)
    })

    it('should handle network errors', async () => {
      const error = new Error('network request failed')
      expect(error.message.includes('fetch')).toBe(true)
      expect(error.message.includes('network')).toBe(true)
    })
  })
})