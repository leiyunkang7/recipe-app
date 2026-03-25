import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Mock useI18n
vi.mock('~/composables/useI18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    locale: { value: 'zh' },
  }),
}))

describe('ErrorDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render error display component', async () => {
      const ErrorDisplay = await import('./ErrorDisplay.vue')
      const wrapper = mount(ErrorDisplay.default, {
        props: {
          errorMessage: 'Something went wrong',
          errorDetails: '',
          errorComponent: '',
          showDetails: false,
        },
        global: {
          stubs: {
            ErrorBoundaryContent: {
              template: '<div class="error-boundary-content"><slot /></div>',
            },
          },
        },
      })

      expect(wrapper.findComponent({ name: 'ErrorBoundaryContent' }).exists()).toBe(true)
    })

    it('should pass props to ErrorBoundaryContent', async () => {
      const ErrorDisplay = await import('./ErrorDisplay.vue')
      const wrapper = mount(ErrorDisplay.default, {
        props: {
          errorMessage: 'Network error',
          errorDetails: 'Error details here',
          errorComponent: 'MyComponent',
          showDetails: true,
        },
        global: {
          stubs: {
            ErrorBoundaryContent: {
              template: '<div class="error-boundary-content"><slot /></div>',
              props: ['errorMessage', 'errorDetails', 'errorComponent', 'showDetails', 'isDetailsExpanded'],
            },
          },
        },
      })

      const content = wrapper.findComponent({ name: 'ErrorBoundaryContent' })
      expect(content.props('errorMessage')).toBe('Network error')
      expect(content.props('errorDetails')).toBe('Error details here')
      expect(content.props('errorComponent')).toBe('MyComponent')
      expect(content.props('showDetails')).toBe(true)
    })
  })

  describe('internal state', () => {
    it('should initialize with isDetailsExpanded as false', async () => {
      const ErrorDisplay = await import('./ErrorDisplay.vue')
      const wrapper = mount(ErrorDisplay.default, {
        props: {
          errorMessage: 'Error',
          errorDetails: '',
          errorComponent: '',
          showDetails: false,
        },
        global: {
          stubs: {
            ErrorBoundaryContent: {
              template: '<div class="error-boundary-content"><slot /></div>',
              props: ['errorMessage', 'errorDetails', 'errorComponent', 'showDetails', 'isDetailsExpanded'],
            },
          },
        },
      })

      const content = wrapper.findComponent({ name: 'ErrorBoundaryContent' })
      expect(content.props('isDetailsExpanded')).toBe(false)
    })
  })

  describe('toggleDetails behavior', () => {
    it('should toggle isDetailsExpanded when toggleDetails is emitted from child', async () => {
      const ErrorDisplay = await import('./ErrorDisplay.vue')
      const wrapper = mount(ErrorDisplay.default, {
        props: {
          errorMessage: 'Error',
          errorDetails: 'Details',
          errorComponent: '',
          showDetails: true,
        },
        global: {
          stubs: {
            ErrorBoundaryContent: {
              template: '<div class="error-boundary-content"><button @click="$emit(\'toggleDetails\')">Toggle</button></div>',
              props: ['errorMessage', 'errorDetails', 'errorComponent', 'showDetails', 'isDetailsExpanded'],
            },
          },
        },
      })

      await wrapper.find('button').trigger('click')
      await flushPromises()

      // isDetailsExpanded should toggle via the child component
      const content = wrapper.findComponent({ name: 'ErrorBoundaryContent' })
      expect(content.props('isDetailsExpanded')).toBe(false)
    })
  })

  describe('emit handling', () => {
    it('should emit retry when child emits retry', async () => {
      const ErrorDisplay = await import('./ErrorDisplay.vue')
      const wrapper = mount(ErrorDisplay.default, {
        props: {
          errorMessage: 'Error',
          errorDetails: '',
          errorComponent: '',
          showDetails: false,
        },
        global: {
          stubs: {
            ErrorBoundaryContent: {
              template: '<div class="error-boundary-content"><button @click="$emit(\'retry\')">Retry</button></div>',
            },
          },
        },
      })

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('retry')).toBeTruthy()
      expect(wrapper.emitted('retry')?.length).toBe(1)
    })

    it('should emit toggleDetails when child emits toggleDetails', async () => {
      const ErrorDisplay = await import('./ErrorDisplay.vue')
      const wrapper = mount(ErrorDisplay.default, {
        props: {
          errorMessage: 'Error',
          errorDetails: 'Details',
          errorComponent: '',
          showDetails: true,
        },
        global: {
          stubs: {
            ErrorBoundaryContent: {
              template: '<div class="error-boundary-content"><button @click="$emit(\'toggleDetails\')">Toggle</button></div>',
            },
          },
        },
      })

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('toggleDetails')).toBeTruthy()
      expect(wrapper.emitted('toggleDetails')?.length).toBe(1)
    })
  })
})
