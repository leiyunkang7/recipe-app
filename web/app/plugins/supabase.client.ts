import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client plugin
 * Provides the Supabase client for the notification service and other components
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Get Supabase URL and key from runtime config
  const supabaseUrl = config.public.supabaseUrl as string
  const supabaseKey = config.public.supabaseAnonKey as string

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Supabase] URL or Anon Key not configured - notifications will use WebSocket only')
    return
  }

  // Create Supabase client with realtime enabled
  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      // Enable realtime for notifications table
      params: {
        eventsPerSecond: 10,
      },
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
    $supabase: SupabaseClient
  }
}
