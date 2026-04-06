import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useToast } from './useToast'

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

    show('Success message', 'success')
    show('Error message', 'error')
    show('Warning message', 'warning')

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

  it('should use default duration when not specified for shorthand methods', () => {
    const { info, toasts } = useToast()

    info('Test message')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].duration).toBe(3000) // default duration
  })

  it('should allow custom duration with shorthand methods', () => {
    const { success, toasts } = useToast()

    success('Custom duration', 5000)

    expect(toasts.value[0].duration).toBe(5000)
  })

  it('should auto-dismiss correct toast when multiple exist with different durations', () => {
    const { show, toasts } = useToast()

    show('Short lived', 'info', 1000)
    show('Long lived', 'success', 5000)

    expect(toasts.value).toHaveLength(2)

    // Advance time by 1500ms - only first toast should be dismissed
    vi.advanceTimersByTime(1500)

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Long lived')
  })

  it('should handle multiple rapid dismiss calls correctly', () => {
    const { show, dismiss, toasts } = useToast()

    const id1 = show('First', 'info')
    const id2 = show('Second', 'info')
    const id3 = show('Third', 'info')

    expect(toasts.value).toHaveLength(3)

    // Dismiss in different order
    dismiss(id2)
    dismiss(id3)
    dismiss(id1)

    expect(toasts.value).toHaveLength(0)
  })

  it('should dismiss toast and then allow new toasts to be created', () => {
    const { show, dismiss, toasts } = useToast()

    const id1 = show('First', 'info')
    dismiss(id1)

    expect(toasts.value).toHaveLength(0)

    const id2 = show('After dismiss', 'info')

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].id).toBe(id2)
    expect(toasts.value[0].message).toBe('After dismiss')
  })

  it('should generate sequential IDs for multiple toasts', () => {
    const { show, toasts } = useToast()

    const id1 = show('First', 'info')
    const id2 = show('Second', 'info')
    const id3 = show('Third', 'info')

    expect(id1).toBe('toast-1')
    expect(id2).toBe('toast-2')
    expect(id3).toBe('toast-3')
    expect(toasts.value).toHaveLength(3)
  })

  it('should auto-dismiss toasts in order when they have different durations', () => {
    const { show, toasts } = useToast()

    // Create toasts with different durations
    show('Short', 'info', 1000)  // toast-1
    show('Medium', 'info', 2000)  // toast-2
    show('Long', 'info', 3000)    // toast-3

    expect(toasts.value).toHaveLength(3)

    // Advance time by 1500ms - only first toast should be dismissed
    vi.advanceTimersByTime(1500)

    expect(toasts.value).toHaveLength(2)
    expect(toasts.value[0].message).toBe('Medium')
    expect(toasts.value[1].message).toBe('Long')

    // Advance time by another 1000ms (2500ms total) - second toast should be dismissed
    vi.advanceTimersByTime(1000)

    expect(toasts.value).toHaveLength(1)
    expect(toasts.value[0].message).toBe('Long')
  })

  it('should dismissAll clear all toasts including those with auto-dismiss timers', () => {
    const { show, dismissAll, toasts } = useToast()

    show('Toast 1', 'info', 5000)
    show('Toast 2', 'info', 5000)
    show('Toast 3', 'info', 5000)

    expect(toasts.value).toHaveLength(3)

    dismissAll()

    expect(toasts.value).toHaveLength(0)

    // Advance timers - should not recreate toasts
    vi.advanceTimersByTime(5000)

    expect(toasts.value).toHaveLength(0)
  })

  it('should maintain correct toast order after dismissing middle toast', () => {
    const { show, dismiss, toasts } = useToast()

    show('First', 'info')
    const id2 = show('Second', 'info')
    show('Third', 'info')

    expect(toasts.value[0].message).toBe('First')
    expect(toasts.value[1].message).toBe('Second')
    expect(toasts.value[2].message).toBe('Third')

    dismiss(id2)

    expect(toasts.value).toHaveLength(2)
    expect(toasts.value[0].message).toBe('First')
    expect(toasts.value[1].message).toBe('Third')
  })
})