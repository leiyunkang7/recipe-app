/**
 * useSwipeGesture - 移动端触摸滑动手势 Composable
 *
 * 特性：
 * - 支持水平/垂直方向滑动检测
 * - 可配置阈值和最大持续时间
 * - 提供完整的 swipe 状态 (距离、速度、方向)
 * - 支持 preventScroll 防止滑动时页面滚动
 * - 自动清理事件监听器
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
}

export interface SwipeDirection {
  primary: 'left' | 'right' | 'up' | 'down' | null
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
}

export function useSwipeGesture(
  targetRef: Ref<HTMLElement | null>,
  callbacks: SwipeGestureCallbacks,
  options: SwipeGestureOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 触摸状态
  const touchState = reactive<{
    isActive: boolean
    startX: number
    startY: number
    currentX: number
    currentY: number
    startTime: number
  }>({
    isActive: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
  })

  // 跟踪活跃触摸点
  let activeTouchId: number | null = null

  /**
   * 计算当前滑动状态
   */
  const getSwipeState = (): SwipeState => {
    const distanceX = touchState.currentX - touchState.startX
    const distanceY = touchState.currentY - touchState.startY
    const duration = Date.now() - touchState.startTime
    const absX = Math.abs(distanceX)
    const absY = Math.abs(distanceY)
    const totalDistance = Math.sqrt(distanceX * distanceX + distanceY * distanceY)
    const velocity = duration > 0 ? totalDistance / duration : 0

    return {
      startX: touchState.startX,
      startY: touchState.startY,
      currentX: touchState.currentX,
      currentY: touchState.currentY,
      distanceX,
      distanceY,
      absX,
      absY,
      duration,
      velocity,
    }
  }

  /**
   * 确定滑动方向
   */
  const getSwipeDirection = (state: SwipeState): SwipeDirection => {
    const { absX, absY } = state

    // 如果移动距离小于阈值，返回无方向
    if (absX < opts.minSwipeDistance && absY < opts.minSwipeDistance) {
      return { primary: null, isHorizontal: false, isVertical: false }
    }

    const isHorizontal = absX > absY

    return {
      primary: isHorizontal
        ? (state.distanceX > 0 ? 'right' : 'left')
        : (state.distanceY > 0 ? 'down' : 'up'),
      isHorizontal: isHorizontal && opts.horizontal,
      isVertical: !isHorizontal && opts.vertical,
    }
  }

  /**
   * 处理触摸开始
   */
  const handleTouchStart = (e: TouchEvent) => {
    // 如果已经有活跃的触摸点，忽略新的触摸
    if (touchState.isActive) return

    const touch = e.touches[0]
    activeTouchId = touch.identifier
    touchState.isActive = true
    touchState.startX = touch.clientX
    touchState.startY = touch.clientY
    touchState.currentX = touch.clientX
    touchState.currentY = touch.clientY
    touchState.startTime = Date.now()

    // 阻止页面滚动
    if (opts.preventScroll) {
      document.body.style.overflow = 'hidden'
    }

    callbacks.onSwipeStart?.(getSwipeState())
  }

  /**
   * 处理触摸移动
   */
  const handleTouchMove = (e: TouchEvent) => {
    if (!touchState.isActive) return

    // 找到当前活跃的触摸点
    let touch: Touch | undefined
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === activeTouchId) {
        touch = e.touches[i]
        break
      }
    }

    if (!touch) return

    touchState.currentX = touch.clientX
    touchState.currentY = touch.clientY

    const state = getSwipeState()
    const direction = getSwipeDirection(state)

    // 检查是否超过最大持续时间
    if (state.duration > opts.maxDuration) {
      handleSwipeCancel()
      return
    }

    // 根据配置过滤方向
    const shouldProcess =
      (direction.isHorizontal && opts.horizontal) ||
      (direction.isVertical && opts.vertical) ||
      (!direction.primary) // 移动距离还不够判断方向时也继续处理

    if (shouldProcess) {
      callbacks.onSwipeMove?.(state, direction)

      // 阻止页面滚动
      if (opts.preventScroll && direction.primary) {
        e.preventDefault()
      }
    }
  }

  /**
   * 处理触摸结束
   */
  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchState.isActive) return

    // 清除活跃触摸点
    const wasActive = touchState.isActive
    const state = getSwipeState()
    const direction = getSwipeDirection(state)

    // 重置状态
    touchState.isActive = false
    activeTouchId = null

    // 恢复页面滚动
    if (opts.preventScroll) {
      document.body.style.overflow = ''
    }

    // 判断是否是有效滑动
    const isValidSwipe = direction.primary &&
      ((direction.isHorizontal && opts.horizontal) || (direction.isVertical && opts.vertical)) &&
      state.duration <= opts.maxDuration

    if (wasActive && isValidSwipe) {
      callbacks.onSwipeEnd?.(state, direction)
    } else if (wasActive) {
      // 滑动无效或被取消
      callbacks.onSwipeCancel?.(state)
    }
  }

  /**
   * 处理滑动取消
   */
  const handleSwipeCancel = () => {
    if (!touchState.isActive) return

    const state = getSwipeState()
    touchState.isActive = false
    activeTouchId = null

    if (opts.preventScroll) {
      document.body.style.overflow = ''
    }

    callbacks.onSwipeCancel?.(state)
  }

  /**
   * 处理触摸取消事件（如来电、打字键盘收起等）
   */
  const handleTouchCancel = () => {
    handleSwipeCancel()
  }

  // 生命周期管理
  onMounted(() => {
    const el = targetRef.value
    if (!el) return

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    el.addEventListener('touchcancel', handleTouchCancel, { passive: true })
  })

  onUnmounted(() => {
    const el = targetRef.value
    if (!el) return

    el.removeEventListener('touchstart', handleTouchStart)
    el.removeEventListener('touchmove', handleTouchMove)
    el.removeEventListener('touchend', handleTouchEnd)
    el.removeEventListener('touchcancel', handleTouchCancel)

    // 确保清理时恢复页面滚动
    if (opts.preventScroll) {
      document.body.style.overflow = ''
    }
  })

  // 返回状态供外部使用
  return {
    isActive: computed(() => touchState.isActive),
    state: computed(() => getSwipeState()),
    direction: computed(() => getSwipeDirection(getSwipeState())),
    cancel: handleSwipeCancel,
  }
}
