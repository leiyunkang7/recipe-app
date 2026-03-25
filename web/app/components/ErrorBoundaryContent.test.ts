import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

// Mock useI18n
vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'errorBoundary.title': 'Something went wrong',
        'errorBoundary.retry': 'Try Again',
        'errorBoundary.showDetails': 'Show Details',
        'errorBoundary.hideDetails': 'Hide Details',
        'errorBoundary.component': 'Component',
      }
      return translations[key] || key
    },
  }),
}))

describe('ErrorBoundaryContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render error message', async () => {
    const ErrorBoundaryContent = await import('./ErrorBoundaryContent.vue')
    const wrapper = mount(ErrorBoundaryContent.default, {
      props: {
        errorMessage: 'Test error message',
        errorDetails: '',
        errorComponent: '',
        showDetails: false,
        isDetailsExpanded: false,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Test error message')
  })

  it('should render warning emoji', async () => {
    const ErrorBoundaryContent = await import('./ErrorBoundaryContent.vue')
    const wrapper = mount(ErrorBoundaryContent.default, {
      props: {
        errorMessage: 'Test error',
        errorDetails: '',
        errorComponent: '',
        showDetails: false,
        isDetailsExpanded: false,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.html()).toContain('⚠️')
  })

  it('should emit retry event when retry button is clicked', async () => {
    const ErrorBoundaryContent = await import('./ErrorBoundaryContent.vue')
    const wrapper = mount(ErrorBoundaryContent.default, {
      props: {
        errorMessage: 'Test error',
        errorDetails: '',
        errorComponent: '',
        showDetails: false,
        isDetailsExpanded: false,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const retryButton = wrapper.findAll('button')[0]
    await retryButton.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('retry')).toBeTruthy()
  })

  it('should emit toggleDetails event when show details button is clicked', async () => {
    const ErrorBoundaryContent = await import('./ErrorBoundaryContent.vue')
    const wrapper = mount(ErrorBoundaryContent.default, {
      props: {
        errorMessage: 'Test error',
        errorDetails: 'Error stack trace',
        errorComponent: 'MyComponent',
        showDetails: true,
        isDetailsExpanded: false,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const toggleButton = wrapper.findAll('button')[1]
    await toggleButton.trigger('click')
    await flushPromises()

    expect(wrapper.emitted('toggleDetails')).toBeTruthy()
  })

  it('should not render show details button when showDetails is false', async () => {
    const ErrorBoundaryContent = await import('./ErrorBoundaryContent.vue')
    const wrapper = mount(ErrorBoundaryContent.default, {
      props: {
        errorMessage: 'Test error',
        errorDetails: 'Error details',
        errorComponent: '',
        showDetails: false,
        isDetailsExpanded: false,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    // Only retry button should be present
    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(1)
  })

  it('should not render show details button when errorDetails is empty', async () => {
    const ErrorBoundaryContent = await import('./ErrorBoundaryContent.vue')
    const wrapper = mount(ErrorBoundaryContent.default, {
      props: {
        errorMessage: 'Test error',
        errorDetails: '',
        errorComponent: '',
        showDetails: true,
        isDetailsExpanded: false,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons).toHaveLength(1)
  })

  it('should show error details when expanded', async () => {
    const ErrorBoundaryContent = await import('./ErrorBoundaryContent.vue')
    const wrapper = mount(ErrorBoundaryContent.default, {
      props: {
        errorMessage: 'Test error',
        errorDetails: 'Stack trace here',
        errorComponent: 'MyComponent',
        showDetails: true,
        isDetailsExpanded: true,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.html()).toContain('Stack trace here')
  })

  it('should show component name when provided and showDetails is true', async () => {
    const ErrorBoundaryContent = await import('./ErrorBoundaryContent.vue')
    const wrapper = mount(ErrorBoundaryContent.default, {
      props: {
        errorMessage: 'Test error',
        errorDetails: '',
        errorComponent: 'MyComponent',
        showDetails: true,
        isDetailsExpanded: false,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.html()).toContain('MyComponent')
  })

  it('should have proper accessibility attributes', async () => {
    const ErrorBoundaryContent = await import('./ErrorBoundaryContent.vue')
    const wrapper = mount(ErrorBoundaryContent.default, {
      props: {
        errorMessage: 'Test error',
        errorDetails: '',
        errorComponent: '',
        showDetails: false,
        isDetailsExpanded: false,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const container = wrapper.find('.error-boundary-fallback')
    expect(container.attributes('role')).toBe('alert')
    expect(container.attributes('aria-live')).toBe('assertive')
  })
})
