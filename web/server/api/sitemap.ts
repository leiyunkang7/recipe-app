import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.supabaseUrl?.replace('/rest/v1', '') || 'https://your-project.supabase.co'

  const supabase = createClient(
    config.public.supabaseUrl!,
    process.env.SUPABASE_SERVICE_KEY || ''
  )

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, updated_at')
    .limit(5000)

  if (error) {
    console.error('Sitemap error:', error)
    return []
  }

  // Static pages with i18n support
  const staticPages = [
    // Default locale (zh-CN)
    { loc: baseUrl, lastmod: new Date().toISOString(), priority: 1.0, changefreq: 'daily' as const },
    // English locale
    { loc: `${baseUrl}/en`, lastmod: new Date().toISOString(), priority: 1.0, changefreq: 'daily' as const },
  ]

  // Generate localized recipe URLs
  const recipeUrls: Array<{
    loc: string
    lastmod: string
    changefreq: 'weekly'
    priority: number
    'xhtml:link'?: Array<{
      rel: string
      hreflang: string
      href: string
    }>
  }> = []

  for (const recipe of recipes || []) {
    const lastmod = recipe.updated_at || new Date().toISOString()
    
    // Default locale URL (zh-CN)
    const defaultUrl = `${baseUrl}/recipes/${recipe.id}`
    // English locale URL
    const englishUrl = `${baseUrl}/en/recipes/${recipe.id}`

    // Add hreflang links for each recipe to help search engines understand i18n
    recipeUrls.push({
      loc: defaultUrl,
      lastmod,
      changefreq: 'weekly',
      priority: 0.8,
      'xhtml:link': [
        { rel: 'alternate', hreflang: 'zh-CN', href: defaultUrl },
        { rel: 'alternate', hreflang: 'en', href: englishUrl },
        { rel: 'alternate', hreflang: 'x-default', href: defaultUrl }
      ]
    })

    // Also add English version as separate entry
    recipeUrls.push({
      loc: englishUrl,
      lastmod,
      changefreq: 'weekly',
      priority: 0.8,
      'xhtml:link': [
        { rel: 'alternate', hreflang: 'zh-CN', href: defaultUrl },
        { rel: 'alternate', hreflang: 'en', href: englishUrl },
        { rel: 'alternate', hreflang: 'x-default', href: defaultUrl }
      ]
    })
  }

  return [...staticPages, ...recipeUrls]
})
