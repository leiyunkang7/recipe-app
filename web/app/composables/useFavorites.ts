import type { Recipe } from '~/types'
import type { ServiceResponse } from '@recipe-app/shared-types'
import { useAuth } from './useAuth'
import { useAnalytics } from './useAnalytics'

export interface FavoriteFolder {
  id: string
  user_id: string
  name: string
  color: string
  sort_order: number
  created_at: string
  updated_at: string
}

/**
 * Unified API caller for /api/my-recipes endpoint.
 * Handles auth check, headers, and error logging in one place.
 * Returns null if not authenticated or on error.
 */
async function callMyRecipesApi<T>(
  options: Omit<Parameters<typeof $fetch>[1], 'headers'> & { method?: string; body?: Record<string, unknown> },
): Promise<ServiceResponse<T> | null> {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated.value || !user.value?.id) {
    return null
  }

  try {
    const response = await $fetch<ServiceResponse<T>>('/api/my-recipes', {
      ...options,
      headers: {
        'x-user-id': user.value.id,
      },
    })
    return response
  } catch (err) {
    console.error('[useFavorites] API error:', err)
    return null
  }
}

/**
 * useFavorites - Recipe favorites composable with optimistic updates
 *
 * Provides reactive favorites state with optimistic UI updates.
 * Favorites are immediately reflected in the UI, then confirmed
 * or rolled back based on server response.
 */
