<script setup lang="ts">
import { markRaw } from 'vue'
import type { RecipeListItem } from '~/types'
import type { Virtualizer, VirtualItem } from '~/types/virtualizer'

const props = withDefaults(defineProps<{
  recipes: RecipeListItem[]
  virtualizer: Virtualizer | null
  /** Column index, used for delay sync optimization */
  columnIndex?: number
  /** Search query for highlighting */
  searchQuery?: string
}>(), {
  searchQuery: '',
})

const columnIndex = props.columnIndex ?? 0

// Extended virtual item type with resolved recipe
interface VirtualRow extends VirtualItem {
  recipe: RecipeListItem | undefined
}

// Injected shared virtual items context (provided by RecipeGrid)
// From column (columnIndex !== 0) uses shared data to avoid duplicate getVirtualItems() calls
const sharedVirtualItems = inject<{
  items: VirtualItem[]
  totalSize: number
  masterColumnIndex: number
} | null>('sharedVirtualItems', null)

// Whether this is the master column (computes virtual items)
const isMasterColumn = columnIndex === 0

// Virtual items cache - use shallowRef with Map for O(1) lookups
// Cache key uses numeric index for faster lookups (avoid string allocation per sync)
const virtualItemsCacheMap = new Map<number, VirtualRow>()

// Pre-allocated array to avoid per-sync allocations
// Size will be dynamically adjusted based on actual items
const virtualItemsCache = shallowRef<VirtualRow[]>([])

// totalSize reactive reference
const totalSizeRef = ref(0)

// Last synced state for change detection (packed into single object for better cache locality)
let lastSyncedState = { scrollTop: -1, totalSize: 0, firstIndex: -1, lastIndex: -1, recipeCount: 0 }

// syncVirtualizer is called by RecipeGrid on scroll
const syncVirtualizer = (scrollTop: number) => {
  // If scroll position hasn't changed, skip sync
  if (scrollTop === lastSyncedState.scrollTop) return
  syncVirtualizerImmediate(scrollTop)
}

// Only triggered by master virtualizer to avoid duplicate calculations
const syncVirtualizerImmediate = (scrollTop: number) => {
  if (!props.virtualizer && isMasterColumn) return

  // Master column uses its own virtualizer, from column uses shared items
  const items = isMasterColumn
    ? props.virtualizer!.getVirtualItems()
    : (sharedVirtualItems?.items ?? [])
  const newTotalSize = isMasterColumn
    ? props.virtualizer!.getTotalSize()
    : (sharedVirtualItems?.totalSize ?? 0)

  const firstIndex = items.length > 0 ? items[0]!.index : -1
  const lastIndex = items.length > 0 ? items[items.length - 1]!.index : -1

  // Check if anything actually changed - early exit optimization
  const s = lastSyncedState
  if (newTotalSize === s.totalSize && firstIndex === s.firstIndex && lastIndex === s.lastIndex) {
    // Only scroll position changed - no need to rebuild cache or update totalSize
    lastSyncedState.scrollTop = scrollTop
    return
  }

  // Something changed - update state and rebuild cache
  lastSyncedState = {
    scrollTop,
    totalSize: newTotalSize,
    firstIndex,
    lastIndex,
    recipeCount: items.length,
  }

  // Rebuild cache - reuse existing objects when possible
  const newLength = items.length
  const existingCache = virtualItemsCache.value
  const existingMap = virtualItemsCacheMap

  // Track which indices are still valid
  const validIndices = new Set<number>(newLength > 0 ? [firstIndex] : [])
  for (let i = 0; i < newLength; i++) {
    validIndices.add(items[i]!.index)
  }

  // Reuse cached entries where possible, clear stale entries
  const newCache: VirtualRow[] = new Array(newLength)
  for (let i = 0; i < newLength; i++) {
    const item = items[i]!
    const index = item.index
    let cached = existingMap.get(index)

    if (cached) {
      // Reuse existing object - update only changed properties
      cached.start = item.start
      cached.size = item.size
      cached.key = item.key
      // recipe reference may have changed
      const newRecipe = props.recipes[index]
      if (cached.recipe !== newRecipe) {
        cached.recipe = newRecipe
      }
      newCache[i] = cached
    } else {
      // Create new cached entry with markRaw to avoid deep reactivity
      cached = markRaw({
        key: item.key,
        size: item.size,
        start: item.start,
        index: item.index,
        recipe: props.recipes[index],
      }) as VirtualRow
      existingMap.set(index, cached)
      newCache[i] = cached
    }
  }

  // Clear map entries that are no longer visible (avoid memory leaks)
  if (existingCache.length > newLength * 2) {
    // Only clean when there's significant size difference to avoid constant cleanup
    for (const idx of existingMap.keys()) {
      if (!validIndices.has(idx)) {
        existingMap.delete(idx)
      }
    }
  }

  virtualItemsCache.value = newCache
  totalSizeRef.value = newTotalSize
}

// Watch virtualizer changes - simplified reset
watch(() => props.virtualizer, (virtualizer) => {
  if (virtualizer) {
    lastSyncedState = { scrollTop: -1, totalSize: 0, firstIndex: -1, lastIndex: -1, recipeCount: 0 }
  } else {
    virtualItemsCache.value = []
    virtualItemsCacheMap.clear()
    totalSizeRef.value = 0
    lastSyncedState = { scrollTop: -1, totalSize: 0, firstIndex: -1, lastIndex: -1, recipeCount: 0 }
  }
}, { immediate: true })

defineExpose({ syncVirtualizer })
</script>

<template>
  <div class="flex-1 flex flex-col gap-4 md:gap-5 relative">
    <div
      :style="{
        height: `${totalSizeRef}px`,
        width: '100%',
        position: 'relative',
      }"
    >
      <!-- v-memo: removed virtualRow.size to avoid frequent re-renders from dynamic height measurement -->
      <!-- size changes are absorbed via transform: translateY(), no need to re-render entire card -->
      <template v-for="virtualRow in virtualItemsCache" :key="virtualRow.key">
        <div
          v-memo="[virtualRow.key, virtualRow.recipe?.id]"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
            contain: 'strict',
            willChange: 'transform',
          }"
        >
          <RecipeCardLazy
            v-if="virtualRow.recipe"
            :recipe="virtualRow.recipe"
            :enter-delay="0"
            disable-animation
            :search-query="searchQuery"
          />
        </div>
      </template>
    </div>
  </div>
</template>
