import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useToast } from './useToast'
import type { Toast } from './useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create a toast with id and return it', () => {
    const { show, toasts } = useToast()

    const id = show('Test message', 'info')

    expect(id).toBe('toast-1')
    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Test message')
    expect(toasts.value[0].type).toBe('info')
  })

  it('should create toast with different types', () => {
    const { show, toasts } = useToast()

    const idSuccess = show('Success message', 'success')
    const idError = show('Error message', 'error')
    const idWarning = show('Warning message', 'warning')

    expect(toasts.value).toHaveLength(3)
    expect(toasts.value[0].type).toBe('success')
    expect(toasts.value[1].type).toBe('error')
    expect(toasts.value[2].type).toBe('warning')
  })

  it('should auto-dismiss toast after duration', () => {
    const { show, toasts } = useToast()

    show('Auto dismiss', 'info', 3000)

    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(3000)

    expect(toasts.value).toHaveLength(0)
  })

  it('should not auto-dismiss when duration is 0', () => {
    const { show, toasts } = useToast()

    show('Persistent toast', 'info', 0)

    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(10000)

    expect(toasts.value).toHaveLength(1)
  })

  it('should dismiss a specific toast by id', () => {
    const { show, dismiss, toasts } = useToast()

    const id1 = show('First toast', 'info')
    const id2 = show('Second toast', 'success')

    expect(toasts.value).toHaveLength(2)

    dismiss(id1)

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].id).toBe(id2)
  })

  it('should dismiss all toasts', () => {
    const { show, dismissAll, toasts } = useToast()

    show('First toast', 'info')
    show('Second toast', 'success')
    show('Third toast', 'warning')

    expect(toasts.value).toHaveLength(3)

    dismissAll()

    expect(toasts.value).toHaveLength(0)
  })

  it('should provide shorthand methods for each type', () => {
    const { info, success, error, warning, toasts } = useToast()

    info('Info message')
    success('Success message')
    error('Error message')
    warning('Warning message')

    expect(toasts.value).toHaveLength(4)
    expect(toasts.value[0].type).toBe('info')
    expect(toasts.value[1].type).toBe('success')
    expect(toasts.value[2].type).toBe('error')
    expect(toasts.value[3].type).toBe('warning')
  })

  it('should handle dismiss for non-existent id gracefully', () => {
    const { dismiss, toasts } = useToast()

    // Should not throw
    dismiss('non-existent-id')

    expect(toasts.value).toHaveLength(0)
  })
})