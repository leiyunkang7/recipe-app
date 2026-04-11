/**
 * useSwipeGesture - 移动端触摸滑动手势 Composable
 *
 * 特性：
 * - 支持水平/垂直方向滑动检测
 * - 可配置阈值和最大持续时间
 * - 提供完整的 swipe 状态 (距离、速度、方向)
 * - 支持 preventScroll 防止滑动时页面滚动
 * - 自动清理事件监听器
 * - 手势完成时的触觉反馈
 *
 * @example
 * useSwipeGesture(
 *   drawerRef,
 *   {
 *     onSwipeStart: () => { isDragging.value = true },
 *     onSwipeMove: (state) => { drawerTranslateX.value = state.distanceX },
 *     onSwipeEnd: (state, direction) => { ... },
 *     onSwipeCancel: () => { ... }
 *   },
 *   { horizontal: true, threshold: 50, preventScroll: true }
 * )
 */

export interface SwipeState {
  /** 初始 X 坐标 */
  startX: number
  /** 初始 Y 坐标 */
  startY: number
  /** 当前 X 坐标 */
  currentX: number
  /** 当前 Y 坐标 */
  currentY: number
  /** X 轴移动距离（正数=右滑，负数=左滑） */
  distanceX: number
  /** Y 轴移动距离（正数=下滑，负数=上滑） */
  distanceY: number
  /** X 轴绝对移动距离 */
  absX: number
  /** Y 轴绝对移动距离 */
  absY: number
  /** 滑动持续时间 (ms) */
  duration: number
  /** 滑动速度 (px/ms) */
  velocity: number
  /** X 轴瞬时速度 (px/ms) */
  velocityX: number
  /** Y 轴瞬时速度 (px/ms) */
  velocityY: number
}

export interface SwipeDirection {
  primary: "left" | "right" | "up" | "down" | null
  isHorizontal: boolean
  isVertical: boolean
}

export interface SwipeGestureOptions {
  /** 是否启用水平滑动 */
  horizontal?: boolean
  /** 是否启用垂直滑动 */
  vertical?: boolean
  /** 触发滑动识别的最小距离阈值 (px) */
  threshold?: number
  /** 最大滑动持续时间 (ms)，超时则取消 */
  maxDuration?: number
  /** 滑动时是否阻止页面滚动 */
  preventScroll?: boolean
  /** 滑动识别为完整手势需要的最小距离 */
  minSwipeDistance?: number
  /** 完成后是否触发触觉反馈 */
  hapticFeedback?: boolean
}

export interface SwipeGestureCallbacks {
  onSwipeStart?: (state: SwipeState) => void
  onSwipeMove?: (state: SwipeState, direction: SwipeDirection) => void
  onSwipeEnd?: (state: SwipeState, direction: SwipeDirection) => void
  onSwipeCancel?: (state: SwipeState) => void
}

const DEFAULT_OPTIONS: Required<SwipeGestureOptions> = {
  horizontal: true,
  vertical: true,
  threshold: 50,
  maxDuration: 1000,
  preventScroll: true,
  minSwipeDistance: 10,
  hapticFeedback: true,
}

/** 触发轻触反馈 */
function triggerHaptic(intensity: "light" | "medium" | "heavy" = "medium") {
  if (!("vibrate" in navigator)) return
  const patterns = {
    light: [10],
    medium: [20],
    heavy: [30, 10, 30],
  }
  navigator.vibrate(patterns[intensity])
}

