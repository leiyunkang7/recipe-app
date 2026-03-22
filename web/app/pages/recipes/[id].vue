<script setup lang="ts">
const { t, locale } = useI18n()

const {
  recipe,
  loading,
  error,
  isMobile,
  selectedIngredients,
  isFavorite,
  currentStep,
  expandedSteps,
  pageTitle,
  metaDescription,
  seoKeywords,
  totalTime,
  nutritionInfo,
  difficultyColor,
  difficultyLabel,
  toggleIngredient,
  toggleFavorite,
  toggleStepExpand,
  init,
  cleanup,
} = useRecipeDetail()

const { downloadPoster, isGenerating: isGeneratingPoster } = useSharePoster()

const config = useRuntimeConfig()
const baseUrl = config.public.supabaseUrl?.replace('/rest/v1', '') || 'https://your-project.supabase.co'

const handleShare = async () => {
  if (!recipe.value) return
  try {
    await downloadPoster(recipe.value)
  } catch (e) {
    console.error('生成分享海报失败:', e)
  }
}

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
  ogUrl: () => {
    const prefix = locale.value === 'zh-CN' ? '' : `/${locale.value}`
    return `${baseUrl}${prefix}/recipes/${recipe.value?.id}`
  },
  articlePublishedTime: () => recipe.value?.createdAt || undefined,
  articleAuthor: () => ['食谱大全'],
  articleSection: () => recipe.value?.category || undefined,
  twitterCard: 'summary_large_image',
  twitterTitle: () => pageTitle.value,
  twitterDescription: () => metaDescription.value,
  twitterImage: () => recipe.value?.imageUrl || '/icon.png',
})

// Canonical URL for better SEO
useHead({
  link: [
    {
      rel: 'canonical',
      href: () => {
        const prefix = locale.value === 'zh-CN' ? '' : `/${locale.value}`
        return `${baseUrl}${prefix}/recipes/${recipe.value?.id}`
      }
    }
  ]
})

// Additional Open Graph article tags
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

onMounted(() => {
  init()
})

onUnmounted(() => {
  cleanup()
})
</script>

<template>
  <div class="min-h-screen bg-stone-50 dark:bg-stone-900 pb-20 lg:pb-8 transition-colors duration-300">
    <RecipeDetailHeader
      :is-favorite="isFavorite"
      :recipe="recipe"
      @toggle-favorite="toggleFavorite"
      @share="handleShare"
    />

    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>

    <div v-else-if="error" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p class="text-red-800 dark:text-red-300">{{ error }}</p>
      </div>
    </div>

    <div v-else-if="recipe">
      <div class="lg:hidden">
        <RecipeDetailHero :recipe="recipe" />
        <RecipeDetailTitleCard
          :recipe="recipe"
          :total-time="totalTime"
          :difficulty-color="difficultyColor"
          :difficulty-label="difficultyLabel"
          @share="handleShare"
        />

        <div class="px-4 mt-4">
          <RecipeDetailIngredients
            :recipe="recipe"
            :selected-ingredients="selectedIngredients"
            :is-mobile="true"
            @toggle-ingredient="toggleIngredient"
          />
        </div>

        <div class="px-4 mt-4 mb-6">
          <RecipeDetailSteps
            :recipe="recipe"
            :current-step="currentStep"
            :is-mobile="true"
            :expanded-steps="expandedSteps"
            @update:current-step="currentStep = $event"
            @toggle-expand="toggleStepExpand"
          />
        </div>

        <div v-if="recipe.tags && recipe.tags.length > 0" class="px-4 pb-6">
          <RecipeDetailTags :tags="recipe.tags" :is-mobile="true" />
        </div>
      </div>

      <div class="hidden lg:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-2 space-y-8">
            <RecipeDetailHero :recipe="recipe" />
            <RecipeDetailTitleSection
              :recipe="recipe"
              :total-time="totalTime"
              :nutrition-info="nutritionInfo"
              :difficulty-color="difficultyColor"
              :difficulty-label="difficultyLabel"
              :is-favorite="isFavorite"
              @toggle-favorite="toggleFavorite"
            />

            <RecipeDetailIngredients
              :recipe="recipe"
              :selected-ingredients="selectedIngredients"
              :is-mobile="false"
              @toggle-ingredient="toggleIngredient"
            />

            <RecipeDetailSteps
              :recipe="recipe"
              :current-step="currentStep"
              :is-mobile="false"
              :expanded-steps="expandedSteps"
              @update:current-step="currentStep = $event"
              @toggle-expand="toggleStepExpand"
            />

            <RecipeDetailTags v-if="recipe.tags && recipe.tags.length > 0" :tags="recipe.tags" :is-mobile="false" />
          </div>

          <RecipeDetailSidebar :recipe="recipe" @share="handleShare" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
html {
  scroll-behavior: smooth;
}

@media (hover: none) {
  .touch-manipulation {
    touch-action: manipulation;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
