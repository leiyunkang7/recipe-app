import { createClient } from '@supabase/supabase-js'

/**
 * Supabase client plugin
 * Provides the Supabase client for the notification service and other components
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Get Supabase URL and key from runtime config
  const supabaseUrl = config.public.supabaseUrl
  const supabaseKey = config.public.supabaseAnonKey

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Supabase] URL or Anon Key not configured')
    return
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  // Provide globally
  return {
    provide: {
      supabase,
    },
  }
})

// Type augmentation for Nuxt plugin
declare module '#app' {
  interface NuxtApp {
    $supabase: ReturnType<typeof createClient>
  }
}
