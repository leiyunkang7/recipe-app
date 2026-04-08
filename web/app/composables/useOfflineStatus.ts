export interface CacheStats {
  cacheName: string
  entryCount: number
  estimatedSize?: string
}

export const useOfflineStatus = () => {
  const isOffline = ref(false)
  const syncStatus = ref<'idle' | 'syncing' | 'error'>('idle')
  const lastOnlineAt = ref<Date | null>(null)
  const isServiceWorkerAvailable = ref(false)
  const isUpdateAvailable = ref(false)
  const registration = ref<ServiceWorkerRegistration | null>(null)

  const updateOnlineStatus = () => {
    isOffline.value = !navigator.onLine
    if (navigator.onLine) {
      lastOnlineAt.value = new Date()
    }
  }

  const checkServiceWorkerStatus = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready
        registration.value = reg
        isServiceWorkerAvailable.value = !!reg.active

        if (reg.active) {
          reg.addEventListener('updatefound', () => {
            isUpdateAvailable.value = true
          })
        }
      } catch {
        isServiceWorkerAvailable.value = false
      }
    } else {
      isServiceWorkerAvailable.value = false
    }
  }

  const applyUpdate = async () => {
    if (registration.value?.waiting) {
      registration.value.waiting.postMessage({ type: 'SKIP_WAITING' })
      isUpdateAvailable.value = false
      window.location.reload()
    }
  }

  const clearCache = async (cacheNames?: string[]) => {
    if (!('caches' in window)) return
    try {
      if (cacheNames && cacheNames.length > 0) {
        for (const name of cacheNames) {
          await caches.delete(name)
        }
      } else {
        const keys = await caches.keys()
        await Promise.all(keys.map(key => caches.delete(key)))
      }
    } catch (error) {
      console.error('Failed to clear cache:', error)
    }
  }

  const getCacheStorageInfo = async (): Promise<CacheStats[] | null> => {
    if (!('caches' in window)) return null
    try {
      const cacheNames = await caches.keys()
      const cacheInfo: CacheStats[] = []
      for (const name of cacheNames) {
        const cache = await caches.open(name)
        const keys = await cache.keys()
        const estimatedBytes = keys.length * 5000
        const estimatedSize = estimatedBytes > 1024 * 1024
          ? (estimatedBytes / (1024 * 1024)).toFixed(1) + ' MB'
          : (estimatedBytes / 1024).toFixed(1) + ' KB'
        cacheInfo.push({ cacheName: name, entryCount: keys.length, estimatedSize })
      }
      return cacheInfo
    } catch {
      return null
    }
  }

  const registerBackgroundSync = async (tag: string = 'sync-data') => {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const reg = await navigator.serviceWorker.ready
        await reg.sync.register(tag)
        syncStatus.value = 'syncing'
        return true
      } catch {
        syncStatus.value = 'error'
        return false
      }
    }
    return false
  }

  const sendSWMessage = async (message: Record<string, unknown>): Promise<unknown> => {
    if (!registration.value?.active) return null
    return new Promise((resolve) => {
      const channel = new MessageChannel()
      channel.port1.onmessage = (event) => resolve(event.data)
      registration.value!.active!.postMessage(message, [channel.port2])
    })
  }

  const prefetchForOffline = async (routes: string[]) => {
    if (!('caches' in window)) return
    try {
      const cache = await caches.open('prefetch-v1')
      await Promise.all(
        routes.map(async (route) => {
          try {
            await cache.add(route)
          } catch {
          }
        })
      )
    } catch {
    }
  }

  onMounted(() => {
    updateOnlineStatus()
    checkServiceWorkerStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_STATUS') {
          syncStatus.value = event.data.status
        }
        if (event.data?.type === 'UPDATE_AVAILABLE') {
          isUpdateAvailable.value = true
        }
      })
    }
  })

  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  })

  return {
    isOffline,
    syncStatus,
    lastOnlineAt,
    isServiceWorkerAvailable,
    isUpdateAvailable,
    clearCache,
    getCacheStorageInfo,
    registerBackgroundSync,
    applyUpdate,
    sendSWMessage,
    prefetchForOffline,
  }
}