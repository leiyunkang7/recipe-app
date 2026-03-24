import type { Recipe, RecipeFilters, CreateRecipeDTO, Locale } from '~/types'
import { mapRecipeData } from '~/utils/recipeMapper'

const PAGE_SIZE = 20

export const useRecipes = () => {
  const { $supabase } = useNuxtApp()
  const { locale } = useI18n()
  const recipes = ref<Recipe[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)
  const currentPage = ref(0)

  const currentLocale = computed(() => locale.value as Locale)

  const fetchRecipes = async (filters?: RecipeFilters, append = false) => {
    if (!append) {
      loading.value = true
      currentPage.value = 0
      hasMore.value = true
    } else {
      loadingMore.value = true
    }
    error.value = null

    try {
      const loc = filters?.locale || currentLocale.value
      const from = append ? (currentPage.value + 1) * PAGE_SIZE : 0
      const to = from + PAGE_SIZE - 1

      // Build the base query - only use tables that exist in the database
      // Note: recipe_translations table does not exist, so we use recipe's default title
      let query = $supabase
        .from('recipes')
        .select(`
          *,
          ingredients:recipe_ingredients(
            id,
            name,
            amount,
            unit
          ),
          steps:recipe_steps(
            id,
            step_number,
            instruction,
            duration_minutes
          ),
          tags:recipe_tags(
            tag
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (filters?.category) {
        query = query.eq('category', filters.category)
      }

      if (filters?.cuisine) {
        query = query.eq('cuisine', filters.cuisine)
      }

      if (filters?.difficulty) {
        query = query.eq('difficulty', filters.difficulty)
      }

      if (filters?.search) {
        // Search in the recipe title column (which stores the default/translated title)
        query = query.ilike('title', `%${filters.search}%`)
      }

      const { data, error: err, count } = await query

      if (err) throw err

      // Show all recipes - use recipe's default title since recipe_translations table doesn't exist
      let filteredData = (data || []).map((recipe: any) => recipe)

      const mappedData = filteredData.map((recipe: any) => mapRecipeData(recipe, loc)) as Recipe[]

      if (append) {
        recipes.value = [...recipes.value, ...mappedData]
      } else {
        recipes.value = mappedData
      }

      // Check if there are more items to load
      if (count !== null) {
        hasMore.value = recipes.value.length < count
      } else {
        hasMore.value = mappedData.length === PAGE_SIZE
      }

      if (hasMore.value) {
        currentPage.value = append ? currentPage.value + 1 : 0
      }
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching recipes:', err)
    } finally {
      loading.value = false
      loadingMore.value = false
    }

    return recipes.value
  }

  const fetchRecipeById = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const loc = currentLocale.value

      // Use optional join - note recipe_translations table doesn't exist
      // so we use recipe's default title
      const { data, error: err } = await $supabase
        .from('recipes')
        .select(`
          *,
          ingredients:recipe_ingredients(
            id,
            name,
            amount,
            unit
          ),
          steps:recipe_steps(
            id,
            step_number,
            instruction,
            duration_minutes
          ),
          tags:recipe_tags(
            tag
          )
        `)
        .eq('id', id)
        .single()

      if (err) {
        if (err.code === 'PGRST116') {
          error.value = 'Recipe not found'
        } else {
          throw err
        }
        return null
      }

      // Prefer current locale translations, fallback to zh-CN
      return mapRecipeData(data, loc)
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching recipe:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const createRecipe = async (recipeData: CreateRecipeDTO) => {
    loading.value = true
    error.value = null

    try {
      const { data: recipe, error: recipeError } = await $supabase
        .from('recipes')
        .insert({
          category: recipeData.category,
          cuisine: recipeData.cuisine,
          servings: recipeData.servings,
          prep_time_minutes: recipeData.prepTimeMinutes,
          cook_time_minutes: recipeData.cookTimeMinutes,
          difficulty: recipeData.difficulty,
          image_url: recipeData.imageUrl,
          source: recipeData.source,
          nutrition_info: recipeData.nutritionInfo,
        })
        .select()
        .single()

      if (recipeError) throw recipeError

      const recipeId = recipe.id

      if (recipeData.translations && recipeData.translations.length > 0) {
        const translations = recipeData.translations.map((t: { locale: Locale; title: string; description?: string }) => ({
          recipe_id: recipeId,
          locale: t.locale,
          title: t.title,
          description: t.description,
        }))

        const { error: transError } = await $supabase
          .from('recipe_translations')
          .insert(translations)

        if (transError) throw transError
      } else {
        const { error: transError } = await $supabase
          .from('recipe_translations')
          .insert({
            recipe_id: recipeId,
            locale: 'en',
            title: recipeData.title,
            description: recipeData.description,
          })

        if (transError) throw transError
      }

      if (recipeData.ingredients.length > 0) {
        // Batch insert all ingredients at once
        const ingredientInserts = recipeData.ingredients.map((ing) => ({
          recipe_id: recipeId,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
        }))

        const { data: insertedIngredients, error: ingError } = await $supabase
          .from('recipe_ingredients')
          .insert(ingredientInserts)
          .select()

        if (ingError) throw ingError

        // Batch insert all ingredient translations
        const allIngTranslations: Array<{ ingredient_id: string; locale: Locale; name: string }> = []
        for (let i = 0; i < recipeData.ingredients.length; i++) {
          const ing = recipeData.ingredients[i]
          const insertedIng = insertedIngredients?.[i]
          if (insertedIng && ing.translations && ing.translations.length > 0) {
            for (const t of ing.translations) {
              allIngTranslations.push({
                ingredient_id: insertedIng.id,
                locale: t.locale,
                name: t.name,
              })
            }
          }
        }

        if (allIngTranslations.length > 0) {
          const { error: ingTransError } = await $supabase
            .from('ingredient_translations')
            .insert(allIngTranslations)
          if (ingTransError) throw ingTransError
        }
      }

      if (recipeData.steps.length > 0) {
        // Batch insert all steps at once
        const stepInserts = recipeData.steps.map((step) => ({
          recipe_id: recipeId,
          step_number: step.stepNumber,
          instruction: step.instruction,
          duration_minutes: step.durationMinutes,
        }))

        const { data: insertedSteps, error: stepError } = await $supabase
          .from('recipe_steps')
          .insert(stepInserts)
          .select()

        if (stepError) throw stepError

        // Batch insert all step translations
        const allStepTranslations: Array<{ step_id: string; locale: Locale; instruction: string }> = []
        for (let i = 0; i < recipeData.steps.length; i++) {
          const step = recipeData.steps[i]
          const insertedStep = insertedSteps?.[i]
          if (insertedStep && step.translations && step.translations.length > 0) {
            for (const t of step.translations) {
              allStepTranslations.push({
                step_id: insertedStep.id,
                locale: t.locale,
                instruction: t.instruction,
              })
            }
          }
        }

        if (allStepTranslations.length > 0) {
          const { error: stepTransError } = await $supabase
            .from('step_translations')
            .insert(allStepTranslations)
          if (stepTransError) throw stepTransError
        }
      }

      if (recipeData.tags && recipeData.tags.length > 0) {
        const tags = recipeData.tags.map((tag: string) => ({
          recipe_id: recipeId,
          tag,
        }))

        const { error: tagsError } = await $supabase
          .from('recipe_tags')
          .insert(tags)

        if (tagsError) throw tagsError
      }

      return recipe as Recipe
    } catch (err: any) {
      error.value = err.message
      console.error('Error creating recipe:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const updateRecipe = async (id: string, recipeData: Partial<CreateRecipeDTO>) => {
    loading.value = true
    error.value = null

    try {
      const { data: recipe, error: recipeError } = await $supabase
        .from('recipes')
        .update({
          category: recipeData.category,
          cuisine: recipeData.cuisine,
          servings: recipeData.servings,
          prep_time_minutes: recipeData.prepTimeMinutes,
          cook_time_minutes: recipeData.cookTimeMinutes,
          difficulty: recipeData.difficulty,
          image_url: recipeData.imageUrl,
          source: recipeData.source,
          nutrition_info: recipeData.nutritionInfo,
        })
        .eq('id', id)
        .select()
        .single()

      if (recipeError) throw recipeError

      if (recipeData.translations) {
        await $supabase.from('recipe_translations').delete().eq('recipe_id', id)

        // Batch insert translations
        const translationInserts = recipeData.translations.map((t) => ({
          recipe_id: id,
          locale: t.locale,
          title: t.title,
          description: t.description,
        }))
        const { error: transError } = await $supabase
          .from('recipe_translations')
          .insert(translationInserts)
        if (transError) throw transError
      }

      // Delete old related records
      const { data: oldIngredients } = await $supabase
        .from('recipe_ingredients')
        .select('id')
        .eq('recipe_id', id)

      const { data: oldSteps } = await $supabase
        .from('recipe_steps')
        .select('id')
        .eq('recipe_id', id)

      // Batch delete old translations
      const ingredientIds = oldIngredients?.map((i) => i.id) || []
      const stepIds = oldSteps?.map((s) => s.id) || []

      if (ingredientIds.length > 0) {
        await $supabase.from('ingredient_translations').delete().in('ingredient_id', ingredientIds)
      }
      if (stepIds.length > 0) {
        await $supabase.from('step_translations').delete().in('step_id', stepIds)
      }

      await $supabase.from('recipe_ingredients').delete().eq('recipe_id', id)
      await $supabase.from('recipe_steps').delete().eq('recipe_id', id)
      await $supabase.from('recipe_tags').delete().eq('recipe_id', id)

      if (recipeData.ingredients && recipeData.ingredients.length > 0) {
        // Batch insert all ingredients at once
        const ingredientInserts = recipeData.ingredients.map((ing) => ({
          recipe_id: id,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
        }))

        const { data: insertedIngredients, error: ingError } = await $supabase
          .from('recipe_ingredients')
          .insert(ingredientInserts)
          .select()

        if (ingError) throw ingError

        // Batch insert all ingredient translations
        const allIngTranslations: Array<{ ingredient_id: string; locale: Locale; name: string }> = []
        for (let i = 0; i < recipeData.ingredients.length; i++) {
          const ing = recipeData.ingredients[i]
          const insertedIng = insertedIngredients?.[i]
          if (insertedIng && ing.translations && ing.translations.length > 0) {
            for (const t of ing.translations) {
              allIngTranslations.push({
                ingredient_id: insertedIng.id,
                locale: t.locale,
                name: t.name,
              })
            }
          }
        }

        if (allIngTranslations.length > 0) {
          const { error: ingTransError } = await $supabase
            .from('ingredient_translations')
            .insert(allIngTranslations)
          if (ingTransError) throw ingTransError
        }
      }

      if (recipeData.steps && recipeData.steps.length > 0) {
        // Batch insert all steps at once
        const stepInserts = recipeData.steps.map((step) => ({
          recipe_id: id,
          step_number: step.stepNumber,
          instruction: step.instruction,
          duration_minutes: step.durationMinutes,
        }))

        const { data: insertedSteps, error: stepError } = await $supabase
          .from('recipe_steps')
          .insert(stepInserts)
          .select()

        if (stepError) throw stepError

        // Batch insert all step translations
        const allStepTranslations: Array<{ step_id: string; locale: Locale; instruction: string }> = []
        for (let i = 0; i < recipeData.steps.length; i++) {
          const step = recipeData.steps[i]
          const insertedStep = insertedSteps?.[i]
          if (insertedStep && step.translations && step.translations.length > 0) {
            for (const t of step.translations) {
              allStepTranslations.push({
                step_id: insertedStep.id,
                locale: t.locale,
                instruction: t.instruction,
              })
            }
          }
        }

        if (allStepTranslations.length > 0) {
          const { error: stepTransError } = await $supabase
            .from('step_translations')
            .insert(allStepTranslations)
          if (stepTransError) throw stepTransError
        }
      }

      if (recipeData.tags && recipeData.tags.length > 0) {
        await $supabase
          .from('recipe_tags')
          .insert(
            recipeData.tags.map((tag: string) => ({
              recipe_id: id,
              tag,
            }))
          )
      }

      return recipe as Recipe
    } catch (err: any) {
      error.value = err.message
      console.error('Error updating recipe:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  const deleteRecipe = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const { error: err } = await $supabase
        .from('recipes')
        .delete()
        .eq('id', id)

      if (err) throw err

      return true
    } catch (err: any) {
      error.value = err.message
      console.error('Error deleting recipe:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Increment views count for a recipe
  const incrementViews = async (id: string) => {
    try {
      const { error } = await $supabase.rpc('increment_views', { recipe_id: id })
      if (error) {
        // Fallback to direct update if RPC doesn't exist
        const { data } = await $supabase
          .from('recipes')
          .select('views')
          .eq('id', id)
          .single()

        if (data) {
          await $supabase
            .from('recipes')
            .update({ views: (data.views || 0) + 1 })
            .eq('id', id)
        }
      }
    } catch (err) {
      console.error('Error incrementing views:', err)
    }
  }

  const fetchCategoryKeys = async (): Promise<Array<{ id: number; name: string; displayName: string }>> => {
    try {
      // Get unique categories from recipes table directly
      // The category names are stored directly in recipes.category (Chinese)
      const { data, error } = await $supabase
        .from('recipes')
        .select('category')
        .not('category', 'is', null)

      if (error) throw error

      // Get unique category names
      const categoryNames = [...new Set((data || []).map((r: any) => r.category).filter(Boolean))]

      const result: Array<{ id: number; name: string; displayName: string }> = categoryNames.map((name, index) => ({
        id: index + 1,
        name: name,
        displayName: name, // Use the name directly since it's already in the user's locale
      }))

      return result
    } catch (err: any) {
      console.error('Error fetching category keys:', err)
      return []
    }
  }

  const fetchCuisineKeys = async (): Promise<Array<{ id: number; name: string; displayName: string }>> => {
    try {
      // Get unique cuisines from recipes table directly
      // The cuisine names are stored directly in recipes.cuisine (Chinese)
      const { data, error } = await $supabase
        .from('recipes')
        .select('cuisine')
        .not('cuisine', 'is', null)

      if (error) throw error

      // Get unique cuisine names and remove duplicates
      const cuisineNames = [...new Set((data || []).map((r: any) => r.cuisine).filter(Boolean))]

      const result: Array<{ id: number; name: string; displayName: string }> = cuisineNames.map((name, index) => ({
        id: index + 1,
        name: name,
        displayName: name, // Use the name directly since it's already in the user's locale
      }))

      return result
    } catch (err: any) {
      console.error('Error fetching cuisine keys:', err)
      return []
    }
  }

  return {
    recipes,
    loading,
    loadingMore,
    error,
    hasMore,
    fetchRecipes,
    fetchRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    fetchCategoryKeys,
    fetchCuisineKeys,
    incrementViews,
    currentLocale,
  }
}
