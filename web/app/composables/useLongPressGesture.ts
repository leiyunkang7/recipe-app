/**
 * useLongPressGesture - 长按手势 Composable
 *
 * 特性：
 * - 支持长按时间阈值配置
 * - 提供按压和释放状态
 * - 可选触发回调延迟
 * - 自动清理事件监听器
 * - 触觉反馈支持
 * - 优化：状态缓存减少对象创建
 *
 * @example
 * useLongPressGesture(
 *   buttonRef,
 *   {
 *     onLongPressStart: () => { isPressed.value = true },
 *     onLongPressEnd: () => { isPressed.value = false },
 *     onLongPress: () => { showContextMenu.value = true }
 *   },
 *   { delay: 500, minDistance: 10 }
 * )
 */

import type { Ref } from "vue"

export interface LongPressState {
  /** 初始 X 坐标 */
  startX: number
  /** 初始 Y 坐标 */
  startY: number
  /** 按压持续时间 (ms) */
  duration: number
  /** 是否超出移动阈值 */
  hasMoved: boolean
}

export interface LongPressGestureOptions {
  /** 长按触发时间 (ms)，默认 500ms */
  delay?: number
  /** 触发前允许的最大移动距离 (px)，默认 10px */
  minDistance?: number
  /** 是否阻止默认触摸事件 */
  preventDefault?: boolean
  /** 是否触发触觉反馈 */
  hapticFeedback?: boolean
}

export interface LongPressGestureCallbacks {
  onLongPressStart?: (state: LongPressState, e: TouchEvent) => void
  onLongPressMove?: (state: LongPressState, e: TouchEvent) => void
  onLongPressEnd?: (state: LongPressState, e: TouchEvent) => void
  onLongPressCancel?: (state: LongPressState) => void
  /** 达到长按时间阈值时触发 */
  onLongPress?: (state: LongPressState, e: TouchEvent) => void
}

const DEFAULT_OPTIONS: Required<LongPressGestureOptions> = {
  delay: 500,
  minDistance: 10,
  preventDefault: true,
  hapticFeedback: true,
}

/** 触发触觉反馈 */
function triggerHaptic(intensity: "light" | "medium" | "heavy" = "medium") {
  if (!("vibrate" in navigator)) return
  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30, 10, 30],
  }
  navigator.vibrate(patterns[intensity])
}

export function useLongPressGesture(
  targetRef: Ref<HTMLElement | null>,
  callbacks: LongPressGestureCallbacks,
  options: LongPressGestureOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 触摸状态 - 使用扁平结构避免深层响应式开销
  const touchState = reactive({
    isActive: false,
    isPressed: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    hasMoved: false,
    timeoutId: null as ReturnType<typeof setTimeout> | null,
  })

  // 跟踪活跃触摸点
  let activeTouchId: number | null = null
  // 存储最后一个 TouchEvent 用于回调
  let lastTouchEvent: TouchEvent | null = null
  // 缓存状态对象减少GC压力
  let cachedState: LongPressState | null = null
  let stateDirty = true

  /**
   * 标记状态需要重新计算
   */
  const invalidateCache = () => {
    stateDirty = true
    cachedState = null
  }

  /**
   * 获取当前按压状态 - 优化版本，使用缓存
   */
  const getState = (): LongPressState => {
    if (cachedState && !stateDirty) return cachedState

    cachedState = {
      startX: touchState.startX,
      startY: touchState.startY,
      duration: Date.now() - touchState.startTime,
      hasMoved: touchState.hasMoved,
    }
    stateDirty = false
    return cachedState
  }

  /**
   * 清除定时器
   */
  const clearTimer = () => {
    if (touchState.timeoutId) {
      window.clearTimeout(touchState.timeoutId)
      touchState.timeoutId = null
    }
  }

  /**
   * 处理长按触发
   */
  const handleLongPress = () => {
    if (!touchState.isActive) return

    touchState.isPressed = true
    if (opts.hapticFeedback) {
      triggerHaptic("heavy")
    }
    callbacks.onLongPress?.(getState(), lastTouchEvent!)
    callbacks.onLongPressStart?.(getState(), lastTouchEvent!)
  }

  /**
   * 处理触摸开始
   */
  const handleTouchStart = (e: TouchEvent) => {
    if (touchState.isActive) return

    const touch = e.touches[0]
    activeTouchId = touch.identifier
    touchState.isActive = true
    touchState.isPressed = false
    touchState.startX = touch.clientX
    touchState.startY = touch.clientY
    touchState.startTime = Date.now()
    touchState.hasMoved = false
    lastTouchEvent = e

    invalidateCache()

    if (opts.preventDefault) {
      e.preventDefault()
    }

    touchState.timeoutId = window.setTimeout(() => {
      handleLongPress()
    }, opts.delay)
  }

  /**
   * 处理触摸移动
   */
  const handleTouchMove = (e: TouchEvent) => {
    if (!touchState.isActive) return

    lastTouchEvent = e

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
      touchState.hasMoved = true

      if (touchState.isPressed) {
        clearTimer()
        touchState.isPressed = false
        callbacks.onLongPressCancel?.(getState())
      }
    }

    if (touchState.isPressed) {
      callbacks.onLongPressMove?.(getState(), e)
    }
  }

  /**
   * 处理触摸结束
   */
  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchState.isActive) return

    const wasPressed = touchState.isPressed
    const state = getState()
    lastTouchEvent = e

    clearTimer()

    touchState.isActive = false
    touchState.isPressed = false
    activeTouchId = null

    invalidateCache()

    if (wasPressed) {
      callbacks.onLongPressEnd?.(state, e)
    }
  }

  /**
   * 处理触摸取消
   */
  const handleTouchCancel = () => {
    if (!touchState.isActive) return

    const wasPressed = touchState.isPressed
    const state = getState()

    clearTimer()

    touchState.isActive = false
    touchState.isPressed = false
    activeTouchId = null

    invalidateCache()

    if (wasPressed) {
      callbacks.onLongPressCancel?.(state)
    }
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

    clearTimer()
  })

  return {
    isActive: computed(() => touchState.isActive),
    isPressed: computed(() => touchState.isPressed),
    state: computed(() => getState()),
    cancel: handleTouchCancel,
  }
}
