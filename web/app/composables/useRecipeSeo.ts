import type { Recipe } from '~/types'

export function useRecipeSeo(recipe: Ref<Recipe | null>, totalTime: ComputedRef<number>) {
  const { t, locale } = useI18n()

  const config = useRuntimeConfig()
  const baseUrl = config.public.supabaseUrl?.replace('/rest/v1', '') || 'https://your-project.supabase.co'

  const pageTitle = computed(() =>
    recipe.value ? `${recipe.value.title} - ${t('app.title')}` : t('app.title')
  )

  const metaDescription = computed(() => {
    if (!recipe.value) return t('app.subtitle')
    const parts: string[] = []
    if (recipe.value.category) parts.push(recipe.value.category)
    if (totalTime.value > 0) parts.push(`${totalTime.value}${t('unit.minutes')}`)
    if (recipe.value.difficulty) parts.push(t(`difficulty.${recipe.value.difficulty}`))
    if (recipe.value.servings) parts.push(`${recipe.value.servings}${t('unit.servings')}`)
    return parts.length > 0
      ? `${recipe.value.title} - ${parts.join(' | ')}. ${recipe.value.description || ''}`
      : (recipe.value.description || t('app.subtitle'))
  })

  const seoKeywords = computed(() => {
    if (!recipe.value) return ''
    const keywords = [recipe.value.title, recipe.value.category, recipe.value.cuisine].filter(Boolean)
    if (recipe.value.tags) keywords.push(...recipe.value.tags)
    return keywords.join(', ')
  })

  const ogUrl = computed(() => {
    // With strategy: 'prefix', both zh-CN and en have locale prefixes
    const prefix = `/${locale.value}`
    return `${baseUrl}${prefix}/recipes/${recipe.value?.id}`
  })

  // Ensure ogImage is always an absolute URL
  const ogImageAbsolute = computed(() => {
    const image = recipe.value?.imageUrl
    if (!image) return `${baseUrl}/icon.png`
    if (image.startsWith('http')) return image
    return `${baseUrl}${image}`
  })

  // Ensure image URL is absolute for JSON-LD structured data
  const jsonLdImage = computed(() => {
    const image = recipe.value?.imageUrl
    if (!image) return undefined
    if (image.startsWith('http')) return image
    return `${baseUrl}${image}`
  })

  const jsonLd = computed(() => {
    if (!recipe.value) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      name: recipe.value.title,
      description: recipe.value.description,
      image: jsonLdImage.value,
      author: {
        '@type': 'Organization',
        name: '食谱大全',
        url: baseUrl
      },
      cookTime: `PT${recipe.value.cookTimeMinutes || 0}M`,
      prepTime: `PT${recipe.value.prepTimeMinutes || 0}M`,
      totalTime: `PT${totalTime.value}M`,
      recipeYield: `${recipe.value.servings} ${t('unit.servings')}`,
      recipeCategory: recipe.value.category,
      recipeCuisine: recipe.value.cuisine,
      recipeIngredient: recipe.value.ingredients?.map(i =>
        typeof i === 'string' ? i : `${i.amount || ''} ${i.name || ''}`.trim()
      ) || [],
      recipeInstructions: recipe.value.steps?.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        text: typeof step === 'string' ? step : step.instruction || ''
      })) || [],
      keywords: seoKeywords.value,
      datePublished: (recipe.value as any).created_at || recipe.value.createdAt,
      dateModified: (recipe.value as any).updated_at || recipe.value.updatedAt,
      nutrition: recipe.value.nutritionInfo ? {
        '@type': 'NutritionInformation',
        calories: recipe.value.nutritionInfo.calories ? `${recipe.value.nutritionInfo.calories} calories` : undefined,
        proteinContent: recipe.value.nutritionInfo.protein ? `${recipe.value.nutritionInfo.protein}g` : undefined,
        carbohydrateContent: recipe.value.nutritionInfo.carbs ? `${recipe.value.nutritionInfo.carbs}g` : undefined,
        fatContent: recipe.value.nutritionInfo.fat ? `${recipe.value.nutritionInfo.fat}g` : undefined,
        fiberContent: recipe.value.nutritionInfo.fiber ? `${recipe.value.nutritionInfo.fiber}g` : undefined,
      } : undefined,
      aggregateRating: recipe.value.rating ? {
        '@type': 'AggregateRating',
        ratingValue: recipe.value.rating.toString(),
        ratingCount: (recipe.value.ratingCount || 1).toString(),
        bestRating: '5',
        worstRating: '1'
      } : undefined,
      url: ogUrl.value,
      inLanguage: locale.value === 'en' ? 'en-US' : 'zh-CN',
    }
  })

  // Setup all SEO meta tags, structured data, and canonical links
  // Use watchEffect to ensure reactive updates when recipe.value changes
  watchEffect(() => {
    useSeoMeta({
      title: pageTitle.value,
      description: metaDescription.value,
      keywords: seoKeywords.value,
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      ogType: 'article',
      ogSiteName: '食谱大全',
      ogTitle: pageTitle.value,
      ogDescription: metaDescription.value,
      ogUrl: ogUrl.value,
      ogImage: ogImageAbsolute.value,
      ogImageWidth: 1200,
      ogImageHeight: 630,
      ogImageAlt: recipe.value?.title ? `${recipe.value.title} 图片` : '食谱图片',
      ogLocale: locale.value === 'en' ? 'en_US' : 'zh_CN',
      ogLocaleAlternate: locale.value === 'en' ? 'zh_CN' : 'en_US',
      articlePublishedTime: (recipe.value as any)?.created_at || recipe.value?.createdAt,
      articleModifiedTime: (recipe.value as any)?.updated_at || recipe.value?.updatedAt,
      articleAuthor: '食谱大全',
      articleSection: recipe.value?.category,
      articleTag: recipe.value?.tags?.slice(0, 5),
      twitterCard: 'summary_large_image',
      twitterSite: '@recipeapp',
      twitterTitle: pageTitle.value,
      twitterDescription: metaDescription.value,
      twitterImage: ogImageAbsolute.value,
      twitterImageAlt: recipe.value?.title ? `${recipe.value.title} 图片` : '食谱图片',
    })

    // Additional meta tags for enhanced SEO
    useHead({
      meta: [
        { name: 'author', content: '食谱大全' },
        { name: 'revisit-after', content: '7 days' },
        { property: 'article:publisher', content: 'https://web-mu-woad-35.vercel.app' },
        { property: 'article:section', content: recipe.value?.category || '' },
        ...(recipe.value?.tags?.slice(0, 3).map(tag => ({ property: 'article:tag', content: tag })) || [])
      ]
    })

    // Setup canonical and alternate links, JSON-LD structured data
    const chineseUrl = `${baseUrl}/zh-CN/recipes/${recipe.value?.id}`
    const englishUrl = `${baseUrl}/en/recipes/${recipe.value?.id}`
    const currentUrl = locale.value === 'zh-CN' ? chineseUrl : englishUrl
    useHead({
      link: [
        { rel: 'canonical', href: currentUrl },
        { rel: 'alternate', hreflang: 'zh-CN', href: chineseUrl },
        { rel: 'alternate', hreflang: 'en', href: englishUrl },
        { rel: 'alternate', hreflang: 'x-default', href: currentUrl }
      ],
      script: [
        { type: 'application/ld+json', children: JSON.stringify(jsonLd.value) }
      ]
    })
  })

  return {
    pageTitle,
    metaDescription,
    seoKeywords,
  }
}