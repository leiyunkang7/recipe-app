import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'

// Store the actual lifecycle hook calls to invoke them manually
let mountedCallback: (() => void) | null = null
let unmountedCallback: (() => void) | null = null

// Mock Vue lifecycle hooks to capture and allow manual triggering
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual,
    onMounted: vi.fn((cb: () => void) => {
      mountedCallback = cb
    }),
    onUnmounted: vi.fn((cb: () => void) => {
      unmountedCallback = cb
    }),
  }
})

describe('useClickOutside', () => {
  let mockAddEventListener: ReturnType<typeof vi.fn>
  let mockRemoveEventListener: ReturnType<typeof vi.fn>
  let capturedHandler: ((event: MouseEvent) => void) | null = null

  beforeEach(() => {
    vi.clearAllMocks()
    mountedCallback = null
    unmountedCallback = null
    capturedHandler = null

    mockAddEventListener = vi.fn((_event: string, handler: Function) => {
      capturedHandler = handler as ((event: MouseEvent) => void)
    })
    mockRemoveEventListener = vi.fn()

    vi.stubGlobal('document', {
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should add click event listener on mount', async () => {
    const targetRef = ref<HTMLElement | null>(null)
    const callback = vi.fn()

    const { useClickOutside } = await import('./useClickOutside')
    useClickOutside(targetRef, callback)

    // Trigger the mounted callback
    expect(mountedCallback).not.toBeNull()
    mountedCallback!()

    expect(mockAddEventListener).toHaveBeenCalledWith('click', expect.any(Function), false)
  })

  it('should call callback when clicking outside target element', async () => {
    const targetRef = ref<HTMLElement | null>(null)
    const callback = vi.fn()

    const { useClickOutside } = await import('./useClickOutside')
    useClickOutside(targetRef, callback)

    // Trigger mount and capture the handler
    mountedCallback!()

    // Create a mock target element
    const mockTarget = document.createElement('div')
    targetRef.value = mockTarget

    // Create a mock event with a different target (outside the target)
    const mockEvent = {
      target: document.createElement('div'),
    } as unknown as MouseEvent

    // Simulate the click event
    capturedHandler!(mockEvent)

    expect(callback).toHaveBeenCalledWith(mockEvent)
  })

  it('should not call callback when clicking inside target element', async () => {
    const targetRef = ref<HTMLElement | null>(null)
    const callback = vi.fn()

    const { useClickOutside } = await import('./useClickOutside')
    useClickOutside(targetRef, callback)

    // Trigger mount and capture the handler
    mountedCallback!()

    // Create a mock target element with a child
    const mockTarget = document.createElement('div')
    const mockChild = document.createElement('span')
    mockTarget.appendChild(mockChild)
    targetRef.value = mockTarget

    // Create a mock event with target being the child of targetRef
    const mockEvent = {
      target: mockChild,
    } as unknown as MouseEvent

    // Simulate the click event
    capturedHandler!(mockEvent)

    expect(callback).not.toHaveBeenCalled()
  })

  it('should not call callback when targetRef is null', async () => {
    const targetRef = ref<HTMLElement | null>(null)
    const callback = vi.fn()

    const { useClickOutside } = await import('./useClickOutside')
    useClickOutside(targetRef, callback)

    // Trigger mount and capture the handler
    mountedCallback!()

    // targetRef is still null
    const mockEvent = {
      target: document.createElement('div'),
    } as unknown as MouseEvent

    // Simulate the click event
    capturedHandler!(mockEvent)

    expect(callback).not.toHaveBeenCalled()
  })

  it('should remove click event listener on unmount', async () => {
    const targetRef = ref<HTMLElement | null>(null)
    const callback = vi.fn()

    const { useClickOutside } = await import('./useClickOutside')
    useClickOutside(targetRef, callback)

    // Trigger mount
    mountedCallback!()

    expect(mockAddEventListener).toHaveBeenCalledTimes(1)

    // Trigger unmount
    unmountedCallback!()

    expect(mockRemoveEventListener).toHaveBeenCalledWith('click', expect.any(Function), false)
  })

  it('should use capture option when provided', async () => {
    const targetRef = ref<HTMLElement | null>(null)
    const callback = vi.fn()

    const { useClickOutside } = await import('./useClickOutside')
    useClickOutside(targetRef, callback, { capture: true })

    // Trigger mount
    mountedCallback!()

    expect(mockAddEventListener).toHaveBeenCalledWith('click', expect.any(Function), true)
  })

  it('should use bubble option (capture: false) by default', async () => {
    const targetRef = ref<HTMLElement | null>(null)
    const callback = vi.fn()

    const { useClickOutside } = await import('./useClickOutside')
    useClickOutside(targetRef, callback)

    // Trigger mount
    mountedCallback!()

    expect(mockAddEventListener).toHaveBeenCalledWith('click', expect.any(Function), false)
  })

  it('should handle multiple clicks correctly', async () => {
    const targetRef = ref<HTMLElement | null>(null)
    const callback = vi.fn()

    const { useClickOutside } = await import('./useClickOutside')
    useClickOutside(targetRef, callback)

    // Trigger mount
    mountedCallback!()

    // Create target element
    const mockTarget = document.createElement('div')
    targetRef.value = mockTarget

    // Simulate multiple outside clicks
    const event1 = { target: document.createElement('div') } as unknown as MouseEvent
    const event2 = { target: document.createElement('div') } as unknown as MouseEvent
    const event3 = { target: document.createElement('div') } as unknown as MouseEvent

    capturedHandler!(event1)
    capturedHandler!(event2)
    capturedHandler!(event3)

    expect(callback).toHaveBeenCalledTimes(3)
  })
})