import type { Recipe, RecipeListItem } from '~/types'

const DB_NAME = 'recipe-app-offline'
const DB_VERSION = 1
const RECIPES_STORE = 'recipes'
const RECIPE_LIST_STORE = 'recipe-lists'
const FAVORITES_STORE = 'favorites'
const CACHE_META_STORE = 'cache-meta'

export interface OfflineRecipeCache {
  id: string
  recipes: Recipe[]
  cachedAt: number
  expiresAt: number
}

export interface OfflineRecipeListCache {
  id: string
  recipes: RecipeListItem[]
  cachedAt: number
  expiresAt: number
  filters?: string
}

export const useOfflineRecipes = () => {
  const isSupported = ref(false)
  const isInitialized = ref(false)
  const db = ref<IDBDatabase | null>(null)

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

        if (!database.objectStoreNames.contains(RECIPES_STORE)) {
          const recipeStore = database.createObjectStore(RECIPES_STORE, { keyPath: 'id' })
          recipeStore.createIndex('cachedAt', 'cachedAt', { unique: false })
        }

        if (!database.objectStoreNames.contains(RECIPE_LIST_STORE)) {
          const listStore = database.createObjectStore(RECIPE_LIST_STORE, { keyPath: 'id', autoIncrement: true })
          listStore.createIndex('filters', 'filters', { unique: false })
          listStore.createIndex('cachedAt', 'cachedAt', { unique: false })
        }

        if (!database.objectStoreNames.contains(FAVORITES_STORE)) {
          const favStore = database.createObjectStore(FAVORITES_STORE, { keyPath: 'id' })
          favStore.createIndex('cachedAt', 'cachedAt', { unique: false })
        }

        if (!database.objectStoreNames.contains(CACHE_META_STORE)) {
          database.createObjectStore(CACHE_META_STORE, { keyPath: 'key' })
        }
      }
    })
  }
  const cacheRecipe = async (recipe: Recipe, ttlMs = 7 * 24 * 60 * 60 * 1000): Promise<void> => {
    if (!db.value) await initDB()
    const database = db.value!

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([RECIPES_STORE], 'readwrite')
      const store = transaction.objectStore(RECIPES_STORE)

      const cacheEntry: OfflineRecipeCache = {
        id: recipe.id,
        recipes: [recipe],
        cachedAt: Date.now(),
        expiresAt: Date.now() + ttlMs,
      }

      const request = store.put(cacheEntry)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  const cacheRecipeList = async (
    recipes: RecipeListItem[],
    filters?: string,
    ttlMs = 24 * 60 * 60 * 1000
  ): Promise<void> => {
    if (!db.value) await initDB()
    const database = db.value!

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([RECIPE_LIST_STORE], 'readwrite')
      const store = transaction.objectStore(RECIPE_LIST_STORE)

      const cacheEntry: OfflineRecipeListCache = {
        id: 'list-' + hashString(filters || 'default'),
        recipes,
        cachedAt: Date.now(),
        expiresAt: Date.now() + ttlMs,
        filters,
      }

      const request = store.put(cacheEntry)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  const getCachedRecipe = async (id: string): Promise<Recipe | null> => {
    if (!db.value) await initDB()
    const database = db.value!

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([RECIPES_STORE], 'readonly')
      const store = transaction.objectStore(RECIPES_STORE)
      const request = store.get(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result as OfflineRecipeCache | undefined
        if (result && result.expiresAt > Date.now()) {
          resolve(result.recipes[0] || null)
        } else {
          resolve(null)
        }
      }
    })
  }
  const getCachedRecipeList = async (filters?: string): Promise<RecipeListItem[]> => {
    if (!db.value) await initDB()
    const database = db.value!

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([RECIPE_LIST_STORE], 'readonly')
      const store = transaction.objectStore(RECIPE_LIST_STORE)
      const index = filters ? store.index('filters') : null
      const request = index ? index.getAll(filters) : store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const results = request.result as OfflineRecipeListCache[]
        const validResults = results
          .filter(r => r.expiresAt > Date.now())
          .sort((a, b) => b.cachedAt - a.cachedAt)

        resolve(validResults.length > 0 ? validResults[0].recipes : [])
      }
    })
  }

  const cacheFavorite = async (recipe: RecipeListItem): Promise<void> => {
    if (!db.value) await initDB()
    const database = db.value!

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([FAVORITES_STORE], 'readwrite')
      const store = transaction.objectStore(FAVORITES_STORE)
      const request = store.put({ ...recipe, cachedAt: Date.now() })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  const removeCachedFavorite = async (id: string): Promise<void> => {
    if (!db.value) await initDB()
    const database = db.value!

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([FAVORITES_STORE], 'readwrite')
      const store = transaction.objectStore(FAVORITES_STORE)
      const request = store.delete(id)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  const getCachedFavorites = async (): Promise<RecipeListItem[]> => {
    if (!db.value) await initDB()
    const database = db.value!

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([FAVORITES_STORE], 'readonly')
      const store = transaction.objectStore(FAVORITES_STORE)
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }
  const clearAllCache = async (): Promise<void> => {
    if (!db.value) await initDB()
    const database = db.value!
    const stores = [RECIPES_STORE, RECIPE_LIST_STORE, FAVORITES_STORE, CACHE_META_STORE]

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(stores, 'readwrite')
      stores.forEach(storeName => transaction.objectStore(storeName).clear())
      transaction.onerror = () => reject(transaction.error)
      transaction.oncomplete = () => resolve()
    })
  }

  const getCacheStats = async (): Promise<{
    recipesCount: number
    listCount: number
    favoritesCount: number
    totalSize: string
  }> => {
    if (!db.value) await initDB()
    const database = db.value!

    const countStore = (storeName: string): Promise<number> => {
      return new Promise((resolve, reject) => {
        const transaction = database.transaction([storeName], 'readonly')
        const store = transaction.objectStore(storeName)
        const request = store.count()
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result)
      })
    }

    const [recipesCount, listCount, favoritesCount] = await Promise.all([
      countStore(RECIPES_STORE),
      countStore(RECIPE_LIST_STORE),
      countStore(FAVORITES_STORE),
    ])

    const estimatedBytes = (recipesCount * 5000) + (listCount * 2000) + (favoritesCount * 2000)
    const totalSize = estimatedBytes > 1024 * 1024
      ? (estimatedBytes / (1024 * 1024)).toFixed(1) + ' MB'
      : (estimatedBytes / 1024).toFixed(1) + ' KB'

    return { recipesCount, listCount, favoritesCount, totalSize }
  }

  const cleanupExpired = async (): Promise<number> => {
    if (!db.value) await initDB()
    const database = db.value!
    const now = Date.now()
    let cleanedCount = 0
    const stores = [RECIPES_STORE, RECIPE_LIST_STORE]

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(stores, 'readwrite')

      stores.forEach(storeName => {
        const store = transaction.objectStore(storeName)
        const request = store.openCursor()

        request.onsuccess = () => {
          const cursor = request.result
          if (cursor) {
            const data = cursor.value as OfflineRecipeCache | OfflineRecipeListCache
            if (data.expiresAt && data.expiresAt < now) {
              cursor.delete()
              cleanedCount++
            } else {
              cursor.continue()
            }
          }
        }
      })

      transaction.onerror = () => reject(transaction.error)
      transaction.oncomplete = () => resolve(cleanedCount)
    })
  }
  const hashString = (str: string): string => {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  onMounted(async () => {
    checkSupport()
    if (isSupported.value) {
      try {
        await initDB()
        cleanupExpired().catch(() => { })
      } catch (e) {
        console.error('Failed to initialize offline DB:', e)
      }
    }
  })

  return {
    isSupported,
    isInitialized,
    cacheRecipe,
    cacheRecipeList,
    getCachedRecipe,
    getCachedRecipeList,
    cacheFavorite,
    removeCachedFavorite,
    getCachedFavorites,
    clearAllCache,
    getCacheStats,
    cleanupExpired,
  }
}