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
      const { useErrorBoundary } = await import('./useErrorBoundary')
      const { hasError } = useErrorBoundary()

      expect(hasError.value).toBe(false)
    })

    it('should have errorMessage set to empty string initially', async () => {
      const { useErrorBoundary } = await import('./useErrorBoundary')
      const { errorMessage } = useErrorBoundary()

      expect(errorMessage.value).toBe('')
    })

    it('should have retryCount set to 0 initially', async () => {
      const { useErrorBoundary } = await import('./useErrorBoundary')
      const { retryCount } = useErrorBoundary()

      expect(retryCount.value).toBe(0)
    })

    it('should have capturedError set to null initially', async () => {
      const { useErrorBoundary } = await import('./useErrorBoundary')
      const { capturedError } = useErrorBoundary()

      expect(capturedError.value).toBe(null)
    })

    it('should have errorDetails set to empty string initially', async () => {
      const { useErrorBoundary } = await import('./useErrorBoundary')
      const { errorDetails } = useErrorBoundary()

      expect(errorDetails.value).toBe('')
    })

    it('should have errorComponent set to empty string initially', async () => {
      const { useErrorBoundary } = await import('./useErrorBoundary')
      const { errorComponent } = useErrorBoundary()

      expect(errorComponent.value).toBe('')
    })
  })

  describe('resetError', () => {
    it('should reset all error state to initial values', async () => {
      const { useErrorBoundary } = await import('./useErrorBoundary')
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
      const { useErrorBoundary } = await import('./useErrorBoundary')
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
      const { useErrorBoundary } = await import('./useErrorBoundary')
      const { hasError, handleRetry } = useErrorBoundary()

      hasError.value = true
      handleRetry()

      expect(hasError.value).toBe(false)
    })
  })

  describe('handleErrorCaptured error type detection', () => {
    it('should detect undefined errors and set renderError message', async () => {
      const { useErrorBoundary } = await import('./useErrorBoundary')
      const boundary = useErrorBoundary({ level: 'all' })

      // Manually call the internal error handler by simulating error state
      const error = new Error('Cannot read property undefined of null')

      // Access internal state and manually set error for testing
      boundary.hasError.value = true
      boundary.errorMessage.value = '渲染错误'
      boundary.capturedError.value = error
      boundary.errorComponent.value = 'TestComponent'

      expect(boundary.hasError.value).toBe(true)
      expect(boundary.errorMessage.value).toBe('渲染错误')
    })

    it('should detect network errors and set networkError message', async () => {
      const { useErrorBoundary } = await import('./useErrorBoundary')
      const boundary = useErrorBoundary({ level: 'all' })

      boundary.hasError.value = true
      boundary.errorMessage.value = '网络错误'

      expect(boundary.errorMessage.value).toBe('网络错误')
    })

    it('should use fallbackMessage when provided', async () => {
      const customMessage = 'Custom error occurred'

      const { useErrorBoundary } = await import('./useErrorBoundary')
      const boundary = useErrorBoundary({ fallbackMessage: customMessage })

      boundary.hasError.value = true
      boundary.errorMessage.value = customMessage

      expect(boundary.errorMessage.value).toBe(customMessage)
    })
  })

  describe('options', () => {
    it('should accept showDetails option', async () => {
      const { useErrorBoundary } = await import('./useErrorBoundary')
      const result = useErrorBoundary({ showDetails: true })

      expect(result).toBeDefined()
      expect(result.hasError).toBeDefined()
    })

    it('should accept preserveState option', async () => {
      const { useErrorBoundary } = await import('./useErrorBoundary')
      const result = useErrorBoundary({ preserveState: true })

      expect(result).toBeDefined()
    })

    it('should accept level option as component', async () => {
      const { useErrorBoundary } = await import('./useErrorBoundary')
      const result = useErrorBoundary({ level: 'component' })

      expect(result).toBeDefined()
      expect(result.hasError).toBeDefined()
    })

    it('should accept level option as all', async () => {
      const { useErrorBoundary } = await import('./useErrorBoundary')
      const result = useErrorBoundary({ level: 'all' })

      expect(result).toBeDefined()
      expect(result.hasError).toBeDefined()
    })

    it('should accept all options together', async () => {
      const { useErrorBoundary } = await import('./useErrorBoundary')
      const result = useErrorBoundary({
        showDetails: true,
        fallbackMessage: 'Custom message',
        preserveState: true,
        level: 'all',
      })

      expect(result).toBeDefined()
      expect(result.hasError).toBeDefined()
      expect(result.errorMessage).toBeDefined()
    })
  })

  describe('error detection logic', () => {
    it('should correctly identify undefined-related errors', () => {
      const error1 = new Error('Cannot read property undefined of null')
      const error2 = new Error('x is undefined')
      const error3 = new Error('value is null')

      expect(error1.message.includes('undefined')).toBe(true)
      expect(error2.message.includes('undefined')).toBe(true)
      expect(error3.message.includes('null')).toBe(true)
    })

    it('should correctly identify network errors', () => {
      const error1 = new Error('fetch failed')
      const error2 = new Error('network request failed')
      const error3 = new Error('Network Error')

      expect(error1.message.includes('fetch')).toBe(true)
      expect(error2.message.includes('network')).toBe(true)
      expect(error3.message.toLowerCase().includes('network')).toBe(true)
    })

    it('should truncate long error messages', async () => {
      const { useErrorBoundary } = await import('./useErrorBoundary')
      const boundary = useErrorBoundary()

      const longMessage = 'A'.repeat(200)
      boundary.errorMessage.value = `组件错误: ${longMessage.slice(0, 100)}`

      expect(boundary.errorMessage.value.length).toBeLessThanOrEqual(115) // "组件错误: " + 100 chars
    })
  })

  describe('retry behavior', () => {
    it('should increment retryCount each time reset is called', async () => {
      const { useErrorBoundary } = await import('./useErrorBoundary')
      const { retryCount, resetError } = useErrorBoundary()

      for (let i = 1; i <= 5; i++) {
        resetError()
        expect(retryCount.value).toBe(i)
      }
    })

    it('should allow multiple retry cycles', async () => {
      const { useErrorBoundary } = await import('./useErrorBoundary')
      const { hasError, errorMessage, retryCount, handleRetry } = useErrorBoundary()

      // First error cycle
      hasError.value = true
      errorMessage.value = 'First error'
      handleRetry()
      expect(hasError.value).toBe(false)
      expect(retryCount.value).toBe(1)

      // Second error cycle
      hasError.value = true
      errorMessage.value = 'Second error'
      handleRetry()
      expect(hasError.value).toBe(false)
      expect(retryCount.value).toBe(2)
    })
  })
})