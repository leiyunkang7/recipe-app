/**
 * useCacheManager - 统一缓存管理 Composable
 *
 * 提供统一的接口来管理：
 * 1. Service Worker 浏览器缓存 (Cache API)
 * 2. IndexedDB 离线数据存储
 *
 * 支持：
 * - 查看缓存存储信息
 * - 清除浏览器缓存
 * - 清除 IndexedDB 离线数据
 * - 清除所有离线数据（两者）
 * - 获取缓存版本信息
 */

import { useOfflineRecipes } from './useOfflineRecipes'

export interface CacheInfo {
  swCaches: string[]
  idbDatabases: string[]
}

export interface ClearResult {
  success: boolean
  cleared?: string
  error?: string
}

export const useCacheManager = () => {
  const offlineRecipes = useOfflineRecipes()

  const isClearing = ref(false)
  const cacheInfo = ref<CacheInfo | null>(null)
  const recipeCacheStats = ref<{
    recipesCount: number
    listCount: number
    favoritesCount: number
    totalSize: string
  } | null>(null)

  // Get SW registration
  const getSWRegistration = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) return null
    try {
      return await navigator.serviceWorker.ready
    } catch {
      return null
    }
  }

  // Send message to Service Worker and get response
  const sendSWMessage = async <T = unknown>(message: Record<string, unknown>): Promise<T | null> => {
    const reg = await getSWRegistration()
    if (!reg?.active) return null

    return new Promise((resolve) => {
      const channel = new MessageChannel()
      channel.port1.onmessage = (event) => resolve(event.data as T)
      reg.active!.postMessage(message, [channel.port2])
    })
  }

  // Get combined cache info from both SW and IndexedDB
  const getCacheInfo = async (): Promise<CacheInfo | null> => {
    try {
      const result = await sendSWMessage<CacheInfo & { success: boolean }>({ type: 'GET_CACHE_INFO' })
      if (result?.success) {
        cacheInfo.value = { swCaches: result.swCaches || [], idbDatabases: result.idbDatabases || [] }
        return cacheInfo.value
      }
    } catch {
      // fallback: try getting from offlineRecipes
    }
    return null
  }

  // Get IndexedDB stats from useOfflineRecipes
  const getRecipeCacheStats = async () => {
    try {
      if (offlineRecipes.isInitialized.value) {
        recipeCacheStats.value = await offlineRecipes.getCacheStats()
      }
    } catch {
      recipeCacheStats.value = null
    }
  }

  // Clear browser caches only
  const clearBrowserCaches = async (): Promise<ClearResult> => {
    isClearing.value = true
    try {
      const result = await sendSWMessage<ClearResult>({ type: 'CLEAR_CACHE' })
      if (result?.success) {
        return { success: true, cleared: 'browser-caches' }
      }
      return { success: false, error: 'Service worker not available' }
    } catch (err) {
      return { success: false, error: String(err) }
    } finally {
      isClearing.value = false
    }
  }

  // Clear IndexedDB offline data only
  const clearIndexedDB = async (): Promise<ClearResult> => {
    isClearing.value = true
    try {
      const result = await sendSWMessage<ClearResult>({ type: 'CLEAR_INDEXED_DB' })
      if (result?.success) {
        recipeCacheStats.value = null
        return { success: true, cleared: 'indexed-db' }
      }
      // Fallback: clear via useOfflineRecipes
      if (offlineRecipes.isInitialized.value) {
        await offlineRecipes.clearAllCache()
        recipeCacheStats.value = null
        return { success: true, cleared: 'indexed-db' }
      }
      return { success: false, error: 'Service worker not available' }
    } catch (err) {
      return { success: false, error: String(err) }
    } finally {
      isClearing.value = false
    }
  }

  // Clear all offline data (both browser caches and IndexedDB)
  const clearAllOfflineData = async (): Promise<ClearResult> => {
    isClearing.value = true
    try {
      // Clear SW caches
      await clearBrowserCaches()
      // Clear IndexedDB
      const idbResult = await clearIndexedDB()
      recipeCacheStats.value = null
      cacheInfo.value = null
      return { success: true, cleared: 'all' }
    } catch (err) {
      return { success: false, error: String(err) }
    } finally {
      isClearing.value = false
    }
  }

  // Get SW cache version
  const getVersion = async (): Promise<string | null> => {
    try {
      const result = await sendSWMessage<{ version: string }>({ type: 'GET_VERSION' })
      return result?.version ?? null
    } catch {
      return null
    }
  }

  // Prefetch routes for offline use
  const prefetchRoutes = async (routes: string[]): Promise<{ success: boolean; count: number }> => {
    try {
      const result = await sendSWMessage<{ success: boolean; count: number }>({ type: 'PREFETCH_ROUTES', routes })
      return result ?? { success: false, count: 0 }
    } catch {
      return { success: false, count: 0 }
    }
  }

  // Refresh all cache info (both SW and IndexedDB)
  const refreshCacheInfo = async () => {
    await Promise.all([getCacheInfo(), getRecipeCacheStats()])
  }

  // Total estimated size string
  const totalEstimatedSize = computed(() => {
    const idb = recipeCacheStats.value?.totalSize ?? '0 KB'
    // SW cache size is estimated
    const swCount = cacheInfo.value?.swCaches.length ?? 0
    if (swCount === 0) return idb
    return idb // SW cache sizes are managed by browser
  })

  onMounted(async () => {
    await refreshCacheInfo()
  })

  return {
    isClearing: readonly(isClearing),
    cacheInfo: readonly(cacheInfo),
    recipeCacheStats: readonly(recipeCacheStats),
    totalEstimatedSize,
    getCacheInfo,
    getRecipeCacheStats,
    clearBrowserCaches,
    clearIndexedDB,
    clearAllOfflineData,
    getVersion,
    prefetchRoutes,
    refreshCacheInfo,
  }
}
