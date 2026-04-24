import type { Recipe, RecipeFilters, CreateRecipeDTO, Locale } from '~/types'

// ─── Shared data mapping helpers ─────────────────────────────────────────────
// Extracted to avoid duplication between fetchRecipes and fetchRecipeById

interface RawIngredient {
  id: string
  name: string
  amount: number
  unit: string
  ingredient_translations?: Array<{ locale: string; name: string }>
}

interface RawStep {
  id: string
  step_number: number
  instruction: string
  duration_minutes: number | null
  step_translations?: Array<{ locale: string; instruction: string }>
}

interface RawRecipe {
  id: string
  category: string
  cuisine?: string
  servings: number
  prep_time_minutes: number
  cook_time_minutes: number
  difficulty: string
  image_url?: string
  source?: string
  nutrition_info?: Record<string, unknown>
  created_at: string
  updated_at: string
  recipe_translations?: Array<{ locale: string; title: string; description?: string }>
  ingredients?: RawIngredient[]
  steps?: RawStep[]
  tags?: Array<{ tag: string }>
  [key: string]: unknown
}

interface RawCategory {
  id: string
  name: string
  category_translations?: Array<{ locale: string; name: string }>
}

interface RawCuisine {
  id: string
  name: string
  cuisine_translations?: Array<{ locale: string; name: string }>
}

const mapIngredients = (rawIngredients: RawIngredient[], loc: Locale) =>
  (rawIngredients || []).map((ing: RawIngredient) => {
    const translation = ing.ingredient_translations?.find(
      (t) => t.locale === loc
    )
    return {
      id: ing.id,
      name: translation?.name || ing.name,
      amount: ing.amount,
      unit: ing.unit,
    }
  })

const mapSteps = (rawSteps: RawStep[], loc: Locale) =>
  (rawSteps || [])
    .sort((a, b) => a.step_number - b.step_number)
    .map((step) => {
      const translation = step.step_translations?.find(
        (t) => t.locale === loc
      )
      return {
        id: step.id,
        stepNumber: step.step_number,
        instruction: translation?.instruction || step.instruction,
        durationMinutes: step.duration_minutes,
      }
    })

interface CategoryResult {
  id: string
  name: string
  displayName: string
}

interface CuisineResult {
  id: string
  name: string
  displayName: string
}

const mapCategories = (rawList: RawCategory[], loc: Locale): CategoryResult[] =>
  (rawList || []).map((c) => {
    const translation = c.category_translations?.find(
      (t) => t.locale === loc
    )
    return {
      id: c.id,
      name: c.name,
      displayName: translation?.name || c.name,
    }
  })

const mapCuisines = (rawList: RawCuisine[], loc: Locale): CuisineResult[] =>
  (rawList || []).map((c) => {
    const translation = c.cuisine_translations?.find(
      (t) => t.locale === loc
    )
    return {
      id: c.id,
      name: c.name,
      displayName: translation?.name || c.name,
    }
  })

const mapCategoriesToDomain = (raw: RawRecipe, loc: Locale): Recipe => {
  const translation = raw.recipe_translations?.find(
    (t) => t.locale === loc
  ) || raw.recipe_translations?.[0] || {}

  return {
    ...raw,
    title: (translation as { title?: string }).title || raw.category,
    description: (translation as { description?: string }).description,
    ingredients: mapIngredients(raw.ingredients || [], loc),
    steps: mapSteps(raw.steps || [], loc),
    tags: raw.tags?.map((t) => t.tag) || [],
    prepTimeMinutes: raw.prep_time_minutes,
    cookTimeMinutes: raw.cook_time_minutes,
    nutritionInfo: raw.nutrition_info,
    imageUrl: raw.image_url,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  } as Recipe
}

