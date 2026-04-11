/**
 * useEdgeSwipeGesture - 边缘滑动手势 Composable
 *
 * 特性：
 * - iOS 风格的边缘滑动导航
 * - 可配置边缘触发区域宽度
 * - 检测从屏幕左边缘滑入
 * - 支持速度和距离判断
 * - 自动清理事件监听器
 * - 触觉反馈支持
 * - 优化：状态缓存减少对象创建
 *
 * @example
 * useEdgeSwipeGesture(
 *   null, // 全局监听
 *   {
 *     onEdgeSwipeStart: () => { isNavigating.value = true },
 *     onEdgeSwipeMove: (state) => { progress.value = state.progress },
 *     onEdgeSwipeEnd: (state) => { if (state.isValid) navigateBack() }
 *   },
 *   { edgeWidth: 20, threshold: 80 }
 * )
 */

import type { Ref } from "vue"

export interface EdgeSwipeState {
  progress: number
  distanceX: number
  velocity: number
  isActive: boolean
  isValid: boolean
}

export interface EdgeSwipeOptions {
  /** 边缘检测区域宽度 (px) */
  edgeWidth?: number
  /** 触发滑动的最小距离 (px) */
  threshold?: number
  /** 最大滑动距离 (px) */
  maxDistance?: number
  /** 速度阈值 (px/s) */
  velocityThreshold?: number
  /** 是否启用 */
  enabled?: boolean
  /** 是否触发触觉反馈 */
  hapticFeedback?: boolean
}

export interface EdgeSwipeCallbacks {
  onEdgeSwipeStart?: (state: EdgeSwipeState) => void
  onEdgeSwipeMove?: (state: EdgeSwipeState) => void
  onEdgeSwipeEnd?: (state: EdgeSwipeState) => void
  onEdgeSwipeCancel?: () => void
}

const DEFAULT_OPTIONS: Required<EdgeSwipeOptions> = {
  edgeWidth: 20,
  threshold: 80,
  maxDistance: 150,
  velocityThreshold: 200,
  enabled: true,
  hapticFeedback: true,
}

function triggerHaptic(intensity: "light" | "medium" | "heavy" = "medium") {
  if (!("vibrate" in navigator)) return
  const patterns = { light: [10], medium: [20], heavy: [30, 10, 30] }
  navigator.vibrate(patterns[intensity])
}

export function useEdgeSwipeGesture(
  targetRef: Ref<HTMLElement | null | undefined>,
  callbacks: EdgeSwipeCallbacks,
  options: EdgeSwipeOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 触摸状态 - 使用扁平结构避免深层响应式开销
  const touchState = reactive({
    isActive: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    lastX: 0,
    lastTime: 0,
    progress: 0,
    distanceX: 0,
    velocity: 0,
  })

  let activeTouchId: number | null = null
  let hasTriggeredHaptic = false
  // 缓存状态对象减少GC压力
  let cachedState: EdgeSwipeState | null = null
  let stateDirty = true

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
  const getState = (): EdgeSwipeState => {
    if (cachedState && !stateDirty) return cachedState

    cachedState = {
      progress: touchState.progress,
      distanceX: touchState.distanceX,
      velocity: touchState.velocity,
      isActive: touchState.isActive,
      isValid: touchState.distanceX >= opts.threshold || touchState.velocity >= opts.velocityThreshold,
    }
    stateDirty = false
    return cachedState
  }

  const isInEdgeArea = (x: number): boolean => x <= opts.edgeWidth

  const handleTouchStart = (e: TouchEvent) => {
    if (!opts.enabled || touchState.isActive) return

    const touch = e.touches[0]

    // 只在左边缘触发
    if (!isInEdgeArea(touch.clientX)) return

    activeTouchId = touch.identifier
    touchState.isActive = true
    touchState.startX = touch.clientX
    touchState.startY = touch.clientY
    touchState.lastX = touch.clientX
    touchState.startTime = Date.now()
    touchState.lastTime = Date.now()
    touchState.progress = 0
    touchState.distanceX = 0
    touchState.velocity = 0
    hasTriggeredHaptic = false

    invalidateCache()
    callbacks.onEdgeSwipeStart?.(getState())
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchState.isActive || activeTouchId === null) return

    let touch: Touch | undefined
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === activeTouchId) {
        touch = e.touches[i]
        break
      }
    }

    if (!touch) return

    const now = Date.now()
    const timeDelta = Math.max(now - touchState.lastTime, 1)

    // Calculate velocity in pixels per second
    const instantVelocity = Math.abs((touch.clientX - touchState.lastX) / timeDelta) * 1000
    // Use weighted average for smoother velocity
    touchState.velocity = touchState.velocity === 0 ? instantVelocity : (touchState.velocity * 0.5 + instantVelocity * 0.5)

    touchState.distanceX = touch.clientX - touchState.startX
    touchState.progress = Math.min(touchState.distanceX / opts.threshold, opts.maxDistance / opts.threshold)
    touchState.lastX = touch.clientX
    touchState.lastTime = now

    // 只允许从左向右滑
    if (touchState.distanceX < 0) {
      handleCancel()
      return
    }

    invalidateCache()

    // 边缘区域内且有移动时触发触觉反馈
    if (!hasTriggeredHaptic && touchState.distanceX > opts.edgeWidth) {
      hasTriggeredHaptic = true
      if (opts.hapticFeedback) triggerHaptic("light")
    }

    callbacks.onEdgeSwipeMove?.(getState())
  }

  const handleTouchEnd = () => {
    if (!touchState.isActive) return

    const swipeState = getState()

    touchState.isActive = false
    activeTouchId = null

    if (swipeState.isValid) {
      if (opts.hapticFeedback) triggerHaptic("medium")
      callbacks.onEdgeSwipeEnd?.(swipeState)
    } else {
      callbacks.onEdgeSwipeCancel?.()
    }

    touchState.progress = 0
    touchState.distanceX = 0
    touchState.velocity = 0

    invalidateCache()
  }

  const handleCancel = () => {
    if (!touchState.isActive) return

    touchState.isActive = false
    touchState.progress = 0
    touchState.distanceX = 0
    touchState.velocity = 0
    activeTouchId = null

    invalidateCache()
    callbacks.onEdgeSwipeCancel?.()
  }

  const handleTouchCancel = () => {
    handleCancel()
  }

  onMounted(() => {
    const el = targetRef.value
    if (!el) {
      // 全局监听
      document.addEventListener("touchstart", handleTouchStart, { passive: true })
      document.addEventListener("touchmove", handleTouchMove, { passive: true })
      document.addEventListener("touchend", handleTouchEnd, { passive: true })
      document.addEventListener("touchcancel", handleTouchCancel, { passive: true })
      return
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true })
    el.addEventListener("touchmove", handleTouchMove, { passive: true })
    el.addEventListener("touchend", handleTouchEnd, { passive: true })
    el.addEventListener("touchcancel", handleTouchCancel, { passive: true })
  })

  onUnmounted(() => {
    const el = targetRef.value
    if (!el) {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
      document.removeEventListener("touchcancel", handleTouchCancel)
      return
    }

    el.removeEventListener("touchstart", handleTouchStart)
    el.removeEventListener("touchmove", handleTouchMove)
    el.removeEventListener("touchend", handleTouchEnd)
    el.removeEventListener("touchcancel", handleTouchCancel)
  })

  return {
    isActive: computed(() => touchState.isActive),
    progress: computed(() => touchState.progress),
    state: computed(() => getState()),
    cancel: handleCancel,
  }
}
