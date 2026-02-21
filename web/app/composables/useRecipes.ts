import type { Recipe, RecipeFilters, CreateRecipeDTO } from '~/types'

export const useRecipes = () => {
  const { $supabase } = useNuxtApp()
  const recipes = ref<Recipe[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Fetch all recipes with optional filters
  const fetchRecipes = async (filters?: RecipeFilters) => {
    loading.value = true
    error.value = null

    try {
      let query = $supabase
        .from('recipes')
        .select(`
          *,
          ingredients:recipe_ingredients(
            name,
            amount,
            unit
          ),
          steps:recipe_steps(
            step_number,
            instruction,
            duration_minutes
          ),
          tags:recipe_tags(
            tag
          )
        `)
        .order('created_at', { ascending: false })

      // Apply filters
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
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      const { data, error: err } = await query

      if (err) throw err

      // Transform data to match our types
      recipes.value = (data || []).map((recipe: any) => ({
        ...recipe,
        ingredients: recipe.ingredients || [],
        steps: (recipe.steps || [])
          .sort((a: any, b: any) => a.step_number - b.step_number)
          .map((step: any) => ({
            stepNumber: step.step_number,
            instruction: step.instruction,
            durationMinutes: step.duration_minutes,
          })),
        tags: recipe.tags?.map((t: any) => t.tag) || [],
      })) as Recipe[]
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching recipes:', err)
    } finally {
      loading.value = false
    }

    return recipes.value
  }

  // Fetch a single recipe by ID
  const fetchRecipeById = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await $supabase
        .from('recipes')
        .select(`
          *,
          ingredients:recipe_ingredients(
            name,
            amount,
            unit
          ),
          steps:recipe_steps(
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

      if (err) throw err

      // Transform data
      const recipe = {
        ...data,
        ingredients: data.ingredients || [],
        steps: (data.steps || [])
          .sort((a: any, b: any) => a.step_number - b.step_number)
          .map((step: any) => ({
            stepNumber: step.step_number,
            instruction: step.instruction,
            durationMinutes: step.duration_minutes,
          })),
        tags: data.tags?.map((t: any) => t.tag) || [],
      }

      return recipe as Recipe
    } catch (err: any) {
      error.value = err.message
      console.error('Error fetching recipe:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Create a new recipe
  const createRecipe = async (recipeData: CreateRecipeDTO) => {
    loading.value = true
    error.value = null

    try {
      // Insert recipe
      const { data: recipe, error: recipeError } = await $supabase
        .from('recipes')
        .insert({
          title: recipeData.title,
          description: recipeData.description,
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

      // Insert ingredients
      if (recipeData.ingredients.length > 0) {
        const ingredients = recipeData.ingredients.map(ing => ({
          recipe_id: recipeId,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
        }))

        const { error: ingredientsError } = await $supabase
          .from('recipe_ingredients')
          .insert(ingredients)

        if (ingredientsError) throw ingredientsError
      }

      // Insert steps
      if (recipeData.steps.length > 0) {
        const steps = recipeData.steps.map(step => ({
          recipe_id: recipeId,
          step_number: step.stepNumber,
          instruction: step.instruction,
          duration_minutes: step.durationMinutes,
        }))

        const { error: stepsError } = await $supabase
          .from('recipe_steps')
          .insert(steps)

        if (stepsError) throw stepsError
      }

      // Insert tags
      if (recipeData.tags && recipeData.tags.length > 0) {
        const tags = recipeData.tags.map(tag => ({
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

  // Update an existing recipe
  const updateRecipe = async (id: string, recipeData: Partial<CreateRecipeDTO>) => {
    loading.value = true
    error.value = null

    try {
      // Update recipe
      const { data: recipe, error: recipeError } = await $supabase
        .from('recipes')
        .update({
          title: recipeData.title,
          description: recipeData.description,
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

      // Delete old ingredients, steps, tags
      await $supabase.from('recipe_ingredients').delete().eq('recipe_id', id)
      await $supabase.from('recipe_steps').delete().eq('recipe_id', id)
      await $supabase.from('recipe_tags').delete().eq('recipe_id', id)

      // Insert new ingredients
      if (recipeData.ingredients && recipeData.ingredients.length > 0) {
        const ingredients = recipeData.ingredients.map(ing => ({
          recipe_id: id,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
        }))

        const { error: ingredientsError } = await $supabase
          .from('recipe_ingredients')
          .insert(ingredients)

        if (ingredientsError) throw ingredientsError
      }

      // Insert new steps
      if (recipeData.steps && recipeData.steps.length > 0) {
        const steps = recipeData.steps.map(step => ({
          recipe_id: id,
          step_number: step.stepNumber,
          instruction: step.instruction,
          duration_minutes: step.durationMinutes,
        }))

        const { error: stepsError } = await $supabase
          .from('recipe_steps')
          .insert(steps)

        if (stepsError) throw stepsError
      }

      // Insert new tags
      if (recipeData.tags && recipeData.tags.length > 0) {
        const tags = recipeData.tags.map(tag => ({
          recipe_id: id,
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
      console.error('Error updating recipe:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  // Delete a recipe
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

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const { data, error } = await $supabase
        .from('categories')
        .select('name')

      if (error) throw error

      return data?.map((c: any) => c.name) || []
    } catch (err: any) {
      console.error('Error fetching categories:', err)
      return []
    }
  }

  // Fetch cuisines
  const fetchCuisines = async () => {
    try {
      const { data, error } = await $supabase
        .from('cuisines')
        .select('name')

      if (error) throw error

      return data?.map((c: any) => c.name) || []
    } catch (err: any) {
      console.error('Error fetching cuisines:', err)
      return []
    }
  }

  return {
    recipes,
    loading,
    error,
    fetchRecipes,
    fetchRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    fetchCategories,
    fetchCuisines,
  }
}
