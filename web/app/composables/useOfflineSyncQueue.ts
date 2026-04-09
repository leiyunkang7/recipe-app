import type { RecipeListItem } from '~/types'

export type SyncOperationType = 'add-favorite' | 'remove-favorite' | 'create-folder' | 'delete-folder' | 'rename-folder' | 'move-favorite'

export interface SyncOperation {
  id: string
  type: SyncOperationType
  payload: Record<string, unknown>
  timestamp: number
  retryCount: number
  status: 'pending' | 'syncing' | 'failed'
}

const DB_NAME = 'recipe-app-sync-queue'
const DB_VERSION = 1
const STORE_NAME = 'operations'

export const useOfflineSyncQueue = () => {
  const isSupported = ref(false)
  const isInitialized = ref(false)
  const db = ref<IDBDatabase | null>(null)
  const pendingOperations = ref<SyncOperation[]>([])
  const isSyncing = ref(false)

  const checkSupport = () => {
    isSupported.value = typeof window !== 'undefined' && 'indexedDB' in window
  }

  const initDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      if (!isSupported.value) {
        reject(new Error('IndexedDB not supported'))
        return
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        db.value = request.result
        isInitialized.value = true
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result

        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('status', 'status', { unique: false })
        }
      }
    })
  }

  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  const addOperation = async (type: SyncOperationType, payload: Record<string, unknown>): Promise<string> => {
    if (!db.value) await initDB()
    const database = db.value!

    const operation: SyncOperation = {
      id: generateId(),
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending',
    }

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(operation)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        pendingOperations.value = [...pendingOperations.value, operation]
        resolve(operation.id)
      }
    })
  }

  const getPendingOperations = async (): Promise<SyncOperation[]> => {
    if (!db.value) await initDB()
    const database = db.value!

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('status')
      const request = index.getAll('pending')

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const results = request.result as SyncOperation[]
        pendingOperations.value = results.sort((a, b) => a.timestamp - b.timestamp)
        resolve(pendingOperations.value)
      }
    })
  }

  const updateOperationStatus = async (id: string, status: SyncOperation['status'], retryCount?: number): Promise<void> => {
    if (!db.value) await initDB()
    const database = db.value!

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const getRequest = store.get(id)

      getRequest.onerror = () => reject(getRequest.error)
      getRequest.onsuccess = () => {
        const operation = getRequest.result as SyncOperation | undefined
        if (operation) {
          operation.status = status
          if (retryCount !== undefined) {
            operation.retryCount = retryCount
          }
          const putRequest = store.put(operation)
          putRequest.onerror = () => reject(putRequest.error)
          putRequest.onsuccess = () => resolve()
        } else {
          resolve()
        }
      }
    })
  }

  const removeOperation = async (id: string): Promise<void> => {
    if (!db.value) await initDB()
    const database = db.value!

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        pendingOperations.value = pendingOperations.value.filter(op => op.id !== id)
        resolve()
      }
    })
  }

  const clearAllOperations = async (): Promise<void> => {
    if (!db.value) await initDB()
    const database = db.value!

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        pendingOperations.value = []
        resolve()
      }
    })
  }

  const executeOperation = async (operation: SyncOperation): Promise<boolean> => {
    await updateOperationStatus(operation.id, 'syncing')

    try {
      const response = await $fetch('/api/my-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          action: operation.type,
          ...operation.payload,
          _syncTimestamp: operation.timestamp,
        },
      })

      if (response.success) {
        await removeOperation(operation.id)
        return true
      }
      return false
    } catch {
      const newRetryCount = operation.retryCount + 1
      if (newRetryCount >= 3) {
        await updateOperationStatus(operation.id, 'failed', newRetryCount)
      } else {
        await updateOperationStatus(operation.id, 'pending', newRetryCount)
      }
      return false
    }
  }

  const syncAll = async (): Promise<{ success: number; failed: number }> => {
    if (isSyncing.value) return { success: 0, failed: 0 }

    isSyncing.value = true
    let success = 0
    let failed = 0

    try {
      const operations = await getPendingOperations()

      for (const op of operations) {
        const result = await executeOperation(op)
        if (result) {
          success++
        } else {
          failed++
        }
      }
    } finally {
      isSyncing.value = false
    }

    return { success, failed }
  }

  const getPendingCount = async (): Promise<number> => {
    if (!db.value) await initDB()
    const database = db.value!

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index('status')
      const request = index.count('pending')

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  onMounted(async () => {
    checkSupport()
    if (isSupported.value) {
      try {
        await initDB()
        await getPendingOperations()
      } catch (e) {
        console.error('Failed to initialize sync queue DB:', e)
      }
    }
  })

  return {
    isSupported,
    isInitialized,
    isSyncing,
    pendingOperations: readonly(pendingOperations),
    addOperation,
    getPendingOperations,
    removeOperation,
    clearAllOperations,
    syncAll,
    getPendingCount,
  }
}
