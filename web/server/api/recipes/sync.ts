import { defineEventHandler, readBody, type H3Event } from 'h3'
import { eq, and } from 'drizzle-orm'
import { useDb } from '../../utils/db'
import { getCurrentUser } from '../../utils/session'
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeTags,
} from '@recipe-app/database'

export default defineEventHandler(async (event: H3Event) => {
  const user = await getCurrentUser(event)
  if (!user) {
    return { error: 'Unauthorized', success: false }
  }

  const body = await readBody(event)
  const { action, recipeId, data, _syncTimestamp, _clientId } = body

  const db = useDb()

  switch (action) {
    case 'create-recipe': {
      try {
        // Check if recipe already exists
        const existing = recipeId ? await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1) : []
        if (existing.length > 0) {
          return { success: true, conflict: false, serverData: existing[0] }
        }

        const [recipeRow] = await db.insert(recipes).values({
          authorId: user.id,
          title: data?.title,
          description: data?.description,
          category: data?.category || '主菜',
          cuisine: data?.cuisine,
          servings: data?.servings || 2,
          prepTimeMinutes: data?.prep_time_minutes || 10,
          cookTimeMinutes: data?.cook_time_minutes || 20,
          difficulty: data?.difficulty || 'medium',
          imageUrl: data?.image_url,
        }).returning()

        if (data?.ingredients?.length > 0) {
          await db.insert(recipeIngredients).values(
            data.ingredients.map((ing: { name: string; amount: number | string; unit: string }) => ({
              recipeId: recipeRow.id,
              name: ing.name,
              amount: String(ing.amount),
              unit: ing.unit,
            }))
          )
        }

        if (data?.steps?.length > 0) {
          await db.insert(recipeSteps).values(
            data.steps.map((step: { step_number: number; instruction: string; duration_minutes?: number }) => ({
              recipeId: recipeRow.id,
              stepNumber: step.step_number,
              instruction: step.instruction,
              durationMinutes: step.duration_minutes,
            }))
          )
        }

        if (data?.tags?.length > 0) {
          await db.insert(recipeTags).values(
            data.tags.map((tag: string) => ({ recipeId: recipeRow.id, tag }))
          )
        }

        return { success: true, conflict: false, data: recipeRow }
      } catch (err) {
        console.error('[recipes/sync] Error creating recipe:', err)
        return { success: false, error: 'Failed to create recipe' }
      }
    }

    case 'update-recipe': {
      try {
        // Get current server version
        const [current] = await db.select().from(recipes).where(eq(recipes.id, recipeId)).limit(1)

        if (!current) {
          return { success: false, error: 'Recipe not found' }
        }

        // Check for conflict - if server updatedAt is newer than sync timestamp, there's a conflict
        if (current.updatedAt && _syncTimestamp) {
          const serverTime = new Date(current.updatedAt).getTime()
          const clientTime = _syncTimestamp
          if (serverTime > clientTime) {
            // Server has newer data - conflict
            return { success: false, conflict: true, serverData: current }
          }
        }

        // Perform update
        const updates: Record<string, unknown> = {}
        if (data?.title !== undefined) updates.title = data.title
        if (data?.description !== undefined) updates.description = data.description
        if (data?.category !== undefined) updates.category = data.category
        if (data?.cuisine !== undefined) updates.cuisine = data.cuisine
        if (data?.servings !== undefined) updates.servings = data.servings
        if (data?.prep_time_minutes !== undefined) updates.prepTimeMinutes = data.prep_time_minutes
        if (data?.cook_time_minutes !== undefined) updates.cookTimeMinutes = data.cook_time_minutes
        if (data?.difficulty !== undefined) updates.difficulty = data.difficulty
        if (data?.image_url !== undefined) updates.imageUrl = data.image_url

        updates.updatedAt = new Date()

        await db.update(recipes).set(updates).where(eq(recipes.id, recipeId))

        // Update ingredients if provided
        if (data?.ingredients !== undefined) {
          await db.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, recipeId))
          if (data.ingredients.length > 0) {
            await db.insert(recipeIngredients).values(
              data.ingredients.map((ing: { name: string; amount: number | string; unit: string }) => ({
                recipeId,
                name: ing.name,
                amount: String(ing.amount),
                unit: ing.unit,
              }))
            )
          }
        }

        // Update steps if provided
        if (data?.steps !== undefined) {
          await db.delete(recipeSteps).where(eq(recipeSteps.recipeId, recipeId))
          if (data.steps.length > 0) {
            await db.insert(recipeSteps).values(
              data.steps.map((step: { step_number: number; instruction: string; duration_minutes?: number }) => ({
                recipeId,
                stepNumber: step.step_number,
                instruction: step.instruction,
                durationMinutes: step.duration_minutes,
              }))
            )
          }
        }

        // Update tags if provided
        if (data?.tags !== undefined) {
          await db.delete(recipeTags).where(eq(recipeTags.recipeId, recipeId))
          if (data.tags.length > 0) {
            await db.insert(recipeTags).values(
              data.tags.map((tag: string) => ({ recipeId, tag }))
            )
          }
        }

        return { success: true, conflict: false }
      } catch (err) {
        console.error('[recipes/sync] Error updating recipe:', err)
        return { success: false, error: 'Failed to update recipe' }
      }
    }

    case 'delete-recipe': {
      try {
        // Verify ownership
        const [current] = await db.select().from(recipes).where(
          and(eq(recipes.id, recipeId), eq(recipes.authorId, user.id))
        ).limit(1)

        if (!current) {
          // Already deleted or not owned by user - consider it success
          return { success: true, conflict: false }
        }

        await db.delete(recipes).where(eq(recipes.id, recipeId))
        return { success: true, conflict: false }
      } catch (err) {
        console.error('[recipes/sync] Error deleting recipe:', err)
        return { success: false, error: 'Failed to delete recipe' }
      }
    }

    default:
      return { success: false, error: 'Unknown action' }
  }
})
