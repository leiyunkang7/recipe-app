import { createClient } from '@supabase/supabase-js'
import { createRetryInterceptor } from '~/utils/retry'

export default defineNuxtPlugin(() => {
  // 安装 axios 重试拦截器（3次重试，指数退避）
  createRetryInterceptor()

  const config = useRuntimeConfig()

  const supabase = createClient(
    config.public.supabaseUrl as string,
    config.public.supabaseAnonKey as string
  )

  return {
    provide: {
      supabase
    }
  }
})
