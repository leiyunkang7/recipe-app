/**
 * usePinchZoomGesture - 双指缩放手势 Composable
 *
 * 特性：
 * - 支持双指 pinch-to-zoom 缩放
 * - 可配置最小/最大缩放比例
 * - 弹性回弹效果
 * - 缩放中心点支持
 * - 自动清理事件监听器
 * - 触觉反馈支持
 * - 优化：状态缓存减少对象创建
 */

import type { Ref } from "vue"

export interface PinchZoomState {
  scale: number
  initialScale: number
  centerX: number
  centerY: number
  translateX: number
  translateY: number
  initialDistance: number
  isZooming: boolean
}

export interface PinchZoomOptions {
  minScale?: number
  maxScale?: number
  elasticity?: number
  preventScroll?: boolean
  hapticFeedback?: boolean
}

export interface PinchZoomCallbacks {
  onZoomStart?: (state: PinchZoomState) => void
  onZoomChange?: (state: PinchZoomState) => void
  onZoomEnd?: (state: PinchZoomState) => void
  onZoomCancel?: (state: PinchZoomState) => void
}

const DEFAULT_OPTIONS: Required<PinchZoomOptions> = {
  minScale: 1,
  maxScale: 3,
  elasticity: 0.3,
  preventScroll: true,
  hapticFeedback: true,
}

function triggerHaptic(intensity: "light" | "medium" | "heavy" = "medium") {
  if (!("vibrate" in navigator)) return
  const patterns = { light: [10], medium: [20], heavy: [30, 10, 30] }
  navigator.vibrate(patterns[intensity])
}

function getDistance(touch1: Touch, touch2: Touch): number {
  const dx = touch2.clientX - touch1.clientX
  const dy = touch2.clientY - touch1.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

function getMidpoint(touch1: Touch, touch2: Touch): { x: number; y: number } {
  return { x: (touch1.clientX + touch2.clientX) / 2, y: (touch1.clientY + touch2.clientY) / 2 }
}

export function usePinchZoomGesture(
  targetRef: Ref<HTMLElement | null>,
  callbacks: PinchZoomCallbacks,
  options: PinchZoomOptions = {}
) {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // 触摸状态 - 使用扁平结构避免深层响应式开销
  const touchState = reactive({
    isActive: false,
    scale: 1,
    initialScale: 1,
    centerX: 0,
    centerY: 0,
    translateX: 0,
    translateY: 0,
    initialDistance: 0,
  })

  let activeTouchIds: [number, number] | null = null
  // 缓存状态对象减少GC压力
  let cachedState: PinchZoomState | null = null
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
  const getState = (): PinchZoomState => {
    if (cachedState && !stateDirty) return cachedState

    cachedState = {
      scale: touchState.scale,
      initialScale: touchState.initialScale,
      centerX: touchState.centerX,
      centerY: touchState.centerY,
      translateX: touchState.translateX,
      translateY: touchState.translateY,
      initialDistance: touchState.initialDistance,
      isZooming: touchState.isActive,
    }
    stateDirty = false
    return cachedState
  }

  const getElasticScale = (rawScale: number): number => {
    const { minScale, maxScale, elasticity } = opts
    if (rawScale < minScale) return minScale - (minScale - rawScale) * elasticity
    if (rawScale > maxScale) return maxScale + (rawScale - maxScale) * elasticity
    return rawScale
  }

  /**
   * 重置状态并清理
   */
  const resetState = () => {
    const wasActive = touchState.isActive
    touchState.isActive = false
    touchState.translateX = 0
    touchState.translateY = 0
    activeTouchIds = null
    invalidateCache()
    return wasActive
  }

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length !== 2) return
    const touch1 = e.touches[0]
    const touch2 = e.touches[1]
    activeTouchIds = [touch1.identifier, touch2.identifier]
    const distance = getDistance(touch1, touch2)
    const midpoint = getMidpoint(touch1, touch2)
    touchState.isActive = true
    touchState.initialScale = touchState.scale
    touchState.initialDistance = distance
    touchState.centerX = midpoint.x
    touchState.centerY = midpoint.y
    invalidateCache()
    if (opts.preventScroll) e.preventDefault()
    callbacks.onZoomStart?.(getState())
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!touchState.isActive || e.touches.length !== 2 || !activeTouchIds) return
    let touch1: Touch | undefined, touch2: Touch | undefined
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === activeTouchIds[0]) touch1 = e.touches[i]
      else if (e.touches[i].identifier === activeTouchIds[1]) touch2 = e.touches[i]
    }
    if (!touch1 || !touch2) return
    const distance = getDistance(touch1, touch2)
    const midpoint = getMidpoint(touch1, touch2)
    const rawScale = (distance / touchState.initialDistance) * touchState.initialScale
    touchState.scale = getElasticScale(rawScale)
    touchState.centerX = midpoint.x
    touchState.centerY = midpoint.y
    invalidateCache()
    if (opts.preventScroll) e.preventDefault()
    callbacks.onZoomChange?.(getState())
  }

  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchState.isActive) return
    if (e.touches.length >= 2) return
    touchState.scale = Math.max(opts.minScale, Math.min(opts.maxScale, touchState.scale))
    touchState.translateX = 0
    touchState.translateY = 0
    const wasActive = resetState()
    if (wasActive && opts.hapticFeedback) triggerHaptic("light")
    callbacks.onZoomEnd?.(getState())
  }

  const handleTouchCancel = () => {
    if (!touchState.isActive) return
    touchState.scale = Math.max(opts.minScale, Math.min(opts.maxScale, touchState.scale))
    const wasActive = resetState()
    if (wasActive) callbacks.onZoomCancel?.(getState())
  }

  onMounted(() => {
    const el = targetRef.value
    if (!el) return
    el.addEventListener("touchstart", handleTouchStart, { passive: false })
    el.addEventListener("touchmove", handleTouchMove, { passive: false })
    el.addEventListener("touchend", handleTouchEnd, { passive: false })
    el.addEventListener("touchcancel", handleTouchCancel, { passive: false })
  })

  onUnmounted(() => {
    const el = targetRef.value
    if (!el) return
    el.removeEventListener("touchstart", handleTouchStart)
    el.removeEventListener("touchmove", handleTouchMove)
    el.removeEventListener("touchend", handleTouchEnd)
    el.removeEventListener("touchcancel", handleTouchCancel)
    // 确保卸载时清理状态
    resetState()
  })

  return {
    isActive: computed(() => touchState.isActive),
    scale: computed(() => touchState.scale),
    state: computed(() => getState()),
    reset: () => { touchState.scale = 1; touchState.translateX = 0; touchState.translateY = 0; invalidateCache() },
  }
}
