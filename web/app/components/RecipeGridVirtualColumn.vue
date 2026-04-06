<script setup lang="ts">
import { markRaw } from 'vue'
import type { RecipeListItem } from '~/types'
import type { Virtualizer, VirtualItem } from '~/types/virtualizer'

const props = defineProps<{
  recipes: RecipeListItem[]
  virtualizer: Virtualizer | null
  /** Column index, used for delay sync optimization */
  columnIndex?: number
}>()

const columnIndex = props.columnIndex ?? 0

// Extended virtual item type with resolved recipe
interface VirtualRow extends VirtualItem {
  recipe: RecipeListItem | undefined
}

// Extended VirtualItem type, key can be undefined (from markRaw)
interface VirtualItemRaw extends Omit<VirtualItem, 'key'> {
  key?: string | number
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

// Virtual items cache - use shallowRef to avoid deep reactive conversion
// Use Map to cache created VirtualRows
// Cache key uses index + recipeId combination to avoid stale data when recipes change
const virtualItemsCacheMap = new Map<string, VirtualRow>()

// Generate cache key: combine index and recipeId for uniqueness
const getCacheKey = (index: number, recipeId: string | number | undefined) =>
  `${index}:${recipeId ?? 'empty'}`

// Use shallowRef but via in-place mutation (index assignment) to avoid array reference change triggering unnecessary reactivity
// Note: VirtualRow objects use markRaw to avoid deep reactive conversion for performance
const virtualItemsCache = shallowRef<VirtualRow[]>([])

// totalSize reactive reference
const totalSizeRef = ref(0)

// Last synced scroll offset (for change detection)
let lastSyncedScrollTop = -1
let lastSyncedTotalSize = 0
let lastSyncedItemCount = 0
let lastSyncedFirstIndex = -1
let lastSyncedLastIndex = -1

// Track recipe IDs to detect when cache needs cleanup
let lastKnownRecipeIds = new Set<string>()

// Clean stale cache entries when recipes change significantly
const cleanCacheIfNeeded = (newRecipes: RecipeListItem[]) => {
  const newIds = new Set(newRecipes.map(r => r.id))
  
  // If more than 30% of recipes changed, clear the entire cache
  let changedCount = 0
  for (const id of newIds) {
    if (!lastKnownRecipeIds.has(id)) changedCount++
  }
  for (const id of lastKnownRecipeIds) {
    if (!newIds.has(id)) changedCount++
  }
  
  const changeRatio = changedCount / Math.max(newIds.size, lastKnownRecipeIds.size, 1)
  
  if (changeRatio > 0.3 || newRecipes.length < lastKnownRecipeIds.size * 0.5) {
    // Significant change - clear cache
    virtualItemsCache.value = []
    virtualItemsCacheMap.clear()
    lastSyncedTotalSize = 0
    lastSyncedItemCount = 0
    lastSyncedFirstIndex = -1
    lastSyncedLastIndex = -1
  }
  
  lastKnownRecipeIds = newIds
}

// Watch for recipes changes to detect cache invalidation
watch(() => props.recipes, (newRecipes) => {
  if (newRecipes.length > 0) {
    cleanCacheIfNeeded(newRecipes)
  }
}, { immediate: true, deep: false })

// syncVirtualizer is called by RecipeGrid on scroll
// From column updates passively via watch sharedVirtualItems
const syncVirtualizer = (scrollTop: number) => {
  // If scroll position hasn't changed, skip sync (only master column needs this check)
  if (isMasterColumn && scrollTop === lastSyncedScrollTop) return

  syncVirtualizerImmediate(scrollTop)
}

// Only triggered by master virtualizer to avoid duplicate calculations
// Key optimization: removed virtualizer.update() call because @tanstack/vue-virtual automatically
// responds to scroll events, no need to manually call update() on each scroll
// update() is only needed when content size changes (e.g., ResizeObserver measures new height)
const syncVirtualizerImmediate = (scrollTop: number) => {
  if (!props.virtualizer && isMasterColumn) return

  // Master column only updates scroll position record, no need to call update()
  // Virtualizer automatically responds to scroll via getScrollElement
  if (isMasterColumn) {
    lastSyncedScrollTop = scrollTop
  }

  // Master column uses its own virtualizer, from column uses shared items
  const items = isMasterColumn
    ? props.virtualizer!.getVirtualItems()
    : (sharedVirtualItems?.items ?? [])
  const newTotalSize = isMasterColumn
    ? props.virtualizer!.getTotalSize()
    : (sharedVirtualItems?.totalSize ?? 0)

  // Optimization: only compare firstIndex and lastIndex, which implicitly checks count change
  // Avoids performance overhead from 4-value comparison
  const firstIndex = items.length > 0 ? items[0]!.index : -1
  const lastIndex = items.length > 0 ? items[items.length - 1]!.index : -1

  // Optimization: merge conditions, check size change first (more common), then items range change
  if (newTotalSize !== lastSyncedTotalSize || firstIndex !== lastSyncedFirstIndex || lastIndex !== lastSyncedLastIndex) {
    lastSyncedTotalSize = newTotalSize
    lastSyncedItemCount = items.length
    lastSyncedFirstIndex = firstIndex
    lastSyncedLastIndex = lastIndex

    // Only update cache when items range changes
    // Use items[0]?.index !== lastSyncedFirstIndex for more precise detection
    if (firstIndex !== lastSyncedFirstIndex || lastIndex !== lastSyncedLastIndex || items.length !== lastSyncedItemCount) {
      // Reuse cached VirtualRow objects, only update necessary properties
      // Optimization: use index assignment instead of splice + spread to avoid creating new array each frame
      const newLength = items.length
      const existingLength = virtualItemsCache.value.length

      // Optimization: new array replacement triggers Vue reactivity update
      // shallowRef does not trigger reactivity for array index assignment, must create new array
      const newCache: VirtualRow[] = []
      for (let i = 0; i < newLength; i++) {
        const item = items[i]!
        const index = item.index
        const recipeId = props.recipes[index]?.id
        const cacheKey = getCacheKey(index, recipeId)
        let cached = virtualItemsCacheMap.get(cacheKey)
        if (cached) {
          // Reuse existing object, only update position and size
          cached.start = item.start
          cached.size = item.size
          cached.key = item.key
          // recipe may have changed, need to update reference (but skip if same object)
          const newRecipe = props.recipes[index]
          if (cached.recipe !== newRecipe) {
            cached.recipe = newRecipe
          }
          newCache.push(cached)
        } else {
          // Create new object and cache, use markRaw to avoid deep reactive conversion
          const newCached: VirtualRow = markRaw({
            key: item.key,
            size: item.size,
            start: item.start,
            index: item.index,
            recipe: props.recipes[index],
          } as VirtualRow)
          virtualItemsCacheMap.set(cacheKey, newCached)
          newCache.push(newCached)
        }
      }
      virtualItemsCache.value = newCache
    }

    // Optimization: direct update when totalSize changes, no secondary check needed
    // lastSyncedTotalSize already updated above
    totalSizeRef.value = newTotalSize
  }
}

// Watch virtualizer changes
watch(() => props.virtualizer, (virtualizer) => {
  if (virtualizer) {
    lastSyncedTotalSize = 0
    lastSyncedScrollTop = -1
    lastSyncedItemCount = 0
    lastSyncedFirstIndex = -1
    lastSyncedLastIndex = -1
  } else {
    virtualItemsCache.value = []
    virtualItemsCacheMap.clear()
    totalSizeRef.value = 0
    lastSyncedTotalSize = 0
    lastSyncedScrollTop = -1
    lastSyncedItemCount = 0
    lastSyncedFirstIndex = -1
    lastSyncedLastIndex = -1
    lastKnownRecipeIds.clear()
  }
}, { immediate: true })

// From column watches shared virtual items, master column updates via syncVirtualizer
watch(
  () => sharedVirtualItems?.items,
  (newItems) => {
    if (!isMasterColumn && newItems && newItems.length > 0) {
      // From column uses shared items, need to manually call syncVirtualizerImmediate
      // Since from column doesn't need to trigger update(), pass a virtual scrollTop
      syncVirtualizerImmediate(lastSyncedScrollTop)
    }
  },
  { deep: false }
)

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
          />
        </div>
      </template>
    </div>
  </div>
</template>
