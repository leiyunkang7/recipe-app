import type { Recipe } from '~/types'
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
 * useFavorites - Recipe favorites composable with optimistic updates
 *
 * Provides reactive favorites state with optimistic UI updates.
 * Favorites are immediately reflected in the UI, then confirmed
 * or rolled back based on server response.
 */
export const useFavorites = () => {
  // Use useState for SSR serialization compatibility
  const favoriteIds = useState<string[]>('favorite-ids', () => [])
  const loading = useState<boolean>('favorites-loading', () => false)
  const folders = useState<FavoriteFolder[]>('favorite-folders', () => [])

  const { isAuthenticated, user } = useAuth()

  /**
   * Check if a recipe is in favorites
   */
  const isFavorite = (recipeId: string): boolean => {
    return favoriteIds.value.includes(recipeId)
  }

  /**
   * Fetch user's favorite recipe IDs
   */
  const fetchFavorites = async (): Promise<Recipe[]> => {
    if (!isAuthenticated.value) {
      return []
    }

    loading.value = true
    try {
      const response = await $fetch('/api/my-recipes', {
        headers: {
          'x-user-id': user.value?.id || '',
        },
        params: { type: 'favorites' }
      })

      if (response.success && response.data) {
        favoriteIds.value = response.data.map((r: Recipe) => r.id)
        return response.data
      }
      return []
    } catch (err) {
      console.error('[useFavorites] Error fetching favorites:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch user's favorite folders
   */
  const fetchFolders = async (): Promise<FavoriteFolder[]> => {
    if (!isAuthenticated.value) {
      return []
    }

    try {
      const response = await $fetch('/api/my-recipes', {
        headers: {
          'x-user-id': user.value?.id || '',
        },
        params: { type: 'favorite-folders' }
      })

      if (response.success && response.data) {
        folders.value = response.data
        return response.data
      }
      return []
    } catch (err) {
      console.error('[useFavorites] Error fetching folders:', err)
      return []
    }
  }

  /**
   * Add a recipe to favorites (optimistic)
   */
  const addFavorite = async (recipeId: string): Promise<boolean> => {
    if (!isAuthenticated.value) {
      return false
    }

    // Optimistic update - add immediately
    const previousIds = [...favoriteIds.value]
    if (!favoriteIds.value.includes(recipeId)) {
      favoriteIds.value = [...favoriteIds.value, recipeId]
    }

    try {
      const response = await $fetch('/api/my-recipes', {
        method: 'POST',
        headers: {
          'x-user-id': user.value?.id || '',
        },
        body: {
          action: 'add-favorite',
          recipeId
        }
      })

      if (response.success) {
        const { trackAddFavorite } = useAnalytics()
        trackAddFavorite({ id: recipeId, title: '', category: '' } as Recipe)
        return true
      }

      // Rollback on failure
      favoriteIds.value = previousIds
      return false
    } catch (err) {
      // Rollback on failure
      favoriteIds.value = previousIds
      console.error('[useFavorites] Error adding favorite:', err)
      return false
    }
  }

  /**
   * Remove a recipe from favorites (optimistic)
   */
  const removeFavorite = async (recipeId: string): Promise<boolean> => {
    if (!isAuthenticated.value) {
      return false
    }

    // Optimistic update - remove immediately
    const previousIds = [...favoriteIds.value]
    favoriteIds.value = favoriteIds.value.filter(id => id !== recipeId)

    try {
      const response = await $fetch('/api/my-recipes', {
        method: 'POST',
        headers: {
          'x-user-id': user.value?.id || '',
        },
        body: {
          action: 'remove-favorite',
          recipeId
        }
      })

      if (response.success) {
        const { trackRemoveFavorite } = useAnalytics()
        trackRemoveFavorite({ id: recipeId, title: '', category: '' } as Recipe)
        return true
      }

      // Rollback on failure
      favoriteIds.value = previousIds
      return false
    } catch (err) {
      // Rollback on failure
      favoriteIds.value = previousIds
      console.error('[useFavorites] Error removing favorite:', err)
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
    if (!isAuthenticated.value) {
      return null
    }

    // Optimistic update - create temporary folder with temp ID
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

    // Immediately add to UI
    const previousFolders = [...folders.value]
    folders.value = [...folders.value, optimisticFolder]

    try {
      const response = await $fetch('/api/my-recipes', {
        method: 'POST',
        headers: {
          'x-user-id': user.value?.id || '',
        },
        body: {
          action: 'create-favorite-folder',
          name,
          color
        }
      })

      if (response.success && response.data) {
        // Replace temp folder with real folder from server
        folders.value = folders.value.map(f => f.id === tempId ? response.data : f)
        return response.data
      }

      // Rollback on failure
      folders.value = previousFolders
      return null
    } catch (err) {
      // Rollback on error
      folders.value = previousFolders
      console.error('[useFavorites] Error creating folder:', err)
      return null
    }
  }

  /**
   * Rename a favorite folder (optimistic)
   */
  const renameFolder = async (folderId: string, newName: string): Promise<boolean> => {
    if (!isAuthenticated.value) {
      return false
    }

    // Save previous state for rollback
    const previousFolders = [...folders.value]

    // Optimistic update - immediately update UI
    const index = folders.value.findIndex(f => f.id === folderId)
    if (index !== -1) {
      folders.value = folders.value.map((f, i) =>
        i === index ? { ...f, name: newName, updated_at: new Date().toISOString() } : f
      )
    }

    try {
      const response = await $fetch('/api/my-recipes', {
        method: 'POST',
        headers: {
          'x-user-id': user.value?.id || '',
        },
        body: {
          action: 'rename-favorite-folder',
          folderId,
          name: newName
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
      console.error('[useFavorites] Error renaming folder:', err)
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
      const response = await $fetch('/api/my-recipes', {
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
      const response = await $fetch('/api/my-recipes', {
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
      const response = await $fetch('/api/my-recipes', {
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
