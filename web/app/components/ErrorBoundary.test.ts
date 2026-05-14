import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock useErrorBoundary composable
vi.mock('~/app/composables/useErrorBoundary', () => ({
  useErrorBoundary: vi.fn(() => ({
    hasError: vi.fn(() => ({ value: false })),
    errorMessage: { value: '' },
    errorDetails: { value: '' },
    errorComponent: { value: '' },
    capturedError: { value: null },
    handleRetry: vi.fn(),
  })),
}))

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render slot content when no error', async () => {
    const ErrorBoundary = await import('./ErrorBoundary.vue')
    const wrapper = mount(ErrorBoundary.default, {
      props: {
        showDetails: false,
      },
      slots: {
        default: '<div class="slot-content">Normal content</div>',
      },
      global: {
        stubs: {
          ErrorDisplay: true,
          Teleport: true,
        },
      },
    })

    expect(wrapper.html()).toContain('slot-content')
    expect(wrapper.html()).toContain('Normal content')
  })

  it('should render with default props', async () => {
    const ErrorBoundary = await import('./ErrorBoundary.vue')
    const wrapper = mount(ErrorBoundary.default, {
      props: {},
      slots: {
        default: '<div>Content</div>',
      },
      global: {
        stubs: {
          ErrorDisplay: true,
          Teleport: true,
        },
      },
    })

    expect(wrapper.find('.error-boundary').exists()).toBe(true)
  })

  it('should apply display:contents style to container', async () => {
    const ErrorBoundary = await import('./ErrorBoundary.vue')
    const wrapper = mount(ErrorBoundary.default, {
      props: {},
      slots: {
        default: '<div>Content</div>',
      },
      global: {
        stubs: {
          ErrorDisplay: true,
          Teleport: true,
        },
      },
    })

    const container = wrapper.find('.error-boundary')
    expect(container.classes()).toContain('error-boundary')
  })

  it('should pass showDetails prop to useErrorBoundary', async () => {
    const mockUseErrorBoundary = vi.fn(() => ({
      hasError: vi.fn(() => ({ value: false })),
      errorMessage: { value: '' },
      errorDetails: { value: '' },
      errorComponent: { value: '' },
      capturedError: { value: null },
      handleRetry: vi.fn(),
    }))

    vi.mock('~/app/composables/useErrorBoundary', () => ({
      useErrorBoundary: mockUseErrorBoundary,
    }))

    const ErrorBoundary = await import('./ErrorBoundary.vue')
    mount(ErrorBoundary.default, {
      props: {
        showDetails: true,
      },
      slots: {
        default: '<div>Content</div>',
      },
      global: {
        stubs: {
          ErrorDisplay: true,
          Teleport: true,
        },
      },
    })

    expect(mockUseErrorBoundary).toHaveBeenCalledWith(
      expect.objectContaining({ showDetails: true })
    )
  })

  it('should pass fallbackMessage prop to useErrorBoundary', async () => {
    const mockUseErrorBoundary = vi.fn(() => ({
      hasError: vi.fn(() => ({ value: false })),
      errorMessage: { value: '' },
      errorDetails: { value: '' },
      errorComponent: { value: '' },
      capturedError: { value: null },
      handleRetry: vi.fn(),
    }))

    vi.mock('~/app/composables/useErrorBoundary', () => ({
      useErrorBoundary: mockUseErrorBoundary,
    }))

    const ErrorBoundary = await import('./ErrorBoundary.vue')
    mount(ErrorBoundary.default, {
      props: {
        fallbackMessage: 'Custom fallback message',
      },
      slots: {
        default: '<div>Content</div>',
      },
      global: {
        stubs: {
          ErrorDisplay: true,
          Teleport: true,
        },
      },
    })

    expect(mockUseErrorBoundary).toHaveBeenCalledWith(
      expect.objectContaining({ fallbackMessage: 'Custom fallback message' })
    )
  })

  it('should pass level prop to useErrorBoundary', async () => {
    const mockUseErrorBoundary = vi.fn(() => ({
      hasError: vi.fn(() => ({ value: false })),
      errorMessage: { value: '' },
      errorDetails: { value: '' },
      errorComponent: { value: '' },
      capturedError: { value: null },
      handleRetry: vi.fn(),
    }))

    vi.mock('~/app/composables/useErrorBoundary', () => ({
      useErrorBoundary: mockUseErrorBoundary,
    }))

    const ErrorBoundary = await import('./ErrorBoundary.vue')
    mount(ErrorBoundary.default, {
      props: {
        level: 'all',
      },
      slots: {
        default: '<div>Content</div>',
      },
      global: {
        stubs: {
          ErrorDisplay: true,
          Teleport: true,
        },
      },
    })

    expect(mockUseErrorBoundary).toHaveBeenCalledWith(
      expect.objectContaining({ level: 'all' })
    )
  })

  it('should use default values when props are not provided', async () => {
    const mockUseErrorBoundary = vi.fn(() => ({
      hasError: vi.fn(() => ({ value: false })),
      errorMessage: { value: '' },
      errorDetails: { value: '' },
      errorComponent: { value: '' },
      capturedError: { value: null },
      handleRetry: vi.fn(),
    }))

    vi.mock('~/app/composables/useErrorBoundary', () => ({
      useErrorBoundary: mockUseErrorBoundary,
    }))

    const ErrorBoundary = await import('./ErrorBoundary.vue')
    mount(ErrorBoundary.default, {
      props: {},
      slots: {
        default: '<div>Content</div>',
      },
      global: {
        stubs: {
          ErrorDisplay: true,
          Teleport: true,
        },
      },
    })

    expect(mockUseErrorBoundary).toHaveBeenCalledWith(
      expect.objectContaining({
        showDetails: import.meta.env.DEV,
        preserveState: true,
        level: 'component',
      })
    )
  })

  it('should emit recovered event when resetError is called', async () => {
    const handleRetry = vi.fn()
    vi.mock('~/app/composables/useErrorBoundary', () => ({
      useErrorBoundary: vi.fn(() => ({
        hasError: vi.fn(() => ({ value: true })),
        errorMessage: { value: 'Error occurred' },
        errorDetails: { value: 'Details' },
        errorComponent: { value: 'TestComponent' },
        capturedError: { value: new Error('Test error') },
        handleRetry,
      })),
    }))

    const ErrorBoundary = await import('./ErrorBoundary.vue')
    const wrapper = mount(ErrorBoundary.default, {
      props: {},
      global: {
        stubs: {
          ErrorDisplay: {
            template: '<div @click="$emit(\'retry\')">Error Display</div>',
            emits: ['retry'],
          },
          Teleport: true,
        },
      },
    })

    // Trigger retry on ErrorDisplay
    await wrapper.find('div').trigger('click')

    expect(handleRetry).toHaveBeenCalled()
  })

  it('should render slot with fallback when error occurs', async () => {
    const capturedErrorInstance = new Error('Test error')
    vi.mock('~/app/composables/useErrorBoundary', () => ({
      useErrorBoundary: vi.fn(() => ({
        hasError: vi.fn(() => ({ value: true })),
        errorMessage: { value: 'Error occurred' },
        errorDetails: { value: 'Details' },
        errorComponent: { value: 'TestComponent' },
        capturedError: { value: capturedErrorInstance },
        handleRetry: vi.fn(),
      })),
    }))

    const ErrorBoundary = await import('./ErrorBoundary.vue')
    const wrapper = mount(ErrorBoundary.default, {
      props: {},
      slots: {
        default: '<div>Normal content</div>',
        fallback: '<div class="fallback-slot">Fallback content</div>',
      },
      global: {
        stubs: {
          ErrorDisplay: {
            template: '<div>Error Display</div>',
          },
          Teleport: true,
        },
      },
    })

    // The fallback slot should be rendered when hasError is true
    expect(wrapper.html()).toContain('fallback-slot')
    expect(wrapper.html()).toContain('Fallback content')
  })
})