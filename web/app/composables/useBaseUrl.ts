/**
 * Shared utility for getting the base URL from Supabase config
 * DRY principle - avoid duplicating this logic across multiple files
 */
export const useBaseUrl = () => {
  const config = useRuntimeConfig()
  return config.public.supabaseUrl?.replace('/rest/v1', '') || 'https://your-project.supabase.co'
}
