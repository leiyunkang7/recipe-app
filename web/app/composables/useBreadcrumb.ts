import type { Recipe, BreadcrumbItem } from '~/types'
import { createBreadcrumbLink, createBreadcrumbCurrent } from '~/types'

export function useBreadcrumb() {
  const { t } = useI18n()

  const generateRecipeBreadcrumb = (recipe: Ref<Recipe | null>): BreadcrumbItem[] => {
    if (!recipe.value) return []

    const items: BreadcrumbItem[] = [
      createBreadcrumbLink(t('breadcrumb.homePage'), '/'),
    ]

    // Add category if available
    if (recipe.value.category) {
      items.push(createBreadcrumbLink(
        recipe.value.category,
        `/?category=${encodeURIComponent(recipe.value.category)}`
      ))
    }

    // Add recipe title as current page (no href)
    items.push(createBreadcrumbCurrent(recipe.value.title))

    return items
  }

  return {
    generateRecipeBreadcrumb,
  }
}
