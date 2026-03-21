import type { Recipe, RecipeFilters, CreateRecipeDTO, Locale } from '~/types'

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
        `, { count: 'exact' })
        .eq('recipe_translations.locale', loc)
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
        // 优先搜索 recipes.title，因为 translations 可能没有所有 locale 的数据
        query = query.ilike('title', `%${filters.search}%`)
      }

      const { data, error: err, count } = await query

      if (err) throw err

      const mappedData = (data || []).map((recipe: any) => {
        const translation = recipe.recipe_translations?.[0] || {}
        
        return {
          ...recipe,
          title: translation.title || recipe.category,
          description: translation.description,
          ingredients: (recipe.ingredients || []).map((ing: any) => {
            const ingTranslation = ing.ingredient_translations?.find(
              (t: any) => t.locale === loc
            )
            return {
              id: ing.id,
              name: ingTranslation?.name || ing.name,
              amount: ing.amount,
              unit: ing.unit,
            }
          }),
          steps: (recipe.steps || [])
            .sort((a: any, b: any) => a.step_number - b.step_number)
            .map((step: any) => {
              const stepTranslation = step.step_translations?.find(
                (t: any) => t.locale === loc
              )
              return {
                id: step.id,
                stepNumber: step.step_number,
                instruction: stepTranslation?.instruction || step.instruction,
                durationMinutes: step.duration_minutes,
              }
            }),
          tags: recipe.tags?.map((t: any) => t.tag) || [],
          prepTimeMinutes: recipe.prep_time_minutes,
          cookTimeMinutes: recipe.cook_time_minutes,
          nutritionInfo: recipe.nutrition_info,
          imageUrl: recipe.image_url,
          created_at: recipe.created_at,
          updated_at: recipe.updated_at,
        }
      }) as Recipe[]

      if (append) {
        recipes.value = [...recipes.value, ...mappedData]
      } else {
        recipes.value = mappedData
      }

      // Check if there are more items to load
      if (count !== null) {
        hasMore.value = recipes.value.length < count
      } else {
        // If count is not available, assume there might be more if we got a full page
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

      if (err) {
        if (err.code === 'PGRST116') {
          error.value = 'Recipe not found'
        } else {
          throw err
        }
        return null
      }

      const translation = data.recipe_translations?.find(
        (t: any) => t.locale === loc
      ) || data.recipe_translations?.[0]

      const recipe = {
        ...data,
        title: translation?.title || data.category,
        description: translation?.description,
        translations: data.recipe_translations,
        ingredients: (data.ingredients || []).map((ing: any) => {
          const ingTranslation = ing.ingredient_translations?.find(
            (t: any) => t.locale === loc
          )
          return {
            id: ing.id,
            name: ingTranslation?.name || ing.name,
            amount: ing.amount,
            unit: ing.unit,
            translations: ing.ingredient_translations,
          }
        }),
        steps: (data.steps || [])
          .sort((a: any, b: any) => a.step_number - b.step_number)
          .map((step: any) => {
            const stepTranslation = step.step_translations?.find(
              (t: any) => t.locale === loc
            )
            return {
              id: step.id,
              stepNumber: step.step_number,
              instruction: stepTranslation?.instruction || step.instruction,
              durationMinutes: step.duration_minutes,
              translations: step.step_translations,
            }
          }),
        tags: data.tags?.map((t: any) => t.tag) || [],
        prepTimeMinutes: data.prep_time_minutes,
        cookTimeMinutes: data.cook_time_minutes,
        nutritionInfo: data.nutrition_info,
        imageUrl: data.image_url,
        created_at: data.created_at,
        updated_at: data.updated_at,
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
            const ingTranslations = ing.translations.map((t: { locale: Locale; name: string }) => ({
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
            const stepTranslations = step.translations.map((t: { locale: Locale; instruction: string }) => ({
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
                ing.translations.map((t: { locale: Locale; name: string }) => ({
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
                step.translations.map((t: { locale: Locale; instruction: string }) => ({
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

  const fetchCategories = async () => {
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

      return (data || []).map((c: any) => {
        const translation = c.category_translations?.find(
          (t: any) => t.locale === loc
        )
        return translation?.name || c.name
      })
    } catch (err: any) {
      console.error('Error fetching categories:', err)
      return []
    }
  }

  const fetchCuisines = async () => {
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

      return (data || []).map((c: any) => {
        const translation = c.cuisine_translations?.find(
          (t: any) => t.locale === loc
        )
        return translation?.name || c.name
      })
    } catch (err: any) {
      console.error('Error fetching cuisines:', err)
      return []
    }
  }

  const fetchCategoryKeys = async (): Promise<Array<{ id: number; name: string; displayName: string }>> => {
    try {
      // Get unique categories from recipes table directly
      const { data, error } = await $supabase
        .from('recipes')
        .select('category')
        .not('category', 'is', null)

      if (error) throw error

      // Get unique category names
      const categoryNames = [...new Set((data || []).map(r => r.category).filter(Boolean))]
      
      // Also try to get category translations from categories table
      const loc = locale.value as Locale
      const { data: catData } = await $supabase
        .from('categories')
        .select(`
          name,
          category_translations(
            locale,
            name
          )
        `)

      // Build category list with display names
      const result: Array<{ id: number; name: string; displayName: string }> = categoryNames.map((name, index) => {
        // Try to find translation
        const cat = catData?.find(c => {
          const trans = c.category_translations?.find((t: any) => t.locale === loc)
          return trans?.name === name || c.name === name
        })
        const trans = cat?.category_translations?.find((t: any) => t.locale === loc)
        
        return {
          id: index + 1,
          name: name,
          displayName: trans?.name || name
        }
      })

      return result
    } catch (err: any) {
      console.error('Error fetching category keys:', err)
      return []
    }
  }

  const fetchCuisineKeys = async (): Promise<Array<{ id: number; name: string; displayName: string }>> => {
    try {
      const loc = locale.value as Locale

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

      const mapped = (data || []).map((c: any) => {
        const translation = c.cuisine_translations?.find(
          (t: any) => t.locale === loc
        )
        return {
          id: c.id,
          name: c.name,
          displayName: translation?.name || c.name
        }
      })

      const seen = new Map<string, { id: number; name: string; displayName: string }>()
      for (const item of mapped) {
        const key = item.name.toLowerCase()
        if (!seen.has(key) || /[\u4e00-\u9fa5]/.test(item.displayName)) {
          seen.set(key, item)
        }
      }

      return Array.from(seen.values())
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
    fetchCategories,
    fetchCuisines,
    fetchCategoryKeys,
    fetchCuisineKeys,
    currentLocale,
  }
}
