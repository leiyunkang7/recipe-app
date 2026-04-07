import type { FavoriteFolder } from './useFavorites'
import { useAuth } from './useAuth'

export interface UseFavoritesBatchReturn {
  selectedRecipeIds: ReturnType<typeof useState<string[]>>
  isSelectionMode: ReturnType<typeof useState<boolean>>
  isAllSelected: ComputedRef<boolean>
  selectedCount: ComputedRef<number>
  isBatchOperating: ReturnType<typeof useState<boolean>>
  toggleSelection: (recipeId: string) => void
  selectAll: (recipeIds: string[]) => void
  clearSelection: () => void
  batchRemoveFavorites: (recipeIds: string[]) => Promise<{ success: boolean; removed: number; errors: string[] }>
  batchMoveToFolder: (recipeIds: string[], folderId: string | null) => Promise<{ success: boolean; moved: number; errors: string[] }>
  batchAddToFolder: (recipeIds: string[], folderId: string) => Promise<{ success: boolean; added: number; errors: string[] }>
}

export const useFavoritesBatch = (): UseFavoritesBatchReturn => {
  const selectedRecipeIds = useState<string[]>('batch-selected-recipe-ids', () => [])
  const isSelectionMode = useState<boolean>('batch-selection-mode', () => false)
  const isBatchOperating = useState<boolean>('batch-operating', () => false)

  const { isAuthenticated, user } = useAuth()

  const isAllSelected = computed(() => false)
  const selectedCount = computed(() => selectedRecipeIds.value.length)

  const toggleSelection = (_recipeId: string) => {
    const index = selectedRecipeIds.value.indexOf(_recipeId)
    if (index === -1) {
      selectedRecipeIds.value.push(_recipeId)
    } else {
      selectedRecipeIds.value.splice(index, 1)
    }
  }

  const selectAll = (_recipeIds: string[]) => {
    selectedRecipeIds.value = [..._recipeIds]
  }

  const clearSelection = () => {
    selectedRecipeIds.value = []
    isSelectionMode.value = false
  }

  const batchRemoveFavorites = async (_recipeIds: string[]): Promise<{ success: boolean; removed: number; errors: string[] }> => {
    if (!isAuthenticated.value || _recipeIds.length === 0) {
      return { success: false, removed: 0, errors: ['Not authenticated or no recipe IDs provided'] }
    }

    isBatchOperating.value = true
    const errors: string[] = []

    try {
      const response = await $fetch('/api/my-recipes', {
        method: 'POST',
        headers: {
          'x-user-id': user.value?.id || '',
        },
        body: {
          action: 'batch-remove-favorites',
          recipeIds: _recipeIds,
        },
      })

      if (response.success) {
        return { success: true, removed: response.removed || _recipeIds.length, errors: [] }
      }

      return { success: false, removed: 0, errors: [response.error || 'Unknown error'] }
    } catch (err) {
      console.error('[useFavoritesBatch] Error batch removing favorites:', err)
      errors.push(err instanceof Error ? err.message : 'Unknown error')
      return { success: false, removed: 0, errors }
    } finally {
      isBatchOperating.value = false
    }
  }

  const batchMoveToFolder = async (_recipeIds: string[], _folderId: string | null): Promise<{ success: boolean; moved: number; errors: string[] }> => {
    if (!isAuthenticated.value || _recipeIds.length === 0) {
      return { success: false, moved: 0, errors: ['Not authenticated or no recipe IDs provided'] }
    }

    isBatchOperating.value = true
    const errors: string[] = []

    try {
      const response = await $fetch('/api/my-recipes', {
        method: 'POST',
        headers: {
          'x-user-id': user.value?.id || '',
        },
        body: {
          action: 'batch-move-to-folder',
          recipeIds: _recipeIds,
          folderId: _folderId,
        },
      })

      if (response.success) {
        return { success: true, moved: response.moved || _recipeIds.length, errors: [] }
      }

      return { success: false, moved: 0, errors: [response.error || 'Unknown error'] }
    } catch (err) {
      console.error('[useFavoritesBatch] Error batch moving favorites:', err)
      errors.push(err instanceof Error ? err.message : 'Unknown error')
      return { success: false, moved: 0, errors }
    } finally {
      isBatchOperating.value = false
    }
  }

  const batchAddToFolder = async (_recipeIds: string[], _folderId: string): Promise<{ success: boolean; added: number; errors: string[] }> => {
    return batchMoveToFolder(_recipeIds, _folderId)
  }

  return {
    selectedRecipeIds,
    isSelectionMode,
    isAllSelected,
    selectedCount,
    isBatchOperating,
    toggleSelection,
    selectAll,
    clearSelection,
    batchRemoveFavorites,
    batchMoveToFolder,
    batchAddToFolder,
  }
}
