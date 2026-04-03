import { createClient } from '@supabase/supabase-js'
// Use Nuxt auto-imports instead

export default defineSitemapEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const baseUrl = config.public.supabaseUrl?.replace('/rest/v1', '') || 'https://your-project.supabase.co'
  const serviceKey = process.env.SUPABASE_SERVICE_KEY

  // Return empty sitemap if service key is not configured
  if (!serviceKey || !config.public.supabaseUrl) {
    console.warn('Sitemap: Missing SUPABASE_SERVICE_KEY or SUPABASE_URL')
    return []
  }

  const supabase = createClient(
    config.public.supabaseUrl,
    serviceKey
  )

  const { data: recipes, error } = await supabase
    .from('recipes')
    .select('id, title, updated_at, image_url')
    .limit(5000)

  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')
    .limit(100)

  const { data: cuisines } = await supabase
    .from('cuisines')
    .select('slug, updated_at')
    .limit(100)

  if (error) {
    console.error('Sitemap error:', error)
    return []
  }

  // Helper to ensure image URL is absolute
  const getAbsoluteImageUrl = (imageUrl: string | null): string | undefined => {
    if (!imageUrl) return undefined
    if (imageUrl.startsWith('http')) return imageUrl
    return `${baseUrl}${imageUrl}`
  }

  const today = new Date().toISOString().split('T')[0]

  // Static pages with i18n support
  const staticPages = [
    {
      loc: baseUrl,
      lastmod: today,
      priority: 1.0,
      changefreq: 'daily' as const,
      alternatives: [
        { hreflang: 'zh-CN', href: baseUrl },
        { hreflang: 'en', href: `${baseUrl}/en` }
      ]
    },
    {
      loc: `${baseUrl}/favorites`,
      lastmod: today,
      priority: 0.6,
      changefreq: 'weekly' as const,
      alternatives: [
        { hreflang: 'zh-CN', href: `${baseUrl}/favorites` },
        { hreflang: 'en', href: `${baseUrl}/en/favorites` }
      ]
    }
  ]

  // Category pages
  const categoryUrls = (categories || []).map((cat) => {
    const lastmod = cat.updated_at?.split('T')[0] || today
    const zhUrl = `${baseUrl}/categories/${cat.slug}`
    const enUrl = `${baseUrl}/en/categories/${cat.slug}`
    return {
      loc: zhUrl,
      lastmod,
      priority: 0.7,
      changefreq: 'weekly' as const,
      alternatives: [
        { hreflang: 'zh-CN', href: zhUrl },
        { hreflang: 'en', href: enUrl }
      ]
    }
  })

  // Cuisine pages
  const cuisineUrls = (cuisines || []).map((cuisine) => {
    const lastmod = cuisine.updated_at?.split('T')[0] || today
    const zhUrl = `${baseUrl}/cuisines/${cuisine.slug}`
    const enUrl = `${baseUrl}/en/cuisines/${cuisine.slug}`
    return {
      loc: zhUrl,
      lastmod,
      priority: 0.7,
      changefreq: 'weekly' as const,
      alternatives: [
        { hreflang: 'zh-CN', href: zhUrl },
        { hreflang: 'en', href: enUrl }
      ]
    }
  })

  // Generate localized recipe URLs with enhanced metadata
  const recipeUrls = (recipes || []).map((recipe) => {
    const lastmod = recipe.updated_at?.split('T')[0] || today
    const defaultUrl = `${baseUrl}/recipes/${recipe.id}`
    const englishUrl = `${baseUrl}/en/recipes/${recipe.id}`
    const imageUrl = recipe.image_url ? getAbsoluteImageUrl(recipe.image_url) : undefined

    return {
      loc: defaultUrl,
      lastmod,
      priority: 0.8,
      changefreq: 'weekly' as const,
      alternatives: [
        { hreflang: 'zh-CN', href: defaultUrl },
        { hreflang: 'en', href: englishUrl }
      ],
      images: imageUrl
        ? [{
            loc: imageUrl,
            caption: recipe.title,
            title: recipe.title,
            geoLocation: undefined,
            license: undefined
          }]
        : []
    }
  })

  return [...staticPages, ...categoryUrls, ...cuisineUrls, ...recipeUrls]
})
