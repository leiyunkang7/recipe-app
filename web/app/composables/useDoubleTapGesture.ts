/**
 * useDoubleTapGesture - 双击手势 Composable
 *
 * 特性：
 * - 支持双击/双tap检测
 * - 可配置双击间隔时间和移动阈值
 * - 提供按压状态和位置
 * - 自动清理事件监听器
 * - 触觉反馈支持
 * - 优化：状态缓存减少对象创建
 *
 * @example
 * useDoubleTapGesture(
 *   buttonRef,
 *   {
 *     onDoubleTap: (e) => { handleLike() }
 *   },
 *   { delay: 300, minDistance: 20 }
 * )
 */

import type { Ref } from "vue"

export interface DoubleTapState {
  x: number
  y: number
  timestamp: number
}

export interface DoubleTapOptions {
  /** 双击判定间隔时间 (ms)，默认 300ms */
  delay?: number
  /** 触发前允许的最大移动距离 (px) */
  minDistance?: number
  /** 是否阻止默认触摸事件 */
  preventDefault?: boolean
  /** 是否触发触觉反馈 */
  hapticFeedback?: boolean
}

export interface DoubleTapCallbacks {
  onDoubleTap?: (state: DoubleTapState, e: TouchEvent) => void
  onTap?: (state: DoubleTapState, e: TouchEvent) => void
}

const DEFAULT_OPTIONS: Required<DoubleTapOptions> = {
  delay: 300,
  minDistance: 20,
  preventDefault: false,
  hapticFeedback: true,
}

function triggerHaptic(intensity: "light" | "medium" | "heavy" = "medium") {
  if (!("vibrate" in navigator)) return
  const patterns = { light: [10], medium: [20], heavy: [30, 10, 30] }
  navigator.vibrate(patterns[intensity])
}

export function useDoubleTapGesture(
  targetRef: Ref<HTMLElement | null>,
  callbacks: DoubleTapCallbacks,
  options: DoubleTapOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 触摸状态 - 使用扁平结构避免深层响应式开销
  const touchState = reactive({
    isActive: false,
    startX: 0,
    startY: 0,
    startTime: 0,
  })

  let lastTapTime = 0
  let lastTapX = 0
  let lastTapY = 0
  let activeTouchId: number | null = null
  let tapTimeoutId: ReturnType<typeof setTimeout> | null = null
  let isUnmounted = false
  // 缓存状态对象减少GC压力
  let cachedState: DoubleTapState | null = null
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
  const getState = (): DoubleTapState => {
    if (cachedState && !stateDirty) return cachedState

    cachedState = {
      x: touchState.startX,
      y: touchState.startY,
      timestamp: touchState.startTime,
    }
    stateDirty = false
    return cachedState
  }

  const clearTapTimeout = () => {
    if (tapTimeoutId) {
      clearTimeout(tapTimeoutId)
      tapTimeoutId = null
    }
  }

  /**
   * 触发单击回调 - 使用当前捕获的值
   */
  const emitTap = (x: number, y: number, timestamp: number, e: TouchEvent) => {
    if (isUnmounted) return
    callbacks.onTap?.({ x, y, timestamp }, e)
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (touchState.isActive) return

    const touch = e.touches[0]
    if (!touch) return
    activeTouchId = touch.identifier
    touchState.isActive = true
    touchState.startX = touch.clientX
    touchState.startY = touch.clientY
    touchState.startTime = Date.now()

    invalidateCache()

    if (opts.preventDefault) e.preventDefault()
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchState.isActive || activeTouchId === null) return

    let touch: Touch | undefined
    for (let i = 0; i < e.touches.length; i++) {
      const t = e.touches[i]
      if (t && t.identifier === activeTouchId) {
        touch = t
        break
      }
    }

    if (!touch) return

    const deltaX = Math.abs(touch.clientX - touchState.startX)
    const deltaY = Math.abs(touch.clientY - touchState.startY)

    if (deltaX > opts.minDistance || deltaY > opts.minDistance) {
      touchState.isActive = false
      activeTouchId = null
      invalidateCache()
      // 清除待处理的单击回调
      clearTapTimeout()
    }
  }

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchState.isActive) return

    const state = getState()
    const now = Date.now()
    const timeSinceLastTap = now - lastTapTime

    // 检查是否是双击
    const isDoubleTap = timeSinceLastTap < opts.delay &&
      Math.abs(state.x - lastTapX) < opts.minDistance &&
      Math.abs(state.y - lastTapY) < opts.minDistance

    if (isDoubleTap) {
      clearTapTimeout()
      if (opts.hapticFeedback) triggerHaptic("medium")
      callbacks.onDoubleTap?.(state, e)
      lastTapTime = 0 // 重置，避免三次点击触发连续双击
    } else {
      // 单击 - 延迟后触发，允许检测双击
      // 捕获当前值以避免闭包问题
      const tapX = state.x
      const tapY = state.y
      const tapTimestamp = state.timestamp

      lastTapTime = now
      lastTapX = tapX
      lastTapY = tapY

      clearTapTimeout()
      tapTimeoutId = setTimeout(() => {
        if (!isUnmounted) {
          emitTap(tapX, tapY, tapTimestamp, e)
          lastTapTime = 0
        }
      }, opts.delay)
    }

    touchState.isActive = false
    activeTouchId = null
    invalidateCache()
  }

  const handleTouchCancel = () => {
    clearTapTimeout()
    touchState.isActive = false
    activeTouchId = null
    invalidateCache()
  }

  onMounted(() => {
    isUnmounted = false
    const el = targetRef.value
    if (!el) return

    el.addEventListener("touchstart", handleTouchStart, { passive: !opts.preventDefault })
    el.addEventListener("touchmove", handleTouchMove, { passive: true })
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
    clearTapTimeout()
  })

  return {
    isActive: computed(() => touchState.isActive),
    state: computed(() => getState()),
  }
}
