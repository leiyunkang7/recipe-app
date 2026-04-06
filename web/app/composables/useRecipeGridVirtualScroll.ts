/**
 * useRecipeGridVirtualScroll - 食谱网格虚拟滚动 composable
 *
 * 功能：
 * - 虚拟滚动器初始化和管理
 * - 动态高度测量（ResizeObserver + LRU缓存 + RAF批量处理）
 * - 双列滚动同步
 * - 页面可见性变化处理
 *
 * 性能优化点：
 * - 全局 ResizeObserver 复用
 * - RAF 批量更新避免重排
 * - LRU 缓存防止内存泄漏
 * - 像素阈值节流减少同步开销
 */
import type { RecipeListItem, Recipe } from '~/types'
import type { Virtualizer } from '~/types/virtualizer'
import type { VirtualItem } from '~/types/virtualizer'

const COLUMN_GAP = 16
const CARD_HEIGHT = 280
const ESTIMATED_CARD_SIZE = CARD_HEIGHT + COLUMN_GAP
const VIRTUAL_OVERSCAN = 4
const MAX_MEASURED_HEIGHTS = 300

export interface SharedVirtualItems {
  items: VirtualItem[]
  totalSize: number
  masterColumnIndex: number
}

// ─── Measurement System ────────────────────────────────────────────────────────

const measuredHeights = new Map<HTMLElement, number>()
const pendingMeasures = new Map<HTMLElement, number>()
let globalResizeObserver: ResizeObserver | null = null
const elementsBeingObserved = new Set<HTMLElement>()
const lruMap = new Map<HTMLElement, number>()
let pendingResizeEntries: ResizeObserverEntry[] = []
let resizeRafId: number | null = null

const processResizeEntries = () => {
  if (pendingResizeEntries.length === 0) return
  const entries = pendingResizeEntries
  pendingResizeEntries = []
  for (const entry of entries) {
    const newHeight = entry.contentRect.height
    if (newHeight > 0) {
      const target = entry.target as HTMLElement
      measuredHeights.set(target, newHeight + COLUMN_GAP)
      pendingMeasures.delete(target)
      touchElement(target)
    }
  }
  if (measuredHeights.size > MAX_MEASURED_HEIGHTS * 0.8) {
    evictOldEntries()
  }
  if (pendingMeasures.size > 50) {
    const now = Date.now()
    for (const [el, timestamp] of pendingMeasures) {
      if (now - timestamp > 5000) pendingMeasures.delete(el)
    }
  }
}

const getGlobalResizeObserver = () => {
  if (!globalResizeObserver) {
    globalResizeObserver = new ResizeObserver((entries) => {
      pendingResizeEntries.push(...entries)
      if (resizeRafId === null) {
        resizeRafId = requestAnimationFrame(() => {
          resizeRafId = null
          processResizeEntries()
        })
      }
    })
  }
  return globalResizeObserver
}

let isEvicting = false
let evictRafId: number | null = null
let pendingEviction = false

const _scheduleEviction = () => {
  if (pendingEviction) return
  pendingEviction = true
  if (evictRafId === null) {
    evictRafId = requestAnimationFrame(() => {
      evictRafId = null
      pendingEviction = false
      evictOldEntries()
    })
  }
}

const evictOldEntries = () => {
  if (isEvicting) return
  isEvicting = true
  const targetSize = Math.floor(MAX_MEASURED_HEIGHTS * 0.7)
  const toDelete: HTMLElement[] = []
  const iterator = lruMap.entries()
  let current = iterator.next()
  let count = 0
  const maxToDelete = MAX_MEASURED_HEIGHTS - targetSize
  while (!current.done && count < maxToDelete) {
    toDelete.push(current.value[0])
    current = iterator.next()
    count++
  }
  for (const el of toDelete) {
    lruMap.delete(el)
    measuredHeights.delete(el)
    elementsBeingObserved.delete(el)
  }
  isEvicting = false
}

const touchElement = (el: HTMLElement) => {
  if (lruMap.has(el)) lruMap.delete(el)
  lruMap.set(el, Date.now())
}

export const measureElement = (el: HTMLElement | null): number => {
  if (!el) return ESTIMATED_CARD_SIZE
  const cached = measuredHeights.get(el)
  if (cached !== undefined) return cached
  if (!elementsBeingObserved.has(el)) {
    const observer = getGlobalResizeObserver()
    observer.observe(el)
    elementsBeingObserved.add(el)
    pendingMeasures.set(el, Date.now())
  }
  return ESTIMATED_CARD_SIZE
}

export const cleanupElementObserver = (el: HTMLElement) => {
  measuredHeights.delete(el)
  pendingMeasures.delete(el)
  elementsBeingObserved.delete(el)
  lruMap.delete(el)
}

export const cleanupMeasurement = () => {
  if (globalResizeObserver) {
    globalResizeObserver.disconnect()
    globalResizeObserver = null
  }
  elementsBeingObserved.clear()
  measuredHeights.clear()
  pendingMeasures.clear()
  lruMap.clear()
  if (resizeRafId !== null) {
    cancelAnimationFrame(resizeRafId)
    resizeRafId = null
  }
  pendingResizeEntries = []
}

// ─── Column Distribution ────────────────────────────────────────────────────────

// Estimate card height based on recipe properties for better column balancing
const estimateCardHeight = (recipe: RecipeListItem): number => {
  let height = CARD_HEIGHT
  // Add extra height for badges: rating, nutrition, views
  if (recipe.averageRating && recipe.averageRating > 0) height += 20
  if (recipe.nutritionInfo?.calories) height += 20
  if (recipe.views && recipe.views > 0) height += 20
  return height + COLUMN_GAP
}

