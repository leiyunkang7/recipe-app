import { ref } from 'vue'

export interface Toast {
  id: string
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
  duration: number
}

const toasts = ref<Toast[]>([])
let toastId = 0

export function useToast() {
  const show = (message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const id = `toast-${++toastId}`
    const toast: Toast = { id, message, type, duration }
    toasts.value.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }

    return id
  }

  const dismiss = (id: string) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  const dismissAll = () => {
    toasts.value = []
  }

  return {
    toasts: readonly(toasts),
    show,
    dismiss,
    dismissAll,
    info: (message: string, duration?: number) => show(message, 'info', duration),
    success: (message: string, duration?: number) => show(message, 'success', duration),
    error: (message: string, duration?: number) => show(message, 'error', duration),
    warning: (message: string, duration?: number) => show(message, 'warning', duration),
  }
}
