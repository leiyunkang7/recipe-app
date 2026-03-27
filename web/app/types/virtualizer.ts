/**
 * Shared types for @tanstack/vue-virtual virtualizer
 */

export interface VirtualItem {
  key: string | number
  size: number
  start: number
  index: number
}

export interface Virtualizer {
  getTotalSize: () => number
  getVirtualItems: () => VirtualItem[]
  setOptions: (options: { count: number }) => void
  update: () => void
  unmount: () => void
}