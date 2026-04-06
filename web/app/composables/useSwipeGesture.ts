/**
 * useSwipeGesture - 移动端触摸滑动手势 composable
 *
 * 提供高性能的 swipe 检测功能，支持：
 * - 水平/垂直 swipe 检测
 * - swipe 方向判断
 * - swipe 距离和速度计算
 * - 阈值判断（区分 swipe 和 scroll）
 * - 防止误触（滚动时禁用、长按时禁用）
 */

export type SwipeDirection = 'left' | 'right' | 'up' | 'down' | null

interface SwipeState {
  direction: SwipeDirection
  distanceX: number
  distanceY: number
  velocityX: number
  velocityY: number
  duration: number
  startTime: number
  startX: number
  startY: number
  isSwiping: boolean
  absX: number
  absY: number
}

interface SwipeOptions {
  /** swipe 阈值（像素），低于此值不触发 */
  threshold?: number
  /** 允许的反向 swipe 比例（如 0.3 允许 30% 反向移动） */
  reverseRatio?: number
  /** 是否监听水平方向 */
  horizontal?: boolean
  /** 是否监听垂直方向 */
  vertical?: boolean
  /** 最大允许的swipe时长（ms），超过则取消 */
  maxDuration?: number
  /** 最小滑动距离才开始计算方向 */
  directionThreshold?: number
  /** 是否在滑动时阻止默认滚动 */
  preventScroll?: boolean
}

interface SwipeCallbacks {
  onSwipeStart?: (state: SwipeState) => void
  onSwipeMove?: (state: SwipeState) => void
  onSwipeEnd?: (state: SwipeState, direction: SwipeDirection) => void
  onSwipeCancel?: () => void
}

const DEFAULT_OPTIONS: Required<SwipeOptions> = {
  threshold: 50,
  reverseRatio: 0.3,
  horizontal: true,
  vertical: false,
  maxDuration: 500,
  directionThreshold: 10,
  preventScroll: true,
}

