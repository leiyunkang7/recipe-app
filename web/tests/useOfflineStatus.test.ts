import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock window and navigator for SSR environment
const mockOnlineHandler = vi.fn()
const mockOfflineHandler = vi.fn()

const createWindowMock = (online: boolean = true) => {
  const listeners: Record<string, Function[]> = { online: [], offline: [] }

  return {
    addEventListener: vi.fn((event: string, handler: Function) => {
      listeners[event].push(handler)
      if (event === 'online') mockOnlineHandler.mockImplementation(handler)
      if (event === 'offline') mockOfflineHandler.mockImplementation(handler)
    }),
    removeEventListener: vi.fn((event: string, handler: Function) => {
      listeners[event] = listeners[event].filter(h => h !== handler)
    }),
    navigator: {
      onLine: online,
    },
    dispatchEvent: vi.fn((event: Event) => {
      const eventType = (event as any).type
      if (listeners[eventType]) {
        listeners[eventType].forEach(handler => handler())
      }
      return true
    }),
    listeners,
  }
}

// Store original values
const originalImportMeta = { ...import.meta }

describe('useOfflineStatus', () => {
  let windowMock: ReturnType<typeof createWindowMock>

  beforeEach(() => {
    vi.clearAllMocks()
    windowMock = createWindowMock(true)

    // Mock import.meta.client
    Object.defineProperty(import.meta, 'client', { value: true, writable: true })
  })

  afterEach(() => {
    // Restore original import.meta
    Object.assign(import.meta, originalImportMeta)
  })

  it('should return isOffline as false when online', async () => {
    windowMock = createWindowMock(true)

    vi.stubGlobal('window', windowMock)

    const { useOfflineStatus } = await import('../app/composables/useOfflineStatus')
    const { isOffline } = useOfflineStatus()

    expect(isOffline.value).toBe(false)
  })

  it('should return isOffline as true when offline', async () => {
    windowMock = createWindowMock(false)

    vi.stubGlobal('window', windowMock)

    const { useOfflineStatus } = await import('../app/composables/useOfflineStatus')
    const { isOffline } = useOfflineStatus()

    expect(isOffline.value).toBe(true)
  })

  it('should add event listeners for online and offline events', async () => {
    windowMock = createWindowMock(true)
    vi.stubGlobal('window', windowMock)

    await import('../app/composables/useOfflineStatus')

    expect(windowMock.addEventListener).toHaveBeenCalledWith('online', expect.any(Function))
    expect(windowMock.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
  })

  it('should update isOffline to false when online event fires', async () => {
    windowMock = createWindowMock(false)
    vi.stubGlobal('window', windowMock)

    const { useOfflineStatus } = await import('../app/composables/useOfflineStatus')
    const { isOffline } = useOfflineStatus()

    expect(isOffline.value).toBe(true)

    // Simulate online event
    windowMock.dispatchEvent(new Event('online'))

    expect(isOffline.value).toBe(false)
  })

  it('should update isOffline to true when offline event fires', async () => {
    windowMock = createWindowMock(true)
    vi.stubGlobal('window', windowMock)

    const { useOfflineStatus } = await import('../app/composables/useOfflineStatus')
    const { isOffline } = useOfflineStatus()

    expect(isOffline.value).toBe(false)

    // Simulate offline event
    windowMock.dispatchEvent(new Event('offline'))

    expect(isOffline.value).toBe(true)
  })

  it('should not access window on server side', async () => {
    // Set client to false (simulating SSR)
    Object.defineProperty(import.meta, 'client', { value: false, writable: true })

    const { useOfflineStatus } = await import('../app/composables/useOfflineStatus')
    const { isOffline } = useOfflineStatus()

    // On server side, isOffline should be false by default
    expect(isOffline.value).toBe(false)
  })
})