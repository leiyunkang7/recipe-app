import type { Toast } from '~/types'

// Module-level counter for generating unique toast IDs
// Using simple let instead of ref - not reactive, just a counter
let toastIdCounter = 0

export function useToast() {
  // useState ensures SSR/CSR state sharing across components
  const toasts = useState<Toast[]>('toasts', () => [])

  const show = (message: string, type: Toast['type'] = 'info', duration = 3000) => {
    const id = `toast-${++toastIdCounter}`
    const toast: Toast = { id, message, type, duration }
    // Create new array for Vue reactivity tracking
    toasts.value = [...toasts.value, toast]

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, duration)
    }

    return id
  }

  const dismiss = (id: string) => {
    // Filter creates new array ensuring Vue reactivity
    toasts.value = toasts.value.filter((t) => t.id !== id)
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
