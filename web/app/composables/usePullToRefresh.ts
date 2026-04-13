/**
 * usePullToRefresh - 下拉刷新手势 Composable
 *
 * 特性：
 * - 支持下拉刷新手势
 * - 可配置触发阈值和最大下拉距离
 * - 弹性回弹效果
 * - 支持自定义刷新指示器
 * - 自动清理事件监听器
 * - 触觉反馈支持
 * - 优化：状态缓存减少对象创建
 *
 * @example
 * const { pullDistance, isRefreshing, isPulling } = usePullToRefresh(
 *   scrollContainerRef,
 *   {
 *     onRefresh: async () => { await fetchData() }
 *   },
 *   { threshold: 80, maxPull: 150 }
 * )
 */

import type { Ref } from "vue"

export interface PullToRefreshState {
  pullDistance: number
  pullRatio: number
  isPulling: boolean
  isRefreshing: boolean
  isReady: boolean
}

export interface PullToRefreshOptions {
  /** 触发刷新的下拉距离阈值 (px) */
  threshold?: number
  /** 最大下拉距离 (px)，超过后不再增加 */
  maxPull?: number
  /** 是否在刷新时阻止滚动 */
  preventScroll?: boolean
  /** 弹性系数 */
  elasticity?: number
  /** 是否触发触觉反馈 */
  hapticFeedback?: boolean
}

export interface PullToRefreshCallbacks {
  onRefresh?: () => Promise<void> | void
  onPullStart?: () => void
  onPullMove?: (state: PullToRefreshState) => void
  onPullEnd?: (state: PullToRefreshState) => void
}

const DEFAULT_OPTIONS: Required<PullToRefreshOptions> = {
  threshold: 80,
  maxPull: 150,
  preventScroll: true,
  elasticity: 0.5,
  hapticFeedback: true,
}

function triggerHaptic(intensity: "light" | "medium" | "heavy" = "medium") {
  if (!("vibrate" in navigator)) return
  const patterns = { light: [10], medium: [20], heavy: [30, 10, 30] }
  navigator.vibrate(patterns[intensity])
}

export function usePullToRefresh(
  targetRef: Ref<HTMLElement | null>,
  callbacks: PullToRefreshCallbacks,
  options: PullToRefreshOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 触摸状态 - 使用扁平结构避免深层响应式开销
  const touchState = reactive({
    pullDistance: 0,
    isPulling: false,
    isRefreshing: false,
    startY: 0,
    startTime: 0,
  })

  let _refreshPromise: Promise<void> | null = null
  let hasTriggeredHaptic = false
  let isUnmounted = false
  // 缓存状态对象减少GC压力
  let cachedState: PullToRefreshState | null = null
  let stateDirty = true

  const isReady = computed(() => touchState.pullDistance >= opts.threshold && !touchState.isRefreshing)
  const pullRatio = computed(() => Math.min(touchState.pullDistance / opts.threshold, 1))

  /**
   * 标记状态需要重新计算
   */
  const invalidateCache = () => {
    stateDirty = true
    cachedState = null
  }

  /**
   * 获取当前状态 - 优化版本，使用缓存
   */
  const getState = (): PullToRefreshState => {
    if (cachedState && !stateDirty) return cachedState

    cachedState = {
      pullDistance: touchState.pullDistance,
      pullRatio: pullRatio.value,
      isPulling: touchState.isPulling,
      isRefreshing: touchState.isRefreshing,
      isReady: isReady.value,
    }
    stateDirty = false
    return cachedState
  }

  const getRubberBandedDistance = (rawDistance: number): number => {
    if (rawDistance <= 0) return 0
    if (rawDistance <= opts.maxPull) return rawDistance
    const overflow = rawDistance - opts.maxPull
    return opts.maxPull + overflow * opts.elasticity
  }

  const resetState = () => {
    touchState.pullDistance = 0
    touchState.isPulling = false
    touchState.isRefreshing = false
    hasTriggeredHaptic = false
    invalidateCache()
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (isUnmounted) return
    const touch = e.touches[0]
    if (!touch) return
    touchState.startY = touch.clientY
    touchState.startTime = Date.now()
    hasTriggeredHaptic = false

    // 检查是否在顶部
    const el = targetRef.value
    if (el && el.scrollTop > 0) return

    touchState.isPulling = true
    invalidateCache()
    callbacks.onPullStart?.()
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (isUnmounted || !touchState.isPulling || touchState.isRefreshing) return

    const touch = e.touches[0]
    if (!touch) return
    const rawDistance = touch.clientY - touchState.startY

    // 只允许下拉
    if (rawDistance <= 0) {
      touchState.pullDistance = 0
      invalidateCache()
      return
    }

    touchState.pullDistance = getRubberBandedDistance(rawDistance)
    invalidateCache()

    // 触发触觉反馈当达到阈值时
    if (!hasTriggeredHaptic && touchState.pullDistance >= opts.threshold) {
      hasTriggeredHaptic = true
      if (opts.hapticFeedback) triggerHaptic("light")
    }

    if (opts.preventScroll) {
      e.preventDefault()
    }

    callbacks.onPullMove?.(getState())
  }

  const handleTouchEnd = async () => {
    if (isUnmounted || !touchState.isPulling) return

    const wasReady = isReady.value
    const wasRefreshing = touchState.isRefreshing

    if (wasReady && !wasRefreshing) {
      touchState.isRefreshing = true
      touchState.pullDistance = opts.threshold
      invalidateCache()

      if (opts.hapticFeedback) triggerHaptic("medium")

      try {
        await callbacks.onRefresh?.()
        // 等待刷新完成动画
        if (!isUnmounted) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } finally {
        if (!isUnmounted) {
          touchState.isRefreshing = false
          touchState.pullDistance = 0
          invalidateCache()
        }
      }
    } else {
      touchState.pullDistance = 0
      invalidateCache()
    }

    touchState.isPulling = false
    invalidateCache()
    callbacks.onPullEnd?.(getState())
  }

  const handleTouchCancel = () => {
    if (isUnmounted) return
    resetState()
  }

  onMounted(() => {
    isUnmounted = false
    const el = targetRef.value
    if (!el) return

    el.addEventListener("touchstart", handleTouchStart, { passive: true })
    el.addEventListener("touchmove", handleTouchMove, { passive: false })
    el.addEventListener("touchend", handleTouchEnd, { passive: true })
    el.addEventListener("touchcancel", handleTouchCancel, { passive: true })
  })

  onUnmounted(() => {
    isUnmounted = true
    const el = targetRef.value
    if (!el) return

    el.removeEventListener("touchstart", handleTouchStart)
    el.removeEventListener("touchmove", handleTouchMove)
    el.removeEventListener("touchend", handleTouchEnd)
    el.removeEventListener("touchcancel", handleTouchCancel)
    // 清理状态
    resetState()
  })

  return {
    pullDistance: computed(() => touchState.pullDistance),
    isPulling: computed(() => touchState.isPulling),
    isRefreshing: computed(() => touchState.isRefreshing),
    isReady,
    pullRatio,
    state: computed(() => getState()),
    cancel: handleTouchCancel,
  }
}
