export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.supabaseUrl?.replace('/rest/v1', '') || 'https://your-project.supabase.co'

  const robotsTxt = `
User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
  `.trim()

  setHeader(event, 'Content-Type', 'text/plain')
  return robotsTxt
})