import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client plugin (client-only)
 * Enhanced client configuration for browser/SSR hydration
 * NOTE: We do not provide $supabase here because supabase.ts already provides it.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const supabaseUrl = config.public.supabaseUrl as string
  const supabaseKey = config.public.supabaseAnonKey as string

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Supabase] URL or Anon Key not configured')
    return
  }

  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })

  return {
    provide: {
      supabaseClient: supabase,
    },
  }
})

declare module '#app' {
  interface NuxtApp {
    $supabaseClient: SupabaseClient
  }
}
