export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.siteUrl || 'http://localhost:3000'

  const robotsTxt = `
User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
  `.trim()

  setHeader(event, 'Content-Type', 'text/plain')
  return robotsTxt
})