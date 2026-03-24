/**
 * useEnterAnimation - 入场动画 composable
 *
 * 特性：
 * - 提供统一的入场动画状态管理
 * - 使用 requestAnimationFrame 优化性能
 * - 可配置的动画延迟
 * - 自动清理 timeout
 */

interface UseEnterAnimationOptions {
  /** 动画延迟时间（毫秒） */
  delay?: number
  /** 是否立即开始动画 */
  immediate?: boolean
}

export function useEnterAnimation(options: UseEnterAnimationOptions = {}) {
  const { delay = 50, immediate = false } = options

  const isEntered = ref(false)
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  const startAnimation = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }

    if (immediate) {
      isEntered.value = true
      return
    }

    timeoutId = setTimeout(() => {
      isEntered.value = true
    }, delay)
  }

  const resetAnimation = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    isEntered.value = false
  }

  onMounted(() => {
    startAnimation()
  })

  onUnmounted(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  })

  return {
    isEntered,
    startAnimation,
    resetAnimation,
  }
}
