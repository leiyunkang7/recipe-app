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

  // Setup SEO meta tags
  useSeoMeta({
    title: () => pageTitle.value,
    description: () => metaDescription.value,
    keywords: () => seoKeywords.value,
    ogTitle: () => pageTitle.value,
    ogDescription: () => metaDescription.value,
    ogType: 'article',
    ogImage: () => recipe.value?.imageUrl || '/icon.png',
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogUrl: () => ogUrl.value,
    articlePublishedTime: () => recipe.value?.createdAt || undefined,
    articleAuthor: () => ['食谱大全'],
    articleSection: () => recipe.value?.category || undefined,
    twitterCard: 'summary_large_image',
    twitterTitle: () => pageTitle.value,
    twitterDescription: () => metaDescription.value,
    twitterImage: () => recipe.value?.imageUrl || '/icon.png',
  })

  // Canonical URL
  useHead({
    link: [
      {
        rel: 'canonical',
        href: () => ogUrl.value
      }
    ]
  })

  // JSON-LD structured data
  useHead({
    script: [
      {
        type: 'application/ld+json',
        children: computed(() => {
          if (!recipe.value) return ''
          return JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Recipe',
            name: recipe.value.title,
            description: recipe.value.description,
            image: recipe.value.imageUrl,
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
            datePublished: recipe.value.createdAt,
            dateModified: recipe.value.updatedAt,
          })
        })
      }
    ]
  })

  return {
    pageTitle,
    metaDescription,
    seoKeywords,
  }
}