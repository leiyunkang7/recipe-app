import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const createNavigatorMock = (online: boolean) => ({
  onLine: online,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})

describe('useOfflineStatus', () => {
  let navigatorMock: ReturnType<typeof createNavigatorMock>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return isOffline as false when online', async () => {
    navigatorMock = createNavigatorMock(true)
    vi.stubGlobal('navigator', navigatorMock)

    const { useOfflineStatus } = await import('./useOfflineStatus')
    const { isOffline } = useOfflineStatus()

    expect(isOffline.value).toBe(false)
  })

  it('should return isOffline as true when offline', async () => {
    navigatorMock = createNavigatorMock(false)
    vi.stubGlobal('navigator', navigatorMock)

    const { useOfflineStatus } = await import('./useOfflineStatus')
    const { isOffline } = useOfflineStatus()

    expect(isOffline.value).toBe(true)
  })

  it('should add event listeners for online and offline events', async () => {
    navigatorMock = createNavigatorMock(true)
    vi.stubGlobal('navigator', navigatorMock)

    await import('./useOfflineStatus')

    expect(navigatorMock.addEventListener).toHaveBeenCalledTimes(2)
    expect(navigatorMock.addEventListener).toHaveBeenCalledWith('online', expect.any(Function))
    expect(navigatorMock.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
  })

  it('should update isOffline to false when online event fires', async () => {
    navigatorMock = createNavigatorMock(false)
    vi.stubGlobal('navigator', navigatorMock)

    const { useOfflineStatus } = await import('./useOfflineStatus')
    const { isOffline } = useOfflineStatus()

    expect(isOffline.value).toBe(true)

    // Find and call the online handler
    const onlineHandler = navigatorMock.addEventListener.mock.calls.find(
      (call: any[]) => call[0] === 'online'
    )?.[1]

    if (onlineHandler) {
      onlineHandler()
    }

    expect(isOffline.value).toBe(false)
  })

  it('should update isOffline to true when offline event fires', async () => {
    navigatorMock = createNavigatorMock(true)
    vi.stubGlobal('navigator', navigatorMock)

    const { useOfflineStatus } = await import('./useOfflineStatus')
    const { isOffline } = useOfflineStatus()

    expect(isOffline.value).toBe(false)

    // Find and call the offline handler
    const offlineHandler = navigatorMock.addEventListener.mock.calls.find(
      (call: any[]) => call[0] === 'offline'
    )?.[1]

    if (offlineHandler) {
      offlineHandler()
    }

    expect(isOffline.value).toBe(true)
  })
})