export function useSwipeGesture(
  targetRef: Ref<HTMLElement | null>,
  callbacks: SwipeGestureCallbacks,
  options: SwipeGestureOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 触摸状态 - 使用扁平结构避免深层响应式开销
  const touchState = reactive({
    isActive: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    lastMoveTime: 0,
    lastMoveX: 0,
    lastMoveY: 0,
  })

  // 跟踪活跃触摸点
  let activeTouchId: number | null = null
  // 重用的状态对象避免每次创建新对象
  let cachedState: SwipeState | null = null
  let cachedDirection: SwipeDirection | null = null
  let stateDirty = true
  let directionDirty = true

  /**
   * 标记状态需要重新计算
   */
  const invalidateCache = () => {
    stateDirty = true
    directionDirty = true
    cachedState = null
    cachedDirection = null
  }

  /**
   * 计算当前滑动状态 - 优化版本，减少对象创建
   */
  const getSwipeState = (): SwipeState => {
    if (cachedState && !stateDirty) return cachedState

    const distanceX = touchState.currentX - touchState.startX
    const distanceY = touchState.currentY - touchState.startY
    const duration = touchState.startTime > 0 ? Date.now() - touchState.startTime : 0
    const absX = Math.abs(distanceX)
    const absY = Math.abs(distanceY)

    // 使用瞬时速度计算代替总距离除以总时间，更准确
    const timeDelta = touchState.lastMoveTime > 0 && touchState.startTime > 0
      ? Math.max(touchState.lastMoveTime - touchState.startTime, 1)
      : Math.max(duration, 1)
    const dx = touchState.currentX - (touchState.lastMoveX || touchState.startX)
    const dy = touchState.currentY - (touchState.lastMoveY || touchState.startY)
    const totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)

    cachedState = {
      startX: touchState.startX,
      startY: touchState.startY,
      currentX: touchState.currentX,
      currentY: touchState.currentY,
      distanceX,
      distanceY,
      absX,
      absY,
      duration,
      velocity: duration > 0 ? totalDistance / duration : 0,
      velocityX: timeDelta > 0 ? dx / timeDelta : 0,
      velocityY: timeDelta > 0 ? dy / timeDelta : 0,
    }
    stateDirty = false
    return cachedState
  }

  /**
   * 确定滑动方向 - 优化版本
   */
  const getSwipeDirection = (state: SwipeState): SwipeDirection => {
    if (cachedDirection && !directionDirty) return cachedDirection

    const { absX, absY } = state

    if (absX < opts.minSwipeDistance && absY < opts.minSwipeDistance) {
      cachedDirection = { primary: null, isHorizontal: false, isVertical: false }
    } else {
      const isHorizontal = absX > absY
      cachedDirection = {
        primary: isHorizontal
          ? (state.distanceX > 0 ? "right" : "left")
          : (state.distanceY > 0 ? "down" : "up"),
        isHorizontal: isHorizontal && opts.horizontal,
        isVertical: !isHorizontal && opts.vertical,
      }
    }
    directionDirty = false
    return cachedDirection
  }

  /**
   * 处理触摸开始
   */
  const handleTouchStart = (e: TouchEvent) => {
    if (touchState.isActive) return

    const touch = e.touches[0]
    activeTouchId = touch.identifier
    touchState.isActive = true
    touchState.startX = touch.clientX
    touchState.startY = touch.clientY
    touchState.currentX = touch.clientX
    touchState.currentY = touch.clientY
    touchState.startTime = Date.now()
    touchState.lastMoveTime = Date.now()
    touchState.lastMoveX = touch.clientX
    touchState.lastMoveY = touch.clientY

    invalidateCache()

    if (opts.preventScroll) {
      document.body.style.overflow = "hidden"
    }

    callbacks.onSwipeStart?.(getSwipeState())
  }

  /**
   * 处理触摸移动
   */
  const handleTouchMove = (e: TouchEvent) => {
    if (!touchState.isActive) return

    let touch: Touch | undefined
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === activeTouchId) {
        touch = e.touches[i]
        break
      }
    }

    if (!touch) return

    touchState.lastMoveTime = Date.now()
    touchState.lastMoveX = touchState.currentX
    touchState.lastMoveY = touchState.currentY
    touchState.currentX = touch.clientX
    touchState.currentY = touch.clientY

    invalidateCache()

    const state = getSwipeState()
    const direction = getSwipeDirection(state)

    if (state.duration > opts.maxDuration) {
      handleSwipeCancel()
      return
    }

    const shouldProcess =
      (direction.isHorizontal && opts.horizontal) ||
      (direction.isVertical && opts.vertical) ||
      (!direction.primary)

    if (shouldProcess) {
      callbacks.onSwipeMove?.(state, direction)

      if (opts.preventScroll && direction.primary) {
        e.preventDefault()
      }
    }
  }

  /**
   * 处理触摸结束
   */
  const handleTouchEnd = (_e: TouchEvent) => {
    if (!touchState.isActive) return

    const wasActive = touchState.isActive
    const state = getSwipeState()
    const direction = getSwipeDirection(state)

    touchState.isActive = false
    activeTouchId = null

    if (opts.preventScroll) {
      document.body.style.overflow = ""
    }

    const isValidSwipe = direction.primary &&
      ((direction.isHorizontal && opts.horizontal) || (direction.isVertical && opts.vertical)) &&
      state.duration <= opts.maxDuration

    if (wasActive && isValidSwipe) {
      if (opts.hapticFeedback) {
        triggerHaptic(state.velocity > 0.5 ? "heavy" : "medium")
      }
      callbacks.onSwipeEnd?.(state, direction)
    } else if (wasActive) {
      callbacks.onSwipeCancel?.(state)
    }
  }

  /**
   * 重置触摸状态和清理
   */
  const resetTouchState = () => {
    const wasActive = touchState.isActive
    touchState.isActive = false
    activeTouchId = null

    if (opts.preventScroll && wasActive) {
      document.body.style.overflow = ""
    }

    invalidateCache()
    return wasActive
  }

  /**
   * 处理滑动取消
   */
  const handleSwipeCancel = () => {
    const wasActive = resetTouchState()
    if (wasActive) {
      callbacks.onSwipeCancel?.(getSwipeState())
    }
  }

  /**
   * 处理触摸取消事件
   */
  const handleTouchCancel = () => {
    handleSwipeCancel()
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

    // 确保组件卸载时清理状态
    resetTouchState()
  })

  return {
    isActive: computed(() => touchState.isActive),
    state: computed(() => getSwipeState()),
    direction: computed(() => getSwipeDirection(getSwipeState())),
    cancel: handleSwipeCancel,
  }
}
