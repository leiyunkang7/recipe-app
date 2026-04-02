import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'

// Mock Vue lifecycle hooks
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: vi.fn((cb: () => void) => cb()),
    onUnmounted: vi.fn(),
  }
})

describe('useEnterAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('should initialize with isEntered as false', async () => {
    const { useEnterAnimation } = await import('./useEnterAnimation')
    const { isEntered } = useEnterAnimation()

    expect(isEntered.value).toBe(false)
  })

  it('should set isEntered to true after default delay (50ms)', async () => {
    const { useEnterAnimation } = await import('./useEnterAnimation')
    const { isEntered, startAnimation } = useEnterAnimation()

    startAnimation()
    expect(isEntered.value).toBe(false)

    vi.advanceTimersByTime(50)
    expect(isEntered.value).toBe(true)
  })

  it('should set isEntered to true immediately when immediate option is true', async () => {
    const { useEnterAnimation } = await import('./useEnterAnimation')
    const { isEntered } = useEnterAnimation({ immediate: true })

    // With immediate: true, isEntered should be true right away
    expect(isEntered.value).toBe(true)
  })

  it('should respect custom delay option', async () => {
    const { useEnterAnimation } = await import('./useEnterAnimation')
    const { isEntered, startAnimation } = useEnterAnimation({ delay: 200 })

    startAnimation()
    expect(isEntered.value).toBe(false)

    vi.advanceTimersByTime(100)
    expect(isEntered.value).toBe(false)

    vi.advanceTimersByTime(100)
    expect(isEntered.value).toBe(true)
  })

  it('should clear previous timeout when startAnimation is called multiple times', async () => {
    const { useEnterAnimation } = await import('./useEnterAnimation')
    const { isEntered, startAnimation } = useEnterAnimation({ delay: 100 })

    startAnimation()
    vi.advanceTimersByTime(50)
    expect(isEntered.value).toBe(false)

    // Call startAnimation again before the first one completes
    startAnimation()
    vi.advanceTimersByTime(50)
    expect(isEntered.value).toBe(false)

    // Complete the second animation
    vi.advanceTimersByTime(50)
    expect(isEntered.value).toBe(true)
  })

  it('should reset isEntered to false and clear timeout', async () => {
    const { useEnterAnimation } = await import('./useEnterAnimation')
    const { isEntered, startAnimation, resetAnimation } = useEnterAnimation({ delay: 100 })

    startAnimation()
    vi.advanceTimersByTime(50)
    expect(isEntered.value).toBe(false)

    resetAnimation()
    expect(isEntered.value).toBe(false)

    // Should not trigger after original timeout
    vi.advanceTimersByTime(100)
    expect(isEntered.value).toBe(false)
  })

  it('should handle startAnimation after reset', async () => {
    const { useEnterAnimation } = await import('./useEnterAnimation')
    const { isEntered, startAnimation, resetAnimation } = useEnterAnimation({ delay: 50 })

    startAnimation()
    vi.advanceTimersByTime(50)
    expect(isEntered.value).toBe(true)

    resetAnimation()
    expect(isEntered.value).toBe(false)

    startAnimation()
    expect(isEntered.value).toBe(false)

    vi.advanceTimersByTime(50)
    expect(isEntered.value).toBe(true)
  })

  it('should call onMounted to trigger animation start', async () => {
    const { useEnterAnimation } = await import('./useEnterAnimation')
    const { isEntered } = useEnterAnimation()

    // The composable calls startAnimation on mount via onMounted
    // With default delay (50ms), isEntered should become true after timer advances
    vi.advanceTimersByTime(50)
    expect(isEntered.value).toBe(true)
  })

  it('should not start animation if unmounted before delay completes', async () => {
    const { useEnterAnimation } = await import('./useEnterAnimation')
    const { isEntered, resetAnimation } = useEnterAnimation({ delay: 100 })

    // Advance time partially
    vi.advanceTimersByTime(50)

    // Reset before the animation completes
    resetAnimation()

    // Complete the original timeout
    vi.advanceTimersByTime(50)

    // isEntered should still be false because we reset
    expect(isEntered.value).toBe(false)
  })

  it('should use default delay of 50ms when not specified', async () => {
    const { useEnterAnimation } = await import('./useEnterAnimation')
    const { isEntered, startAnimation } = useEnterAnimation()

    startAnimation()

    vi.advanceTimersByTime(49)
    expect(isEntered.value).toBe(false)

    vi.advanceTimersByTime(1)
    expect(isEntered.value).toBe(true)
  })

  it('should handle zero delay correctly', async () => {
    const { useEnterAnimation } = await import('./useEnterAnimation')
    const { isEntered, startAnimation } = useEnterAnimation({ delay: 0 })

    startAnimation()
    vi.advanceTimersByTime(0)

    expect(isEntered.value).toBe(true)
  })

  it('should not set isEntered if unmounted before delay completes', async () => {
    // This test verifies that the isMounted flag prevents state updates after unmount
    const { useEnterAnimation } = await import('./useEnterAnimation')
    const { isEntered, startAnimation, resetAnimation } = useEnterAnimation({ delay: 100 })

    // Start animation
    startAnimation()
    expect(isEntered.value).toBe(false)

    // Reset (simulates unmount behavior - sets isMounted to false)
    resetAnimation()
    expect(isEntered.value).toBe(false)

    // Even if the original timeout fires, isEntered should remain false
    vi.advanceTimersByTime(100)
    expect(isEntered.value).toBe(false)
  })

  it('should prevent multiple rapid startAnimation calls from causing race conditions', async () => {
    const { useEnterAnimation } = await import('./useEnterAnimation')
    const { isEntered, startAnimation } = useEnterAnimation({ delay: 50 })

    // Start animation multiple times in rapid succession
    startAnimation()
    startAnimation()
    startAnimation()

    vi.advanceTimersByTime(50)

    // Should only be true once
    expect(isEntered.value).toBe(true)
  })

  it('should handle startAnimation after reset correctly', async () => {
    const { useEnterAnimation } = await import('./useEnterAnimation')
    const { isEntered, startAnimation, resetAnimation } = useEnterAnimation({ delay: 50 })

    // First cycle
    startAnimation()
    vi.advanceTimersByTime(50)
    expect(isEntered.value).toBe(true)

    // Reset and start again
    resetAnimation()
    expect(isEntered.value).toBe(false)

    startAnimation()
    vi.advanceTimersByTime(50)
    expect(isEntered.value).toBe(true)
  })
})