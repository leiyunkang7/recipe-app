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

  const state = reactive({
    pullDistance: 0,
    isPulling: false,
    isRefreshing: false,
    startY: 0,
    startTime: 0,
  })

  let refreshPromise: Promise<void> | null = null
  let hasTriggeredHaptic = false

  const isReady = computed(() => state.pullDistance >= opts.threshold && !state.isRefreshing)
  const pullRatio = computed(() => Math.min(state.pullDistance / opts.threshold, 1))

  const getState = (): PullToRefreshState => ({
    pullDistance: state.pullDistance,
    pullRatio: pullRatio.value,
    isPulling: state.isPulling,
    isRefreshing: state.isRefreshing,
    isReady: isReady.value,
  })

  const getRubberBandedDistance = (rawDistance: number): number => {
    if (rawDistance <= 0) return 0
    if (rawDistance <= opts.maxPull) return rawDistance
    const overflow = rawDistance - opts.maxPull
    return opts.maxPull + overflow * opts.elasticity
  }

  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    state.startY = touch.clientY
    state.startTime = Date.now()
    hasTriggeredHaptic = false

    // 检查是否在顶部
    const el = targetRef.value
    if (el && el.scrollTop > 0) return

    state.isPulling = true
    callbacks.onPullStart?.()
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!state.isPulling || state.isRefreshing) return

    const touch = e.touches[0]
    const rawDistance = touch.clientY - state.startY

    // 只允许下拉
    if (rawDistance <= 0) {
      state.pullDistance = 0
      return
    }

    state.pullDistance = getRubberBandedDistance(rawDistance)

    // 触发触觉反馈当达到阈值时
    if (!hasTriggeredHaptic && state.pullDistance >= opts.threshold) {
      hasTriggeredHaptic = true
      if (opts.hapticFeedback) triggerHaptic("light")
    }

    if (opts.preventScroll) {
      e.preventDefault()
    }

    callbacks.onPullMove?.(getState())
  }

  const handleTouchEnd = async () => {
    if (!state.isPulling) return

    const wasReady = isReady.value

    if (wasReady && !state.isRefreshing) {
      state.isRefreshing = true
      state.pullDistance = opts.threshold

      if (opts.hapticFeedback) triggerHaptic("medium")

      try {
        await callbacks.onRefresh?.()
        // 等待刷新完成动画
        await new Promise(resolve => setTimeout(resolve, 500))
      } finally {
        state.isRefreshing = false
        state.pullDistance = 0
      }
    } else {
      state.pullDistance = 0
    }

    state.isPulling = false
    callbacks.onPullEnd?.(getState())
  }

  const handleTouchCancel = () => {
    state.pullDistance = 0
    state.isPulling = false
    state.isRefreshing = false
  }

  onMounted(() => {
    const el = targetRef.value
    if (!el) return

    el.addEventListener("touchstart", handleTouchStart, { passive: true })
    el.addEventListener("touchmove", handleTouchMove, { passive: false })
    el.addEventListener("touchend", handleTouchEnd, { passive: true })
    el.addEventListener("touchcancel", handleTouchCancel, { passive: true })
  })

  onUnmounted(() => {
    const el = targetRef.value
    if (!el) return

    el.removeEventListener("touchstart", handleTouchStart)
    el.removeEventListener("touchmove", handleTouchMove)
    el.removeEventListener("touchend", handleTouchEnd)
    el.removeEventListener("touchcancel", handleTouchCancel)
  })

  return {
    pullDistance: computed(() => state.pullDistance),
    isPulling: computed(() => state.isPulling),
    isRefreshing: computed(() => state.isRefreshing),
    isReady,
    pullRatio,
    state: computed(() => getState()),
    cancel: handleTouchCancel,
  }
}