export const useRecipes = () => {
  const { $supabase } = useNuxtApp()
  const { locale } = useI18n()

  // Use Nuxt useState for shared reactive state across components
  const recipes = useState<Recipe[]>('recipes-data', () => [])
  const loading = useState<boolean>('recipes-loading', () => false)
  const error = useState<string | null>('recipes-error', () => null)

  const currentLocale = computed(() => locale.value as Locale)

  const fetchRecipes = async (filters?: RecipeFilters) => {
    loading.value = true
    error.value = null

    try {
      const loc = filters?.locale || currentLocale.value
      
      let query = $supabase
        .from('recipes')
        .select(`
          *,
          recipe_translations!inner(
            locale,
            title,
            description
          ),
          ingredients:recipe_ingredients(
            id,
            name,
            amount,
            unit,
            ingredient_translations(
              locale,
              name
            )
          ),
          steps:recipe_steps(
            id,
            step_number,
            instruction,
            duration_minutes,
            step_translations(
              locale,
              instruction
            )
          ),
          tags:recipe_tags(
            tag
          )
        `)
        .eq('recipe_translations.locale', loc)
        .order('created_at', { ascending: false })

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
        query = query.ilike('recipe_translations.title', `%${filters.search}%`)
      }

      const { data, error: err } = await query

      if (err) throw err

      recipes.value = (data || []).map((recipe: RawRecipe) =>
        mapCategoriesToDomain(recipe, loc)
      )
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      error.value = message
      console.error('Error fetching recipes:', err)
    } finally {
      loading.value = false
    }

    return recipes.value
  }

  const fetchRecipeById = async (id: string) => {
    loading.value = true
    error.value = null

    try {
      const loc = currentLocale.value

      const { data, error: err } = await $supabase
        .from('recipes')
        .select(`
          *,
          recipe_translations(
            locale,
            title,
            description
          ),
          ingredients:recipe_ingredients(
            id,
            name,
            amount,
            unit,
            ingredient_translations(
              locale,
              name
            )
          ),
          steps:recipe_steps(
            id,
            step_number,
            instruction,
            duration_minutes,
            step_translations(
              locale,
              instruction
            )
          ),
          tags:recipe_tags(
            tag
          )
        `)
        .eq('id', id)
        .single()

      if (err) throw err

      return mapRecipeToDomain(data, loc)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      error.value = message
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
        const translations = recipeData.translations.map(t => ({
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
        for (const ing of recipeData.ingredients) {
          const { data: ingredient, error: ingError } = await $supabase
            .from('recipe_ingredients')
            .insert({
              recipe_id: recipeId,
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
            })
            .select()
            .single()

          if (ingError) throw ingError

          if (ing.translations && ing.translations.length > 0) {
            const ingTranslations = ing.translations.map(t => ({
              ingredient_id: ingredient.id,
              locale: t.locale,
              name: t.name,
            }))

            await $supabase
              .from('ingredient_translations')
              .insert(ingTranslations)
          }
        }
      }

      if (recipeData.steps.length > 0) {
        for (const step of recipeData.steps) {
          const { data: stepData, error: stepError } = await $supabase
            .from('recipe_steps')
            .insert({
              recipe_id: recipeId,
              step_number: step.stepNumber,
              instruction: step.instruction,
              duration_minutes: step.durationMinutes,
            })
            .select()
            .single()

          if (stepError) throw stepError

          if (step.translations && step.translations.length > 0) {
            const stepTranslations = step.translations.map(t => ({
              step_id: stepData.id,
              locale: t.locale,
              instruction: t.instruction,
            }))

            await $supabase
              .from('step_translations')
              .insert(stepTranslations)
          }
        }
      }

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      error.value = message
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
        
        for (const t of recipeData.translations) {
          await $supabase
            .from('recipe_translations')
            .insert({
              recipe_id: id,
              locale: t.locale,
              title: t.title,
              description: t.description,
            })
        }
      }

      const { data: oldIngredients } = await $supabase
        .from('recipe_ingredients')
        .select('id')
        .eq('recipe_id', id)
      
      for (const ing of oldIngredients || []) {
        await $supabase.from('ingredient_translations').delete().eq('ingredient_id', ing.id)
      }
      await $supabase.from('recipe_ingredients').delete().eq('recipe_id', id)

      const { data: oldSteps } = await $supabase
        .from('recipe_steps')
        .select('id')
        .eq('recipe_id', id)
      
      for (const step of oldSteps || []) {
        await $supabase.from('step_translations').delete().eq('step_id', step.id)
      }
      await $supabase.from('recipe_steps').delete().eq('recipe_id', id)
      await $supabase.from('recipe_tags').delete().eq('recipe_id', id)

      if (recipeData.ingredients && recipeData.ingredients.length > 0) {
        for (const ing of recipeData.ingredients) {
          const { data: ingredient } = await $supabase
            .from('recipe_ingredients')
            .insert({
              recipe_id: id,
              name: ing.name,
              amount: ing.amount,
              unit: ing.unit,
            })
            .select()
            .single()

          if (ing.translations && ing.translations.length > 0 && ingredient) {
            await $supabase
              .from('ingredient_translations')
              .insert(
                ing.translations.map(t => ({
                  ingredient_id: ingredient.id,
                  locale: t.locale,
                  name: t.name,
                }))
              )
          }
        }
      }

      if (recipeData.steps && recipeData.steps.length > 0) {
        for (const step of recipeData.steps) {
          const { data: stepData } = await $supabase
            .from('recipe_steps')
            .insert({
              recipe_id: id,
              step_number: step.stepNumber,
              instruction: step.instruction,
              duration_minutes: step.durationMinutes,
            })
            .select()
            .single()

          if (step.translations && step.translations.length > 0 && stepData) {
            await $supabase
              .from('step_translations')
              .insert(
                step.translations.map(t => ({
                  step_id: stepData.id,
                  locale: t.locale,
                  instruction: t.instruction,
                }))
              )
          }
        }
      }

      if (recipeData.tags && recipeData.tags.length > 0) {
        await $supabase
          .from('recipe_tags')
          .insert(
            recipeData.tags.map(tag => ({
              recipe_id: id,
              tag,
            }))
          )
      }

      return recipe as Recipe
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      error.value = message
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      error.value = message
      console.error('Error deleting recipe:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  const fetchCategories = async (): Promise<CategoryResult[]> => {
    try {
      const loc = currentLocale.value

      const { data, error } = await $supabase
        .from('categories')
        .select(`
          id,
          name,
          category_translations(
            locale,
            name
          )
        `)

      if (error) throw error

      return mapCategories(data || [], loc)
    } catch (err: unknown) {
      console.error('Error fetching categories:', err)
      return []
    }
  }

  const fetchCuisines = async (): Promise<CuisineResult[]> => {
    try {
      const loc = currentLocale.value

      const { data, error } = await $supabase
        .from('cuisines')
        .select(`
          id,
          name,
          cuisine_translations(
            locale,
            name
          )
        `)

      if (error) throw error

      return mapCuisines(data || [], loc)
    } catch (err: unknown) {
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
    currentLocale,
  }
}
