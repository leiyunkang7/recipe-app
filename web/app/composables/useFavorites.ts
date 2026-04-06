import type { Recipe } from '~/types'

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
 * useFavorites - DISABLED (authentication temporarily disabled)
 *
 * This composable provides stub implementations to prevent runtime errors.
 * All operations return empty/zero results until authentication is restored.
 */
export const useFavorites = () => {
  // Use array instead of Set for SSR serialization compatibility
  const favoriteIds = useState<string[]>('favorite-ids', () => [])
  const loading = useState<boolean>('favorites-loading', () => false)
  const folders = useState<FavoriteFolder[]>('favorite-folders', () => [])

  const isFavorite = (_recipeId: string) => false

  const toggleFavorite = async (_recipeId: string) => {}

  const addFavorite = async (_recipeId: string): Promise<boolean> => false

  const removeFavorite = async (_recipeId: string): Promise<boolean> => true

  const fetchFavorites = async (): Promise<Recipe[]> => []

  const fetchFolders = async (): Promise<FavoriteFolder[]> => []

  const createFolder = async (_name: string, _color?: string): Promise<FavoriteFolder | null> => null

  const renameFolder = async (_folderId: string, _newName: string): Promise<boolean> => false

  const deleteFolder = async (_folderId: string): Promise<boolean> => false

  const moveFavoriteToFolder = async (_recipeId: string, _folderId: string | null): Promise<boolean> => false

  const fetchFavoritesByFolder = async (_folderId: string | null): Promise<Recipe[]> => []

  const getRecipeFolderId = (_recipeId: string): string | null => null

  return {
    favoriteIds,
    loading,
    folders,
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
