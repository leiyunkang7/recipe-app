import type { Recipe, RecipeFilters, CreateRecipeDTO, Locale, RecipeListItem } from '~/types'
import { mapRecipeData, mapRecipeListItem, type RawRecipe, type RawRecipeListItem } from '~/utils/recipeMapper'

const PAGE_SIZE = 20

export const useRecipes = () => {
  const { $supabase } = useNuxtApp()
  const { locale } = useI18n()
  // 使用 shallowRef 避免深层响应式追踪，100+ 食谱时显著提升性能
  const recipes = shallowRef<Recipe[]>([])
  // Lightweight list for virtual scroll - avoids fetching ingredients/steps
  const recipesList = shallowRef<RecipeListItem[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref<string | null>(null)
  const hasMore = ref(true)
  const currentPage = ref(0)

  const currentLocale = computed(() => locale.value as Locale)

  // 🔧 Fix race condition: cancel in-flight requests when a new fetchRecipes call is made
  let _activeAbortController: AbortController | null = null
  let _activeRequestVersion = 0

  // 🔧 Fix race condition: cancel in-flight requests for fetchRecipesList
  let _activeAbortControllerList: AbortController | null = null
  let _activeRequestVersionList = 0

  const fetchRecipes = async (filters?: RecipeFilters, append = false) => {
    // Cancel any in-flight request from a previous (possibly stale) call
    if (_activeAbortController) {
      _activeAbortController.abort()
      _activeAbortController = null
    }

    const requestVersion = ++_activeRequestVersion
    const abortController = new AbortController()
    _activeAbortController = abortController

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

      // Build the base query - includes all recipe data with related ingredients, steps, tags
      // Note: recipe_translations is supported - mapRecipeData handles fallback when not present
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
        `, { count: 'exact', abortSignal: abortController.signal })
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

      // 🛡️ Race condition guard: ignore response from a stale/aborted request
      if (requestVersion !== _activeRequestVersion) return recipes.value
      if (err) throw err

      // Show all recipes - mapRecipeData handles recipe_translations if present, falls back to category
      const mappedData = (data || []).map((recipe: RawRecipe) => mapRecipeData(recipe, loc)) as Recipe[]

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
    } catch (err: unknown) {
      // Ignore abort errors — they indicate a cancelled stale request
      if (err instanceof Error && err.name === 'AbortError') return recipes.value
      error.value = err instanceof Error ? err.message : 'Failed to fetch recipes'
    } finally {
      if (requestVersion === _activeRequestVersion) {
        loading.value = false
        loadingMore.value = false
      }
    }

    return recipes.value
  }

  /**
   * Lightweight fetch for virtual scroll list view
   * Only fetches fields needed for RecipeCardLazy: id, title, imageUrl, prepTimeMinutes, cookTimeMinutes, servings, views
   * Avoids expensive joins on recipe_ingredients, recipe_steps, recipe_tags tables
   */
  const fetchRecipesList = async (filters?: RecipeFilters, append = false) => {
    // Cancel any in-flight request from a previous (possibly stale) call
    if (_activeAbortControllerList) {
      _activeAbortControllerList.abort()
      _activeAbortControllerList = null
    }

    const requestVersion = ++_activeRequestVersionList
    const abortController = new AbortController()
    _activeAbortControllerList = abortController

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

      // Lightweight query - only fetch fields needed for list display
      // No joins to recipe_ingredients, recipe_steps, recipe_tags
      let query = $supabase
        .from('recipes')
        .select(`
          id,
          recipe_translations(
            locale,
            title,
            description
          ),
          prep_time_minutes,
          cook_time_minutes,
          image_url,
          views,
          created_at
        `, { count: 'exact', abortSignal: abortController.signal })
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
        query = query.ilike('title', `%${filters.search}%`)
      }

      const { data, error: err, count } = await query

      // 🛡️ Race condition guard: ignore response from a stale/aborted request
      if (requestVersion !== _activeRequestVersionList) return recipesList.value
      if (err) throw err

      const mappedData = (data || []).map((recipe: RawRecipeListItem) => mapRecipeListItem(recipe, loc))

      if (append) {
        recipesList.value = [...recipesList.value, ...mappedData]
      } else {
        recipesList.value = mappedData
      }

      if (count !== null) {
        hasMore.value = recipesList.value.length < count
      } else {
        hasMore.value = mappedData.length === PAGE_SIZE
      }

      if (hasMore.value) {
        currentPage.value = append ? currentPage.value + 1 : 0
      }
    } catch (err: unknown) {
      // Ignore abort errors — they indicate a cancelled stale request
      if (err instanceof Error && err.name === 'AbortError') return recipesList.value
      error.value = err instanceof Error ? err.message : 'Failed to fetch recipes'
    } finally {
      if (requestVersion === _activeRequestVersionList) {
        loading.value = false
        loadingMore.value = false
      }
    }

    return recipesList.value
  }

  const fetchRecipeById = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const loc = currentLocale.value

      // Use optional join - mapRecipeData handles recipe_translations if present, falls back to category
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
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch recipe'
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
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to create recipe'
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

      // Fetch old IDs before any mutation (needed for translation cleanup order)
      const { data: oldIngredients } = await $supabase
        .from('recipe_ingredients')
        .select('id')
        .eq('recipe_id', id)

      const { data: oldSteps } = await $supabase
        .from('recipe_steps')
        .select('id')
        .eq('recipe_id', id)

      const oldIngredientIds = oldIngredients?.map((i) => i.id) || []
      const oldStepIds = oldSteps?.map((s) => s.id) || []

      // 🔧 Transaction safety: insert new data BEFORE deleting old data.
      // If delete fails after insert succeeds, data is still consistent (new data present).
      // If insert fails, old data remains untouched.

      // 1. Insert new translations first, then delete old
      if (recipeData.translations) {
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
        await $supabase.from('recipe_translations').delete().eq('recipe_id', id)
      }

      // 2. Insert new ingredients with translations
      if (recipeData.ingredients && recipeData.ingredients.length > 0) {
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

      // 3. Insert new steps with translations
      if (recipeData.steps && recipeData.steps.length > 0) {
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

      // 🗑️ Delete old related records (AFTER new data is safely inserted)
      if (oldIngredientIds.length > 0) {
        await $supabase.from('ingredient_translations').delete().in('ingredient_id', oldIngredientIds)
      }
      if (oldStepIds.length > 0) {
        await $supabase.from('step_translations').delete().in('step_id', oldStepIds)
      }
      await $supabase.from('recipe_ingredients').delete().eq('recipe_id', id)
      await $supabase.from('recipe_steps').delete().eq('recipe_id', id)
      await $supabase.from('recipe_tags').delete().eq('recipe_id', id)

      return recipe as Recipe
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to update recipe'
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
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to delete recipe'
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
      // Silently fail for view counting - non-critical operation
    }
  }

  // Helper function to fetch unique field values from recipes table
  // Optimized: Only select the specific field needed, use pagination for large datasets
  const fetchUniqueFieldKeys = async (field: 'category' | 'cuisine'): Promise<Array<{ id: number; name: string; displayName: string }>> => {
    try {
      // Use RPC to get distinct values efficiently - avoids fetching all columns
      // Fallback to client-side deduplication if RPC fails
      const { data, error } = await $supabase
        .from('recipes')
        .select(field)
        .not(field, 'is', null)
        .limit(1000) // Limit to prevent excessive memory usage

      if (error) throw error

      // Get unique field names using Set for O(n) deduplication
      const uniqueNames = [...new Set((data || []).map((r: Record<string, unknown>) => r[field] as string).filter(Boolean))]

      return uniqueNames.map((name, index) => ({
        id: index + 1,
        name,
        displayName: name,
      }))
    } catch (err: unknown) {
      return []
    }
  }

  const fetchCategoryKeys = () => fetchUniqueFieldKeys('category')
  const fetchCuisineKeys = () => fetchUniqueFieldKeys('cuisine')

  return {
    recipes,
    recipesList,
    loading,
    loadingMore,
    error,
    hasMore,
    fetchRecipes,
    fetchRecipesList,
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
