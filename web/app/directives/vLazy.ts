/**
 * v-lazy 指令 - IntersectionObserver 懒加载指令
 *
 * 使用方式：
 * <img v-lazy="imageUrl" alt="..." />
 *
 * 原理：
 * - 将图片 URL 存储在 data-src 中
 * - 元素进入视口时，将 data-src 复制到 src 开始加载
 * - 一次性观察，触发后自动 disconnect 节省资源
 *
 * 移动端优化：
 * - rootMargin: '50px' 提前 50px 开始加载
 * - 使用 IntersectionObserver 而非滚动监听，省电
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('lazy', {
    mounted(el: HTMLElement, binding) {
      if (typeof IntersectionObserver === 'undefined') {
        // 不支持 IntersectionObserver 的浏览器，直接设置 src
        if (binding.value) {
          el.setAttribute('src', binding.value)
        }
        return
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement
              const src = img.getAttribute('data-src') || binding.value

              if (src) {
                img.setAttribute('src', src)
                img.removeAttribute('data-src')
              }

              // 加载完成后移除占位类
              img.addEventListener('load', () => {
                img.classList.remove('lazy-loading')
                img.classList.add('lazy-loaded')
              }, { once: true })

              img.classList.add('lazy-loading')
              observer.unobserve(img)
            }
          })
        },
        {
          rootMargin: '50px',
          threshold: 0,
        }
      )

      // 存储 observer 引用用于清理
      ;(el as HTMLElement & { _lazyObserver?: IntersectionObserver })._lazyObserver = observer

      // 如果已有 data-src 或 value，立即开始观察
      if (binding.value) {
        el.setAttribute('data-src', binding.value)
        if (!el.getAttribute('src')) {
          el.classList.add('lazy-loading')
        }
      }

      observer.observe(el)
    },

    updated(el: HTMLElement, binding) {
      // 当绑定值变化时，更新 data-src
      if (binding.value !== binding.oldValue && binding.value) {
        el.setAttribute('data-src', binding.value)
        el.classList.add('lazy-loading')
        el.classList.remove('lazy-loaded')
      }
    },

    unmounted(el: HTMLElement & { _lazyObserver?: IntersectionObserver }) {
      if (el._lazyObserver) {
        el._lazyObserver.disconnect()
        delete el._lazyObserver
      }
    },
  })
})
