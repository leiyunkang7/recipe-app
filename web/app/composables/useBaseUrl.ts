/**
 * useBaseUrl - Returns the application base URL
 * Used for sitemap and absolute URL generation
 */
export const useBaseUrl = () => {
  const config = useRuntimeConfig()
  return config.public.siteUrl || 'http://localhost:3000'
}
