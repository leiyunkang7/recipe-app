import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// Mock useToast
const mockToasts = [
  { id: 'toast-1', message: 'Success message', type: 'success' as const, duration: 3000 },
  { id: 'toast-2', message: 'Error message', type: 'error' as const, duration: 3000 },
  { id: 'toast-3', message: 'Warning message', type: 'warning' as const, duration: 3000 },
  { id: 'toast-4', message: 'Info message', type: 'info' as const, duration: 3000 },
]

const mockDismiss = vi.fn()

vi.mock('~/composables/useToast', () => ({
  useToast: () => ({
    toasts: { value: mockToasts },
    dismiss: mockDismiss,
  }),
}))

describe('ToastContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('should render toast container', async () => {
      const ToastContainer = await import('./ToastContainer.vue')
      const wrapper = mount(ToastContainer.default, {
        global: {
          stubs: {
            Teleport: { template: '<div><slot /></div>' },
          },
        },
      })

      expect(wrapper.find('.fixed.bottom-4.right-4').exists()).toBe(true)
    })

    it('should render all toasts', async () => {
      const ToastContainer = await import('./ToastContainer.vue')
      const wrapper = mount(ToastContainer.default, {
        global: {
          stubs: {
            Teleport: { template: '<div><slot /></div>' },
          },
        },
      })

      const toastElements = wrapper.findAll('.flex.items-center.gap-3')
      expect(toastElements.length).toBe(4)
    })

    it('should display correct message for each toast', async () => {
      const ToastContainer = await import('./ToastContainer.vue')
      const wrapper = mount(ToastContainer.default, {
        global: {
          stubs: {
            Teleport: { template: '<div><slot /></div>' },
          },
        },
      })

      expect(wrapper.text()).toContain('Success message')
      expect(wrapper.text()).toContain('Error message')
      expect(wrapper.text()).toContain('Warning message')
      expect(wrapper.text()).toContain('Info message')
    })

    it('should show correct icons for each toast type', async () => {
      const ToastContainer = await import('./ToastContainer.vue')
      const wrapper = mount(ToastContainer.default, {
        global: {
          stubs: {
            Teleport: { template: '<div><slot /></div>' },
          },
        },
      })

      const icons = wrapper.findAll('span.text-lg')
      expect(icons[0].text()).toBe('✅')
      expect(icons[1].text()).toBe('❌')
      expect(icons[2].text()).toBe('⚠️')
      expect(icons[3].text()).toBe('ℹ️')
    })
  })

  describe('toast styling', () => {
    it('should apply correct background class for success toast', async () => {
      const ToastContainer = await import('./ToastContainer.vue')
      const wrapper = mount(ToastContainer.default, {
        global: {
          stubs: {
            Teleport: { template: '<div><slot /></div>' },
          },
        },
      })

      const successToast = wrapper.find('.bg-green-50')
      expect(successToast.exists()).toBe(true)
    })

    it('should apply correct background class for error toast', async () => {
      const ToastContainer = await import('./ToastContainer.vue')
      const wrapper = mount(ToastContainer.default, {
        global: {
          stubs: {
            Teleport: { template: '<div><slot /></div>' },
          },
        },
      })

      const errorToast = wrapper.find('.bg-red-50')
      expect(errorToast.exists()).toBe(true)
    })

    it('should apply correct background class for warning toast', async () => {
      const ToastContainer = await import('./ToastContainer.vue')
      const wrapper = mount(ToastContainer.default, {
        global: {
          stubs: {
            Teleport: { template: '<div><slot /></div>' },
          },
        },
      })

      const warningToast = wrapper.find('.bg-yellow-50')
      expect(warningToast.exists()).toBe(true)
    })

    it('should apply correct background class for info toast', async () => {
      const ToastContainer = await import('./ToastContainer.vue')
      const wrapper = mount(ToastContainer.default, {
        global: {
          stubs: {
            Teleport: { template: '<div><slot /></div>' },
          },
        },
      })

      const infoToast = wrapper.find('.bg-blue-50')
      expect(infoToast.exists()).toBe(true)
    })
  })

  describe('dismiss functionality', () => {
    it('should render dismiss button for each toast', async () => {
      const ToastContainer = await import('./ToastContainer.vue')
      const wrapper = mount(ToastContainer.default, {
        global: {
          stubs: {
            Teleport: { template: '<div><slot /></div>' },
          },
        },
      })

      const dismissButtons = wrapper.findAll('button[aria-label="Dismiss"]')
      expect(dismissButtons.length).toBe(4)
    })

    it('should call dismiss when dismiss button is clicked', async () => {
      const ToastContainer = await import('./ToastContainer.vue')
      const wrapper = mount(ToastContainer.default, {
        global: {
          stubs: {
            Teleport: { template: '<div><slot /></div>' },
          },
        },
      })

      const firstDismissButton = wrapper.find('button[aria-label="Dismiss"]')
      await firstDismissButton.trigger('click')

      expect(mockDismiss).toHaveBeenCalledWith('toast-1')
    })

    it('should call dismiss with correct toast id for each button', async () => {
      const ToastContainer = await import('./ToastContainer.vue')
      const wrapper = mount(ToastContainer.default, {
        global: {
          stubs: {
            Teleport: { template: '<div><slot /></div>' },
          },
        },
      })

      const dismissButtons = wrapper.findAll('button[aria-label="Dismiss"]')

      await dismissButtons[0].trigger('click')
      expect(mockDismiss).toHaveBeenLastCalledWith('toast-1')

      await dismissButtons[1].trigger('click')
      expect(mockDismiss).toHaveBeenLastCalledWith('toast-2')

      await dismissButtons[2].trigger('click')
      expect(mockDismiss).toHaveBeenLastCalledWith('toast-3')

      await dismissButtons[3].trigger('click')
      expect(mockDismiss).toHaveBeenLastCalledWith('toast-4')
    })
  })

  describe('empty state', () => {
    it('should render nothing when toasts array is empty', async () => {
      vi.mocked(useToast).mockReturnValue({
        toasts: { value: [] },
        dismiss: mockDismiss,
      } as any)

      const ToastContainer = await import('./ToastContainer.vue')
      const wrapper = mount(ToastContainer.default, {
        global: {
          stubs: {
            Teleport: { template: '<div><slot /></div>' },
          },
        },
      })

      expect(wrapper.find('.flex.items-center.gap-3').exists()).toBe(false)
    })
  })

  describe('transition classes', () => {
    it('should have transition classes on toast elements', async () => {
      const ToastContainer = await import('./ToastContainer.vue')
      const wrapper = mount(ToastContainer.default, {
        global: {
          stubs: {
            Teleport: { template: '<div><slot /></div>' },
          },
        },
      })

      const toastWrapper = wrapper.find('.flex.items-center.gap-3')
      expect(toastWrapper.classes()).toContain('px-4')
      expect(toastWrapper.classes()).toContain('py-3')
      expect(toastWrapper.classes()).toContain('rounded-lg')
      expect(toastWrapper.classes()).toContain('border')
      expect(toastWrapper.classes()).toContain('shadow-lg')
    })
  })
})