export function useSwipeGesture(
  elementRef: Ref<HTMLElement | null>,
  callbacks: SwipeCallbacks,
  options: SwipeOptions = {}
) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  const state = reactive<SwipeState>({
    direction: null,
    distanceX: 0,
    distanceY: 0,
    velocityX: 0,
    velocityY: 0,
    duration: 0,
    startTime: 0,
    startX: 0,
    startY: 0,
    isSwiping: false,
    absX: 0,
    absY: 0,
  })

  let startX = 0
  let startY = 0
  let startTime = 0
  let lastX = 0
  let lastY = 0
  let lastTime = 0
  let rafId: number | null = null
  let longPressTimer: ReturnType<typeof setTimeout> | null = null
  let isMoved = false
  let isCancelled = false

  const resetState = () => {
    state.direction = null
    state.distanceX = 0
    state.distanceY = 0
    state.velocityX = 0
    state.velocityY = 0
    state.duration = 0
    state.startX = 0
    state.startY = 0
    state.isSwiping = false
    state.absX = 0
    state.absY = 0
    isMoved = false
    isCancelled = false
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 1) return

    const touch = e.touches[0]
    startX = touch.clientX
    startY = touch.clientY
    lastX = startX
    lastY = startY
    startTime = Date.now()
    lastTime = startTime
    isMoved = false
    isCancelled = false

    resetState()
    state.startX = startX
    state.startY = startY
    state.startTime = startTime
    state.isSwiping = true

    // 长按检测 - 100ms内移动视为长按取消
    longPressTimer = setTimeout(() => {
      if (!isMoved && state.isSwiping) {
        // 如果还没开始移动就触发长按，取消swipe
        isCancelled = true
        callbacks.onSwipeCancel?.()
        resetState()
      }
    }, 100)

    callbacks.onSwipeStart?.(state)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!state.isSwiping || isCancelled || e.touches.length !== 1) return

    // 清除长按定时器
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }

    const touch = e.touches[0]
    const currentX = touch.clientX
    const currentY = touch.clientY
    const currentTime = Date.now()

    const deltaX = currentX - startX
    const deltaY = currentY - startY

    // 更新状态
    state.distanceX = deltaX
    state.distanceY = deltaY
    state.absX = Math.abs(deltaX)
    state.absY = Math.abs(deltaY)

    // 计算速度
    const dt = currentTime - lastTime
    if (dt > 0) {
      state.velocityX = (currentX - lastX) / dt
      state.velocityY = (currentY - lastY) / dt
    }

    lastX = currentX
    lastY = currentY
    lastTime = currentTime
    state.duration = currentTime - startTime

    // 检查是否超时
    if (state.duration > mergedOptions.maxDuration) {
      callbacks.onSwipeCancel?.()
      resetState()
      return
    }

    // 确定方向 - 达到方向阈值后才开始判断方向
    if (state.absX > mergedOptions.directionThreshold || state.absY > mergedOptions.directionThreshold) {
      isMoved = true

      if (mergedOptions.horizontal && state.absX > state.absY) {
        state.direction = deltaX > 0 ? 'right' : 'left'
      } else if (mergedOptions.vertical && state.absY > state.absX) {
        state.direction = deltaY > 0 ? 'down' : 'up'
      }
    }

    if (rafId) cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      callbacks.onSwipeMove?.(state)
    })

    // 阻止默认滚动
    if (mergedOptions.preventScroll && isMoved) {
      e.preventDefault()
    }
  }

  const handleTouchEnd = (e: TouchEvent) => {
    if (!state.isSwiping) return

    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }

    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }

    const endTime = Date.now()
    const duration = endTime - startTime

    // 计算最终速度
    if (duration > 0) {
      state.velocityX = state.distanceX / duration
      state.velocityY = state.distanceY / duration
    }
    state.duration = duration

    // 如果未移动或已取消，直接返回
    if (!isMoved || isCancelled) {
      callbacks.onSwipeCancel?.()
      resetState()
      return
    }

    // 判断是否满足 swipe 条件
    const { distanceX, distanceY, direction, absX, absY } = state
    const threshold = mergedOptions.threshold
    const reverseRatio = mergedOptions.reverseRatio

    let shouldTrigger = false
    let finalDirection: SwipeDirection = null

    if (mergedOptions.horizontal && absX > absY) {
      // 水平方向
      if (absX >= threshold) {
        // 检查反向移动比例
        const reverseThreshold = absX * reverseRatio
        if (distanceX > 0 && distanceX >= -reverseThreshold) {
          shouldTrigger = true
          finalDirection = 'right'
        } else if (distanceX < 0 && distanceX <= reverseThreshold) {
          shouldTrigger = true
          finalDirection = 'left'
        }
      }
    } else if (mergedOptions.vertical && absY > absX) {
      // 垂直方向
      if (absY >= threshold) {
        const reverseThreshold = absY * reverseRatio
        if (distanceY > 0 && distanceY >= -reverseThreshold) {
          shouldTrigger = true
          finalDirection = 'down'
        } else if (distanceY < 0 && distanceY <= reverseThreshold) {
          shouldTrigger = true
          finalDirection = 'up'
        }
      }
    }

    if (shouldTrigger && finalDirection === direction) {
      callbacks.onSwipeEnd?.(state, finalDirection)
    } else {
      callbacks.onSwipeCancel?.()
    }

    resetState()
  }

  const handleTouchCancel = () => {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      longPressTimer = null
    }
    callbacks.onSwipeCancel?.()
    resetState()
  }

  const bindEvents = () => {
    const el = elementRef.value
    if (!el) return

    // 使用 passive: false 以允许 preventDefault
    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    el.addEventListener('touchcancel', handleTouchCancel, { passive: true })
  }

  const unbindEvents = () => {
    const el = elementRef.value
    if (!el) return

    el.removeEventListener('touchstart', handleTouchStart)
    el.removeEventListener('touchmove', handleTouchMove)
    el.removeEventListener('touchend', handleTouchEnd)
    el.removeEventListener('touchcancel', handleTouchCancel)
  }

  watch(elementRef, (newEl, oldEl) => {
    if (oldEl) {
      unbindEvents()
    }
    if (newEl) {
      bindEvents()
    }
  })

  onMounted(() => {
    bindEvents()
  })

  onUnmounted(() => {
    unbindEvents()
    if (rafId) {
      cancelAnimationFrame(rafId)
    }
    if (longPressTimer) {
      clearTimeout(longPressTimer)
    }
  })

  return {
    state: readonly(state),
  }
}
