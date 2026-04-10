import { useAuth } from './useAuth'
import { useOfflineSyncQueue } from './useOfflineSyncQueue'
import { useOfflineRecipes } from './useOfflineRecipes'

export interface SyncState {
  lastSyncedAt: Date | null
  isOnline: boolean
  pendingChanges: number
  isSyncing: boolean
  syncError: string | null
}

export const useSyncManager = () => {
  const { isAuthenticated, user } = useAuth()
  const syncQueue = useOfflineSyncQueue()
  const _offlineRecipes = useOfflineRecipes()

  const syncState = reactive<SyncState>({
    lastSyncedAt: null,
    isOnline: true,
    pendingChanges: 0,
    isSyncing: false,
    syncError: null,
  })

  let _realtimeSubscription: { unsubscribe: () => void } | null = null

  const updateOnlineStatus = () => {
    syncState.isOnline = navigator.onLine
  }

  const loadPendingCount = async () => {
    if (syncQueue.isSupported.value) {
      syncState.pendingChanges = await syncQueue.getPendingCount()
    }
  }

  const syncFavorites = async (): Promise<boolean> => {
    if (!isAuthenticated.value || !syncState.isOnline) {
      return false
    }

    syncState.isSyncing = true
    syncState.syncError = null

    try {
      const result = await syncQueue.syncAll()

      if (result.failed > 0 && result.success === 0) {
        syncState.syncError = 'Sync failed. Will retry when online.'
        return false
      }

      syncState.lastSyncedAt = new Date()
      syncState.pendingChanges = await syncQueue.getPendingCount()

      return result.success > 0 || result.failed === 0
    } catch (error) {
      syncState.syncError = error instanceof Error ? error.message : 'Sync failed'
      return false
    } finally {
      syncState.isSyncing = false
    }
  }

  const queueFavoriteAdd = async (recipeId: string) => {
    if (!syncQueue.isSupported.value) return

    await syncQueue.addOperation('add-favorite', { recipeId })
    await loadPendingCount()

    if (syncState.isOnline && isAuthenticated.value) {
      await syncFavorites()
    }
  }

  const queueFavoriteRemove = async (recipeId: string) => {
    if (!syncQueue.isSupported.value) return

    await syncQueue.addOperation('remove-favorite', { recipeId })
    await loadPendingCount()

    if (syncState.isOnline && isAuthenticated.value) {
      await syncFavorites()
    }
  }

  const handleRealtimeUpdate = async (payload: { eventType: string; table: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
    if (payload.table !== 'recipe_favorites') return
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      if (payload.new.user_id === user.value?.id) {
        // Refresh favorites when changes come from other devices
        if (syncState.isOnline) {
          // Don't trigger a full sync, just refresh the local state
          const pendingCount = await syncQueue.getPendingCount()
          if (pendingCount === 0) {
            // No pending local changes, safe to refresh
            syncState.lastSyncedAt = new Date()
          }
        }
      }
    }
  }

  const subscribeToRealtime = async () => {
    if (!isAuthenticated.value || !syncState.isOnline) return

    // Unsubscribe from previous subscription if exists
    if (_realtimeSubscription) {
      _realtimeSubscription.unsubscribe()
      _realtimeSubscription = null
    }

    try {
      const supabase = useSupabaseClient()

      _realtimeSubscription = supabase
        .channel('favorites-sync')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'recipe_favorites',
            filter: `user_id=eq.${user.value?.id}`,
          },
          handleRealtimeUpdate
        )
        .subscribe()
    } catch (error) {
      console.error('[useSyncManager] Failed to subscribe to realtime:', error)
    }
  }

  const unsubscribeFromRealtime = () => {
    if (_realtimeSubscription) {
      _realtimeSubscription.unsubscribe()
      _realtimeSubscription = null
    }
  }

  const initSync = async () => {
    updateOnlineStatus()
    await loadPendingCount()

    if (isAuthenticated.value && syncState.isOnline) {
      await syncFavorites()
      await subscribeToRealtime()
    }
  }

  const handleOnline = async () => {
    syncState.isOnline = true
    await loadPendingCount()

    if (syncState.pendingChanges > 0) {
      await syncFavorites()
    }

    if (isAuthenticated.value) {
      await subscribeToRealtime()
    }
  }

  const handleOffline = () => {
    syncState.isOnline = false
    unsubscribeFromRealtime()
  }

  onMounted(async () => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Listen for SW sync trigger messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'TRIGGER_SYNC') {
          syncFavorites()
        }
      })
    }

    await initSync()
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    unsubscribeFromRealtime()
  })

  watch(isAuthenticated, async (isAuth) => {
    if (isAuth && syncState.isOnline) {
      await subscribeToRealtime()
    } else {
      unsubscribeFromRealtime()
    }
  })

  return {
    syncState: readonly(syncState),
    syncFavorites,
    queueFavoriteAdd,
    queueFavoriteRemove,
    subscribeToRealtime,
    unsubscribeFromRealtime,
    loadPendingCount,
    initSync,
  }
}
