/**
 * Selection utilities for admin lists
 * Provides O(1) lookup for selected items
 */

/**
 * Creates a Record for O(1) lookup of selected IDs
 * Useful for v-memo tracking and checkbox state
 */
export function createSelectedMap(selectedIds: string[]): Record<string, boolean> {
  const map: Record<string, boolean> = {}
  for (const id of selectedIds) {
    map[id] = true
  }
  return map
}