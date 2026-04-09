/**
 * useDoubleTapGesture - 双击手势 Composable
 *
 * 特性：
 * - 支持双击/双tap检测
 * - 可配置双击间隔时间和移动阈值
 * - 提供按压状态和位置
 * - 自动清理事件监听器
 * - 触觉反馈支持
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

  const getState = (): DoubleTapState => ({
    x: touchState.startX,
    y: touchState.startY,
    timestamp: touchState.startTime,
  })

  const clearTapTimeout = () => {
    if (tapTimeoutId) {
      clearTimeout(tapTimeoutId)
      tapTimeoutId = null
    }
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (touchState.isActive) return

    const touch = e.touches[0]
    activeTouchId = touch.identifier
    touchState.isActive = true
    touchState.startX = touch.clientX
    touchState.startY = touch.clientY
    touchState.startTime = Date.now()

    if (opts.preventDefault) e.preventDefault()
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

    const deltaX = Math.abs(touch.clientX - touchState.startX)
    const deltaY = Math.abs(touch.clientY - touchState.startY)

    if (deltaX > opts.minDistance || deltaY > opts.minDistance) {
      touchState.isActive = false
      activeTouchId = null
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
      lastTapTime = now
      lastTapX = state.x
      lastTapY = state.y

      clearTapTimeout()
      tapTimeoutId = setTimeout(() => {
        callbacks.onTap?.(state, e)
        lastTapTime = 0
      }, opts.delay)
    }

    touchState.isActive = false
    activeTouchId = null
  }

  const handleTouchCancel = () => {
    clearTapTimeout()
    touchState.isActive = false
    activeTouchId = null
  }

  onMounted(() => {
    const el = targetRef.value
    if (!el) return

    el.addEventListener("touchstart", handleTouchStart, { passive: !opts.preventDefault })
    el.addEventListener("touchmove", handleTouchMove, { passive: true })
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
    clearTapTimeout()
  })

  return {
    isActive: computed(() => touchState.isActive),
    state: computed(() => getState()),
  }
}
