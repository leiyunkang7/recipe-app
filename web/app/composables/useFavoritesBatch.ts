import { useAuth } from './useAuth'
import { useToast } from './useToast'

export interface UseFavoritesBatchReturn {
  selectedRecipeIds: ReturnType<typeof useState<Set<string>>>
  isSelectionMode: ReturnType<typeof useState<boolean>>
  isAllSelected: (totalRecipes: string[]) => ComputedRef<boolean>
  selectedCount: ComputedRef<number>
  isBatchOperating: ReturnType<typeof useState<boolean>>
  toggleSelection: (recipeId: string) => void
  selectAll: (recipeIds: string[]) => void
  clearSelection: () => void
  batchRemoveFavorites: (recipeIds: string[], removeFromList: (ids: string[]) => void) => Promise<{ success: boolean; removed: number; errors: string[] }>
  batchMoveToFolder: (recipeIds: string[], folderId: string | null, updateInList: (ids: string[], folderId: string | null) => void) => Promise<{ success: boolean; moved: number; errors: string[] }>
  batchAddToFolder: (recipeIds: string[], folderId: string) => Promise<{ success: boolean; added: number; errors: string[] }>
}

export const useFavoritesBatch = (): UseFavoritesBatchReturn => {
  // Use Set for O(1) lookup instead of O(n) Array.includes/indexOf
  const selectedRecipeIds = useState<Set<string>>('batch-selected-recipe-ids', () => new Set())
  const isSelectionMode = useState<boolean>('batch-selection-mode', () => false)
  const isBatchOperating = useState<boolean>('batch-operating', () => false)

  const { isAuthenticated, user } = useAuth()
  const toast = useToast()

  const isAllSelected = (totalRecipes: string[]) => computed(() => {
    if (totalRecipes.length === 0) return false
    return totalRecipes.every(id => selectedRecipeIds.value.has(id))
  })
  const selectedCount = computed(() => selectedRecipeIds.value.size)

  const toggleSelection = (recipeId: string) => {
    const newSet = new Set(selectedRecipeIds.value)
    if (newSet.has(recipeId)) {
      newSet.delete(recipeId)
    } else {
      newSet.add(recipeId)
    }
    selectedRecipeIds.value = newSet
  }

  const selectAll = (recipeIds: string[]) => {
    selectedRecipeIds.value = new Set(recipeIds)
  }

  const clearSelection = () => {
    selectedRecipeIds.value = new Set()
    isSelectionMode.value = false
  }

  /**
   * Batch remove favorites with optimistic update
   * @param recipeIds IDs to remove
   * @param removeFromList Callback to optimistically remove from UI list
   */
  const batchRemoveFavorites = async (recipeIds: string[], removeFromList: (ids: string[]) => void): Promise<{ success: boolean; removed: number; errors: string[] }> => {
    if (!isAuthenticated.value || recipeIds.length === 0) {
      return { success: false, removed: 0, errors: ['Not authenticated or no recipe IDs provided'] }
    }

    // Store previous state for rollback
    const previousSelectedIds = new Set(selectedRecipeIds.value)

    // Optimistic update - immediately remove from selected and call UI update
    const idsToRemove = new Set(recipeIds)
    selectedRecipeIds.value = new Set([...selectedRecipeIds.value].filter(id => !idsToRemove.has(id)))
    removeFromList(recipeIds)

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
          recipeIds,
        },
      })

      if (response.success) {
        return { success: true, removed: recipeIds.length, errors: [] }
      }

      // Rollback on failure - re-add to selection (UI rollback handled by caller)
      selectedRecipeIds.value = previousSelectedIds
      errors.push(response.error || 'Unknown error')
      toast.error('批量删除失败，已还原')
      return { success: false, removed: 0, errors }
    } catch (err) {
      console.error('[useFavoritesBatch] Error batch removing favorites:', err)
      // Rollback on error
      selectedRecipeIds.value = previousSelectedIds
      errors.push(err instanceof Error ? err.message : 'Unknown error')
      toast.error('批量删除失败，已还原')
      return { success: false, removed: 0, errors }
    } finally {
      isBatchOperating.value = false
    }
  }

  /**
   * Batch move to folder with optimistic update
   * @param recipeIds IDs to move
   * @param folderId Target folder (null for root)
   * @param updateInList Callback to optimistically update UI
   */
  const batchMoveToFolder = async (recipeIds: string[], folderId: string | null, updateInList: (ids: string[], folderId: string | null) => void): Promise<{ success: boolean; moved: number; errors: string[] }> => {
    if (!isAuthenticated.value || recipeIds.length === 0) {
      return { success: false, moved: 0, errors: ['Not authenticated or no recipe IDs provided'] }
    }

    // Store previous state for rollback
    const previousSelectedIds = new Set(selectedRecipeIds.value)

    // Optimistic update - remove from selection and update UI
    const idsToRemove = new Set(recipeIds)
    selectedRecipeIds.value = new Set([...selectedRecipeIds.value].filter(id => !idsToRemove.has(id)))
    updateInList(recipeIds, folderId)

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
          recipeIds,
          folderId,
        },
      })

      if (response.success) {
        return { success: true, moved: recipeIds.length, errors: [] }
      }

      // Rollback on failure
      selectedRecipeIds.value = previousSelectedIds
      errors.push(response.error || 'Unknown error')
      toast.error('批量移动失败，已还原')
      return { success: false, moved: 0, errors }
    } catch (err) {
      console.error('[useFavoritesBatch] Error batch moving favorites:', err)
      // Rollback on error
      selectedRecipeIds.value = previousSelectedIds
      errors.push(err instanceof Error ? err.message : 'Unknown error')
      toast.error('批量移动失败，已还原')
      return { success: false, moved: 0, errors }
    } finally {
      isBatchOperating.value = false
    }
  }

  const batchAddToFolder = async (_recipeIds: string[], _folderId: string): Promise<{ success: boolean; added: number; errors: string[] }> => {
    return batchMoveToFolder(_recipeIds, _folderId, () => {})
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