export const useFavorites = () => {
  // Use useState for SSR serialization compatibility
  // Set provides O(1) lookup for isFavorite() vs O(n) for Array.includes()
  const favoriteIds = useState<Set<string>>('favorite-ids', () => new Set())
  const loading = useState<boolean>('favorites-loading', () => false)
  const folders = useState<FavoriteFolder[]>('favorite-folders', () => [])

  const { isAuthenticated, user } = useAuth()

  /**
   * Check if a recipe is in favorites - O(1) Set lookup
   */
  const isFavorite = (recipeId: string): boolean => {
    return favoriteIds.value.has(recipeId)
  }

  /**
   * Fetch user's favorite recipe IDs
   */
  const fetchFavorites = async (): Promise<Recipe[]> => {
    loading.value = true
    try {
      const response = await callMyRecipesApi<Recipe[]>({
        params: { type: 'favorites' }
      })

      if (response?.success && response.data) {
        favoriteIds.value = new Set(response.data.map((r: Recipe) => r.id))
        return response.data
      }
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch user's favorite folders
   */
  const fetchFolders = async (): Promise<FavoriteFolder[]> => {
    const response = await callMyRecipesApi<FavoriteFolder[]>({
      params: { type: 'favorite-folders' }
    })

    if (response?.success && response.data) {
      folders.value = response.data
      return response.data
    }
    return []
  }

  /**
   * Add a recipe to favorites (optimistic)
   */
  const addFavorite = async (recipeId: string): Promise<boolean> => {
    const wasFavorite = favoriteIds.value.has(recipeId)
    if (!wasFavorite) {
      favoriteIds.value.add(recipeId)
    }

    try {
      const response = await callMyRecipesApi<void>({
        method: 'POST',
        body: {
          action: 'add-favorite',
          recipeId
        }
      })

      if (response?.success) {
        const { trackAddFavorite } = useAnalytics()
        trackAddFavorite({ id: recipeId, title: '', category: '' } as Recipe)
        return true
      }

      if (!wasFavorite) favoriteIds.value.delete(recipeId)
      return false
    } catch {
      if (!wasFavorite) favoriteIds.value.delete(recipeId)
      return false
    }
  }

  /**
   * Remove a recipe from favorites (optimistic)
   */
  const removeFavorite = async (recipeId: string): Promise<boolean> => {
    const wasFavorite = favoriteIds.value.has(recipeId)
    if (wasFavorite) {
      favoriteIds.value.delete(recipeId)
    }

    try {
      const response = await callMyRecipesApi<void>({
        method: 'POST',
        body: {
          action: 'remove-favorite',
          recipeId
        }
      })

      if (response?.success) {
        const { trackRemoveFavorite } = useAnalytics()
        trackRemoveFavorite({ id: recipeId, title: '', category: '' } as Recipe)
        return true
      }

      if (wasFavorite) favoriteIds.value.add(recipeId)
      return false
    } catch {
      if (wasFavorite) favoriteIds.value.add(recipeId)
      return false
    }
  }

  /**
   * Toggle favorite status (optimistic)
   */
  const toggleFavorite = async (recipeId: string): Promise<boolean> => {
    if (!isAuthenticated.value) {
      return false
    }

    const isFav = isFavorite(recipeId)

    if (isFav) {
      return await removeFavorite(recipeId)
    } else {
      return await addFavorite(recipeId)
    }
  }

  /**
   * Create a favorite folder (optimistic)
   */
  const createFolder = async (name: string, color?: string): Promise<FavoriteFolder | null> => {
    const tempId = `temp-${Date.now()}`
    const optimisticFolder: FavoriteFolder = {
      id: tempId,
      user_id: user.value?.id || '',
      name,
      color: color || '#F97316',
      sort_order: folders.value.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const previousFolders = [...folders.value]
    folders.value = [...folders.value, optimisticFolder]

    try {
      const response = await callMyRecipesApi<FavoriteFolder>({
        method: 'POST',
        body: {
          action: 'create-favorite-folder',
          name,
          color
        }
      })

      if (response?.success && response.data) {
        folders.value = folders.value.map(f => f.id === tempId ? response.data : f)
        return response.data
      }

      folders.value = previousFolders
      return null
    } catch {
      folders.value = previousFolders
      return null
    }
  }

  /**
   * Rename a favorite folder (optimistic)
   */
  const renameFolder = async (folderId: string, newName: string): Promise<boolean> => {
    const previousFolders = [...folders.value]

    const index = folders.value.findIndex(f => f.id === folderId)
    if (index !== -1) {
      folders.value = folders.value.map((f, i) =>
        i === index ? { ...f, name: newName, updated_at: new Date().toISOString() } : f
      )
    }

    try {
      const response = await callMyRecipesApi<void>({
        method: 'POST',
        body: {
          action: 'rename-favorite-folder',
          folderId,
          name: newName
        }
      })

      if (response?.success) {
        return true
      }

      folders.value = previousFolders
      return false
    } catch {
      folders.value = previousFolders
      return false
    }
  }

  /**
   * Delete a favorite folder (optimistic)
   */
  const deleteFolder = async (folderId: string): Promise<boolean> => {
    if (!isAuthenticated.value) {
      return false
    }

    // Save previous state for rollback
    const previousFolders = [...folders.value]

    // Optimistic update - immediately remove from UI
    folders.value = folders.value.filter(f => f.id !== folderId)

    try {
      const response = await $fetch<ServiceResponse<void>>('/api/my-recipes', {
        method: 'POST',
        headers: {
          'x-user-id': user.value?.id || '',
        },
        body: {
          action: 'delete-favorite-folder',
          folderId
        }
      })

      if (response.success) {
        return true
      }

      // Rollback on failure
      folders.value = previousFolders
      return false
    } catch (err) {
      // Rollback on error
      folders.value = previousFolders
      console.error('[useFavorites] Error deleting folder:', err)
      return false
    }
  }

  /**
   * Move a favorite to a folder
   */
  const moveFavoriteToFolder = async (recipeId: string, folderId: string | null): Promise<boolean> => {
    if (!isAuthenticated.value) {
      return false
    }

    try {
      const response = await $fetch<ServiceResponse<void>>('/api/my-recipes', {
        method: 'POST',
        headers: {
          'x-user-id': user.value?.id || '',
        },
        body: {
          action: 'move-favorite-to-folder',
          recipeId,
          folderId
        }
      })

      return response.success
    } catch (err) {
      console.error('[useFavorites] Error moving favorite:', err)
      return false
    }
  }

  /**
   * Fetch favorites by folder
   */
  const fetchFavoritesByFolder = async (folderId: string | null): Promise<Recipe[]> => {
    if (!isAuthenticated.value) {
      return []
    }

    try {
      const response = await $fetch<ServiceResponse<Recipe[]>>('/api/my-recipes', {
        headers: {
          'x-user-id': user.value?.id || '',
        },
        params: {
          type: 'favorites',
          folderId: folderId || undefined
        }
      })

      if (response.success && response.data) {
        return response.data
      }
      return []
    } catch (err) {
      console.error('[useFavorites] Error fetching favorites by folder:', err)
      return []
    }
  }

  /**
   * Get the folder ID for a recipe
   */
  const getRecipeFolderId = (_recipeId: string): string | null => {
    // This would need to be implemented based on your data model
    return null
  }

  return {
    favoriteIds: readonly(favoriteIds),
    loading: readonly(loading),
    folders: readonly(folders),
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    fetchFavorites,
    fetchFolders,
    createFolder,
    renameFolder,
    deleteFolder,
    moveFavoriteToFolder,
    fetchFavoritesByFolder,
    getRecipeFolderId,
  }
}
