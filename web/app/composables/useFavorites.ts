import type { Recipe } from '~/types'
import type { User } from '@supabase/supabase-js'
import { mapRecipeData, type RawRecipe } from '~/utils/recipeMapper'

export interface FavoriteFolder {
  id: string
  user_id: string
  name: string
  color: string
  sort_order: number
  created_at: string
  updated_at: string
}

export const useFavorites = () => {
  const { $supabase } = useNuxtApp()
  const { locale } = useI18n()

  // Use useState for global state sharing across components
  const favoriteIds = useState<Set<string>>('favorite-ids', () => new Set())
  const loading = useState<boolean>('favorites-loading', () => false)
  const user = useState<User | null>('favorites-user', () => null)
  const initialized = useState<boolean>('favorites-initialized', () => false)
  const folders = useState<FavoriteFolder[]>('favorite-folders', () => [])

  // Track mount state for cleanup - use useState for SSR safety
  const isMounted = useState<boolean>('favorites-mounted', () => true)

  // Reset initialized when user changes (e.g., logout/login) to prevent stale favorites
  watch(user, (newUser, oldUser) => {
    if (oldUser !== null && newUser?.id !== oldUser?.id) {
      initialized.value = false
    }
  })

  const getUser = async () => {
    // Return cached user if available to avoid repeated API calls
    if (user.value) return user.value

    const { data: { user: authUser } } = await $supabase.auth.getUser()
    user.value = authUser
    return authUser
  }

  const fetchFavoriteIds = async (userId: string) => {
    const { data, error } = await $supabase
      .from('favorites')
      .select('recipe_id')
      .eq('user_id', userId)

    if (error) {
      return
    }

    favoriteIds.value = new Set((data || []).map((f: { recipe_id: string }) => f.recipe_id))
  }

  const initFavorites = async () => {
    // Skip if already initialized to avoid redundant API calls
    if (initialized.value) return

    const authUser = await getUser()
    // Check if still mounted before updating state (prevents race condition on unmount)
    if (!isMounted.value) return

    if (authUser) {
      await fetchFavoriteIds(authUser.id)
    } else {
      favoriteIds.value = new Set()
    }
    // Check again before setting initialized flag
    if (!isMounted.value) return
    initialized.value = true
  }

  const isFavorite = (recipeId: string) => {
    return favoriteIds.value.has(recipeId)
  }

  const toggleFavorite = async (recipeId: string) => {
    const authUser = await getUser()
    if (!authUser) {
      return
    }

    // Store previous state for rollback on failure
    const previousIds = new Set(favoriteIds.value)
    const isAdding = !favoriteIds.value.has(recipeId)
    const newSet = new Set(favoriteIds.value)

    if (isAdding) {
      newSet.add(recipeId)
    } else {
      newSet.delete(recipeId)
    }
    favoriteIds.value = newSet

    try {
      if (isAdding) {
        const { error } = await $supabase
          .from('favorites')
          .insert({ user_id: authUser.id, recipe_id: recipeId })
        if (error) throw error
      } else {
        const { error } = await $supabase
          .from('favorites')
          .delete()
          .eq('user_id', authUser.id)
          .eq('recipe_id', recipeId)
        if (error) throw error
      }
    } catch (err) {
      // Rollback on failure to maintain state consistency
      favoriteIds.value = previousIds
    }
  }

  const addFavorite = async (recipeId: string): Promise<boolean> => {
    const authUser = await getUser()
    if (!authUser) return false

    if (!favoriteIds.value.has(recipeId)) {
      // Store previous state for rollback on failure
      const previousIds = new Set(favoriteIds.value)

      // Create new Set for proper reactivity (like toggleFavorite)
      favoriteIds.value = new Set([...favoriteIds.value, recipeId])

      try {
        const { error } = await $supabase
          .from('favorites')
          .insert({ user_id: authUser.id, recipe_id: recipeId })
        if (error) throw error
        return true
      } catch (err) {
        // Rollback on failure to maintain state consistency
        favoriteIds.value = previousIds
        return false
      }
    }
    return true
  }

  const removeFavorite = async (recipeId: string): Promise<boolean> => {
    const authUser = await getUser()
    if (!authUser) return false

    if (favoriteIds.value.has(recipeId)) {
      // Store previous state for rollback on failure
      const previousIds = new Set(favoriteIds.value)

      // Create new Set for proper reactivity (like toggleFavorite)
      const newSet = new Set(favoriteIds.value)
      newSet.delete(recipeId)
      favoriteIds.value = newSet

      try {
        const { error } = await $supabase
          .from('favorites')
          .delete()
          .eq('user_id', authUser.id)
          .eq('recipe_id', recipeId)
        if (error) throw error
        return true
      } catch (err) {
        // Rollback on failure to maintain state consistency
        favoriteIds.value = previousIds
        return false
      }
    }
    return true
  }

  // Helper function to fetch recipes by IDs with full details (ingredients, steps, tags)
  // Extracted to avoid code duplication between fetchFavorites and fetchFavoritesByFolder
  const _fetchRecipesByIds = async (ids: string[]): Promise<Recipe[]> => {
    if (ids.length === 0) {
      return []
    }

    const loc = locale.value as string

    // Use the same query pattern as useRecipes.ts - mapRecipeData handles recipe_translations if present
    const { data, error } = await $supabase
      .from('recipes')
      .select(`
        *,
        ingredients:recipe_ingredients(
          id,
          name,
          amount,
          unit
        ),
        steps:recipe_steps(
          id,
          step_number,
          instruction,
          duration_minutes
        ),
        tags:recipe_tags(
          tag
        )
      `)
      .in('id', ids)

    if (error) throw error

    const mappedData = (data || []).map((recipe: RawRecipe) => mapRecipeData(recipe, loc)) as Recipe[]
    return mappedData
  }

  const fetchFavorites = async (): Promise<Recipe[]> => {
    loading.value = true

    try {
      const ids = Array.from(favoriteIds.value)
      return await _fetchRecipesByIds(ids)
    } catch (err) {
      return []
    } finally {
      loading.value = false
    }
  }

  // ===== Folder Management =====

  const fetchFolders = async (): Promise<FavoriteFolder[]> => {
    const authUser = await getUser()
    if (!authUser) return []

    const { data, error } = await $supabase
      .from('favorite_folders')
      .select('*')
      .eq('user_id', authUser.id)
      .order('sort_order', { ascending: true })

    if (error) {
      return []
    }

    folders.value = data || []
    return folders.value
  }

  const createFolder = async (name: string, color: string = '#F97316'): Promise<FavoriteFolder | null> => {
    const authUser = await getUser()
    if (!authUser) return null

    const maxOrder = folders.value.length > 0
      ? Math.max(...folders.value.map(f => f.sort_order)) + 1
      : 0

    const { data, error } = await $supabase
      .from('favorite_folders')
      .insert({
        user_id: authUser.id,
        name,
        color,
        sort_order: maxOrder,
      })
      .select()
      .single()

    if (error) {
      return null
    }

    folders.value = [...folders.value, data]
    return data
  }

  const renameFolder = async (folderId: string, newName: string): Promise<boolean> => {
    const { error } = await $supabase
      .from('favorite_folders')
      .update({ name: newName })
      .eq('id', folderId)

    if (error) return false

    const idx = folders.value.findIndex(f => f.id === folderId)
    if (idx !== -1) {
      folders.value[idx] = { ...folders.value[idx], name: newName }
    }
    return true
  }

  const deleteFolder = async (folderId: string): Promise<boolean> => {
    // First move all favorites in this folder to no folder
    await $supabase
      .from('favorites')
      .update({ folder_id: null })
      .eq('folder_id', folderId)

    const { error } = await $supabase
      .from('favorite_folders')
      .delete()
      .eq('id', folderId)

    if (error) return false

    folders.value = folders.value.filter(f => f.id !== folderId)
    return true
  }

  const moveFavoriteToFolder = async (recipeId: string, folderId: string | null): Promise<boolean> => {
    const authUser = await getUser()
    if (!authUser) return false

    const { error } = await $supabase
      .from('favorites')
      .update({ folder_id: folderId })
      .eq('user_id', authUser.id)
      .eq('recipe_id', recipeId)

    return !error
  }

  const fetchFavoritesByFolder = async (folderId: string | null): Promise<Recipe[]> => {
    loading.value = true

    try {
      const authUser = await getUser()
      if (!authUser) return []

      let query = $supabase
        .from('favorites')
        .select('recipe_id, folder_id')
        .eq('user_id', authUser.id)

      if (folderId === null) {
        query = query.is('folder_id', null)
      } else {
        query = query.eq('folder_id', folderId)
      }

      const { data: favData, error: favError } = await query

      if (favError || !favData || favData.length === 0) {
        return []
      }

      const ids = favData.map((f: { recipe_id: string }) => f.recipe_id)
      return await _fetchRecipesByIds(ids)
    } catch (err) {
      return []
    } finally {
      loading.value = false
    }
  }

  const getRecipeFolderId = (recipeId: string): string | null => {
    // This would require fetching the favorites with folder info
    // For now return null - can be enhanced later
    return null
  }

  // Initialize folders on mount
  const initFolders = async () => {
    await fetchFolders()
  }

  onMounted(() => {
    initFavorites()
    initFolders()
  })

  onUnmounted(() => {
    isMounted.value = false
  })

  return {
    favoriteIds, // useState already reactive
    loading, // useState already reactive
    folders, // FavoriteFolder[]
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    fetchFavorites,
    // Folder management
    fetchFolders,
    createFolder,
    renameFolder,
    deleteFolder,
    moveFavoriteToFolder,
    fetchFavoritesByFolder,
    getRecipeFolderId,
  }
}
