/**
 * useIntersectionObserver - IntersectionObserver 组合式函数
 *
 * 功能：
 * - 检测元素是否进入视口
 * - 支持自定义 rootMargin 和 threshold
 * - 自动清理 observer
 * - 一次性观察模式（触发后自动 disconnect）
 *
 * 使用方式：
 * const { observe, unobserve } = useIntersectionObserver((entry) => {
 *   if (entry.isIntersecting) {
 *     // 元素进入视口
 *   }
 * }, { threshold: 0.1, rootMargin: '100px' })
 *
 * observe(elementRef.value)
 */
import { type IntersectionObserverInit } from '~/types'

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  /** 触发后是否自动断开观察（一次性模式） */
  once?: boolean
}

export function useIntersectionObserver(
  callback: (entry: IntersectionObserverEntry, observer: IntersectionObserver) => void,
  options: UseIntersectionObserverOptions = {}
) {
  const { once = true, ...observerOptions } = options

  let observer: IntersectionObserver | null = null

  const observe = (el: HTMLElement) => {
    if (!el || typeof IntersectionObserver === 'undefined') return

    // 懒创建 observer
    if (!observer) {
      observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          callback(entry, observer!)

          // 一次性模式：触发后自动断开
          if (once && entry.isIntersecting && observer) {
            observer.unobserve(entry.target)
          }
        })
      }, observerOptions)
    }

    observer.observe(el)
  }

  const unobserve = (el: HTMLElement) => {
    if (observer) {
      observer.unobserve(el)
    }
  }

  const disconnect = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    observe,
    unobserve,
    disconnect,
  }
}
