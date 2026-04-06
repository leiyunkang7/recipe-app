/**
 * Subscribe to Recipe Updates API Endpoint
 *
 * POST /api/subscriptions/recipes
 * Request body: { recipeId: string }
 * Response: { success: boolean, subscription?: RecipeSubscription, error?: { code, message } }
 */

import { defineEventHandler, readBody } from 'h3';
import { eq, and } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { recipeSubscriptions, recipes } from '@recipe-app/database';
import { SubscribeToRecipeSchema, type ServiceResponse, type RecipeSubscription } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Validate request body
  const validationResult = SubscribeToRecipeSchema.safeParse(body);
  if (!validationResult.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: validationResult.error.errors.map((e) => e.message).join(', '),
      },
    } satisfies ServiceResponse<never>;
  }

  const { recipeId } = validationResult.data;

  // Get user from session (assuming auth middleware sets user)
  const user = (event.context as { user?: { id: string } })?.user;
  if (!user?.id) {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '请先登录',
      },
    } satisfies ServiceResponse<never>;
  }

  const db = useDb();

  try {
    // Check if recipe exists
    const recipe = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (recipe.length === 0) {
      return {
        success: false,
        error: {
          code: 'RECIPE_NOT_FOUND',
          message: '食谱不存在',
        },
      } satisfies ServiceResponse<never>;
    }

    // Check if subscription already exists
    const existingSubscription = await db
      .select()
      .from(recipeSubscriptions)
      .where(
        and(
          eq(recipeSubscriptions.userId, user.id),
          eq(recipeSubscriptions.recipeId, recipeId)
        )
      )
      .limit(1);

    if (existingSubscription.length > 0) {
      // Update existing subscription to subscribed
      const [updated] = await db
        .update(recipeSubscriptions)
        .set({
          subscribed: true,
          updatedAt: new Date(),
        })
        .where(eq(recipeSubscriptions.id, existingSubscription[0].id))
        .returning();

      return {
        success: true,
        data: {
          id: updated.id,
          userId: updated.userId,
          recipeId: updated.recipeId,
          subscribed: updated.subscribed,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        } as RecipeSubscription,
      } satisfies ServiceResponse<RecipeSubscription>;
    }

    // Create new subscription
    const [newSubscription] = await db
      .insert(recipeSubscriptions)
      .values({
        userId: user.id,
        recipeId: recipeId,
        subscribed: true,
      })
      .returning();

    return {
      success: true,
      data: {
        id: newSubscription.id,
        userId: newSubscription.userId,
        recipeId: newSubscription.recipeId,
        subscribed: newSubscription.subscribed,
        createdAt: newSubscription.createdAt,
        updatedAt: newSubscription.updatedAt,
      } as RecipeSubscription,
    } satisfies ServiceResponse<RecipeSubscription>;
  } catch (error) {
    console.error('[subscribe-recipe] Error:', error);
    return {
      success: false,
      error: {
        code: 'SUBSCRIPTION_ERROR',
        message: '订阅失败，请稍后重试',
      },
    } satisfies ServiceResponse<never>;
  }
});