export const recalculateColumns = (
  recipes: RecipeListItem[],
  oldLength: number,
  current: { left: RecipeListItem[]; right: RecipeListItem[] }
): { left: RecipeListItem[]; right: RecipeListItem[] } => {
  const totalLength = recipes.length
  const newItems = totalLength - oldLength
  const useFullRecalc = oldLength === 0 || newItems > 15 || newItems > oldLength

  if (useFullRecalc) {
    const left: Recipe[] = Array.from({ length: Math.ceil(totalLength / 2) })
    const right: Recipe[] = Array.from({ length: Math.floor(totalLength / 2) })
    let leftHeight = 0
    let rightHeight = 0
    let leftIdx = 0
    let rightIdx = 0
    for (let i = 0; i < totalLength; i++) {
      const recipe = recipes[i]
      const cardHeight = estimateCardHeight(recipe)
      if (leftHeight <= rightHeight) {
        left[leftIdx++] = recipe
        leftHeight += cardHeight
      } else {
        right[rightIdx++] = recipe
        rightHeight += cardHeight
      }
    }
    return { left, right }
  }

  const left = current.left
  const right = current.right
  let leftHeight = left.reduce((sum, r) => sum + estimateCardHeight(r), 0)
  let rightHeight = right.reduce((sum, r) => sum + estimateCardHeight(r), 0)
  for (let i = oldLength; i < totalLength; i++) {
    const recipe = recipes[i]!
    const cardHeight = estimateCardHeight(recipe)
    if (leftHeight <= rightHeight) {
      left.push(recipe)
      leftHeight += cardHeight
    } else {
      right.push(recipe)
      rightHeight += cardHeight
    }
  }
  return { left, right }
}

// ─── Virtual Scrolling Setup ───────────────────────────────────────────────────

export async function initVirtualizers(
  scrollContainer: HTMLElement | null,
  leftColumn: RecipeListItem[],
  rightColumn: RecipeListItem[],
  leftVirtualizerRef: { value: Virtualizer | null },
  rightVirtualizerRef: { value: Virtualizer | null },
  isInitializingRef: { value: boolean }
): Promise<void> {
  if (!scrollContainer) return
  if (leftVirtualizerRef.value && rightVirtualizerRef.value) return
  if (isInitializingRef.value) return
  isInitializingRef.value = true

  const { useVirtualizer } = await import('@tanstack/vue-virtual')

  leftVirtualizerRef.value = useVirtualizer({
    count: leftColumn.length,
    getScrollElement: () => scrollContainer,
    estimateSize: () => ESTIMATED_CARD_SIZE,
    measureElement,
    overscan: VIRTUAL_OVERSCAN,
  })

  rightVirtualizerRef.value = useVirtualizer({
    count: rightColumn.length,
    getScrollElement: () => scrollContainer,
    estimateSize: () => ESTIMATED_CARD_SIZE,
    measureElement,
    overscan: VIRTUAL_OVERSCAN,
  })

  isInitializingRef.value = false
}

// ─── Scroll Sync ─────────────────────────────────────────────────────────────

const SCROLL_PIXEL_THRESHOLD = 4
let rafId: number | null = null
let pendingScrollTop: number | null = null

export const setupScrollSync = (
  scrollContainer: HTMLElement | null,
  leftVirtualizer: { value: Virtualizer | null },
  leftColumnRef: { value: { syncVirtualizer: () => void } | null },
  onScrollSync: () => void
) => {
  if (!scrollContainer) return
  pendingScrollTop = null
  scrollContainer.addEventListener('scroll', onScrollSync, { passive: true })
}

export const cleanupScrollSync = (
  scrollContainer: HTMLElement | null,
  onScrollSync: () => void
) => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  pendingScrollTop = null
  if (scrollContainer) {
    scrollContainer.removeEventListener('scroll', onScrollSync)
  }
}

export const onVirtualScrollSync = (
  scrollContainer: HTMLElement | null,
  leftVirtualizer: { value: Virtualizer | null },
  leftColumnRef: { value: { syncVirtualizer: () => void } | null }
) => {
  const scrollTop = scrollContainer?.scrollTop ?? -1

  // Always update pending scroll top - we'll use it in the next frame
  // This prevents dropping events when RAF is slow
  if (Math.abs(scrollTop - (pendingScrollTop ?? -1)) < SCROLL_PIXEL_THRESHOLD) return

  pendingScrollTop = scrollTop

  if (rafId !== null) return

  rafId = requestAnimationFrame(() => {
    rafId = null
    const scrollToProcess = pendingScrollTop
    pendingScrollTop = null
    if (!leftVirtualizer.value || scrollToProcess === null) return
    leftColumnRef.value?.syncVirtualizer(scrollToProcess)
  })
}

export const onVisibilityChange = (
  pendingUpdateRafId: { value: number | null },
  pendingLeft: { value: number | null },
  pendingRight: { value: number | null },
  rafIdRef: { value: number | null },
  lastScrollTopRef: { value: number }
) => {
  if (document.visibilityState === 'visible') {
    if (pendingUpdateRafId.value !== null) {
      cancelAnimationFrame(pendingUpdateRafId.value)
      pendingUpdateRafId.value = null
    }
    pendingLeft.value = null
    pendingRight.value = null
    if (rafIdRef.value !== null) {
      cancelAnimationFrame(rafIdRef.value)
      rafIdRef.value = null
    }
    lastScrollTopRef.value = -1
    pendingScrollTop = null
  }
}
