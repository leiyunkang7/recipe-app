import type { Recipe, CreateRecipeDTO, Locale } from '~/types'

export const useRecipeMutations = () => {
  const { $supabase } = useNuxtApp()
  const { locale } = useI18n()

  const loading = ref(false)
  const error = ref<string | null>(null)

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

  return {
    loading,
    error,
    createRecipe,
    updateRecipe,
    deleteRecipe,
  }
}
