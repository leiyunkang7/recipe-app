import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref, readonly } from 'vue'

// Mock useToast composable
const mockToasts = ref<Array<{ id: string; message: string; type: string; duration: number }>>([])
const mockDismiss = vi.fn()

vi.mock('~/composables/useToast', () => ({
  useToast: () => ({
    toasts: readonly(mockToasts),
    dismiss: mockDismiss,
    show: vi.fn(),
    dismissAll: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}))

describe('ToastContainer', () => {
  beforeEach(() => {
    mockToasts.value = []
    mockDismiss.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should not render any toasts when toasts array is empty', async () => {
    const ToastContainer = await import('./ToastContainer.vue')
    const wrapper = mount(ToastContainer.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.html()).toBe('')
  })

  it('should render a toast when there is one toast', async () => {
    mockToasts.value = [
      { id: 'toast-1', message: 'Test message', type: 'info', duration: 3000 },
    ]

    const ToastContainer = await import('./ToastContainer.vue')
    const wrapper = mount(ToastContainer.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.html()).toContain('Test message')
    expect(wrapper.html()).toContain('ℹ️')
  })

  it('should render multiple toasts', async () => {
    mockToasts.value = [
      { id: 'toast-1', message: 'First toast', type: 'info', duration: 3000 },
      { id: 'toast-2', message: 'Second toast', type: 'success', duration: 3000 },
      { id: 'toast-3', message: 'Error toast', type: 'error', duration: 3000 },
    ]

    const ToastContainer = await import('./ToastContainer.vue')
    const wrapper = mount(ToastContainer.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.html()).toContain('First toast')
    expect(wrapper.html()).toContain('Second toast')
    expect(wrapper.html()).toContain('Error toast')
  })

  it('should display correct icon for each toast type', async () => {
    mockToasts.value = [
      { id: 'toast-1', message: 'Info toast', type: 'info', duration: 3000 },
      { id: 'toast-2', message: 'Success toast', type: 'success', duration: 3000 },
      { id: 'toast-3', message: 'Error toast', type: 'error', duration: 3000 },
      { id: 'toast-4', message: 'Warning toast', type: 'warning', duration: 3000 },
    ]

    const ToastContainer = await import('./ToastContainer.vue')
    const wrapper = mount(ToastContainer.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.html()).toContain('ℹ️')
    expect(wrapper.html()).toContain('✅')
    expect(wrapper.html()).toContain('❌')
    expect(wrapper.html()).toContain('⚠️')
  })

  it('should apply correct background class for each toast type', async () => {
    mockToasts.value = [
      { id: 'toast-1', message: 'Info toast', type: 'info', duration: 3000 },
    ]

    const ToastContainer = await import('./ToastContainer.vue')
    const wrapper = mount(ToastContainer.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const toastDiv = wrapper.find('.flex.items-center')
    expect(toastDiv.classes()).toContain('bg-blue-50')
    expect(toastDiv.classes()).toContain('border-blue-200')
    expect(toastDiv.classes()).toContain('text-blue-800')
  })

  it('should call dismiss when dismiss button is clicked', async () => {
    mockToasts.value = [
      { id: 'toast-1', message: 'Test toast', type: 'info', duration: 3000 },
    ]

    const ToastContainer = await import('./ToastContainer.vue')
    const wrapper = mount(ToastContainer.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const dismissButton = wrapper.find('button[aria-label="Dismiss"]')
    await dismissButton.trigger('click')

    expect(mockDismiss).toHaveBeenCalledWith('toast-1')
  })

  it('should render toast message correctly', async () => {
    mockToasts.value = [
      { id: 'toast-1', message: 'Custom success message', type: 'success', duration: 3000 },
    ]

    const ToastContainer = await import('./ToastContainer.vue')
    const wrapper = mount(ToastContainer.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const messageSpan = wrapper.find('.text-sm.font-medium')
    expect(messageSpan.text()).toBe('Custom success message')
  })

  it('should have dismiss button for each toast', async () => {
    mockToasts.value = [
      { id: 'toast-1', message: 'Toast 1', type: 'info', duration: 3000 },
      { id: 'toast-2', message: 'Toast 2', type: 'success', duration: 3000 },
    ]

    const ToastContainer = await import('./ToastContainer.vue')
    const wrapper = mount(ToastContainer.default, {
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const dismissButtons = wrapper.findAll('button[aria-label="Dismiss"]')
    expect(dismissButtons).toHaveLength(2)
  })
})