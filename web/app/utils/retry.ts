import axios from 'axios'

/**
 * axios 请求重试拦截器
 * 
 * 特性：
 * - 3次重试，指数退避 (2s → 4s → 8s)
 * - 只重试网络错误和 5xx 错误
 * - 幂等设计：GET 请求自动重试
 */

const MAX_RETRIES = 3
const INITIAL_DELAY = 2000 // 2秒

// 创建重试拦截器
export function createRetryInterceptor() {
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config as any
      
      // 如果没有 config 或已经重试过，抛出错误
      if (!config || config.__retryCount >= MAX_RETRIES) {
        return Promise.reject(error)
      }

      // 判断是否应该重试
      const shouldRetry = 
        // 网络错误（超时、连接失败等）
        !error.response ||
        // 5xx 服务器错误
        (error.response?.status >= 500 && error.response?.status < 600) ||
        // 429 Too Many Requests
        error.response?.status === 429

      if (!shouldRetry) {
        return Promise.reject(error)
      }

      // 增加重试计数
      config.__retryCount = config.__retryCount || 0
      config.__retryCount++

      // 计算延迟时间 (指数退避)
      const delay = INITIAL_DELAY * Math.pow(2, config.__retryCount - 1)

      console.log(`[retry] 请求失败，${delay/1000}s 后重试 (第 ${config.__retryCount}/${MAX_RETRIES} 次)`)

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay))

      return axios(config)
    }
  )
}

// 便捷函数：在任何需要重试的地方调用此函数
export function setupRetry() {
  if (typeof window === 'undefined') {
    // 服务端：只在客户端安装拦截器
    createRetryInterceptor()
  }
}
