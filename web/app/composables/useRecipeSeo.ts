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
    const prefix = locale.value === 'zh-CN' ? '' : `/${locale.value}`
    return `${baseUrl}${prefix}/recipes/${recipe.value?.id}`
  })

  const jsonLd = computed(() => {
    if (!recipe.value) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      name: recipe.value.title,
      description: recipe.value.description,
      image: recipe.value.imageUrl,
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
        text: typeof step === 'string' ? step : step.description || ''
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
    }
  })

  // Setup SEO meta tags and structured data in a single useHead call
  useHead(() => ({
    title: pageTitle.value,
    link: [
      {
        rel: 'canonical',
        href: ogUrl.value
      },
      { rel: 'alternate', hreflang: 'zh-CN', href: ogUrl.value },
      { rel: 'alternate', hreflang: 'en', href: locale.value === 'zh-CN' ? `${baseUrl}/en/recipes/${recipe.value?.id}` : ogUrl.value },
      { rel: 'alternate', hreflang: 'x-default', href: ogUrl.value }
    ],
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify(jsonLd.value)
      }
    ]
  }))

  // Setup SEO meta tags with useSeoMeta for proper og: tags
  useSeoMeta({
    title: pageTitle,
    description: metaDescription,
    keywords: seoKeywords,
    ogTitle: pageTitle,
    ogDescription: metaDescription,
    ogType: 'article',
    ogImage: () => recipe.value?.imageUrl || '/icon.png',
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: () => recipe.value?.title ? `${recipe.value.title} 图片` : '食谱图片',
    ogUrl: ogUrl,
    ogSiteName: '食谱大全',
    articlePublishedTime: () => (recipe.value as any)?.created_at || recipe.value?.createdAt,
    articleAuthor: '食谱大全',
    articleSection: () => recipe.value?.category,
    twitterCard: 'summary_large_image',
    twitterTitle: pageTitle,
    twitterDescription: metaDescription,
    twitterImage: () => recipe.value?.imageUrl || '/icon.png',
    twitterImageAlt: () => recipe.value?.title ? `${recipe.value.title} 图片` : '食谱图片',
  })

  return {
    pageTitle,
    metaDescription,
    seoKeywords,
  }
}