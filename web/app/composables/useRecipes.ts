import type { Recipe, CreateRecipeDTO } from '~/types'

export const useRecipes = () => {
  const queries = useRecipeQueries()
  const mutations = useRecipeMutations()

  return {
    // State
    recipes: queries.recipes,
    recipesList: queries.recipesList,
    loading: queries.loading,
    loadingMore: queries.loadingMore,
    error: queries.error,
    hasMore: queries.hasMore,
    currentLocale: queries.currentLocale,

    // Queries
    fetchRecipes: queries.fetchRecipes,
    fetchRecipesList: queries.fetchRecipesList,
    fetchRecipeById: queries.fetchRecipeById,
    fetchCategoryKeys: queries.fetchCategoryKeys,
    fetchCuisineKeys: queries.fetchCuisineKeys,
    incrementViews: queries.incrementViews,

    // Mutations
    createRecipe: mutations.createRecipe,
    updateRecipe: mutations.updateRecipe,
    deleteRecipe: mutations.deleteRecipe,
  }
}
