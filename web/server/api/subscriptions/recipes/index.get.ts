/**
 * List User Recipe Subscriptions API Endpoint
 *
 * GET /api/subscriptions/recipes
 * Response: { success: boolean, subscriptions?: RecipeSubscription[], error?: { code, message } }
 */

import { defineEventHandler } from 'h3';
import { eq } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { recipeSubscriptions, recipes } from '@recipe-app/database';
import { type ServiceResponse, type RecipeSubscription } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
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
    const subscriptions = await db
      .select({
        id: recipeSubscriptions.id,
        userId: recipeSubscriptions.userId,
        recipeId: recipeSubscriptions.recipeId,
        subscribed: recipeSubscriptions.subscribed,
        createdAt: recipeSubscriptions.createdAt,
        updatedAt: recipeSubscriptions.updatedAt,
        recipeTitle: recipes.title,
        recipeImageUrl: recipes.imageUrl,
      })
      .from(recipeSubscriptions)
      .leftJoin(recipes, eq(recipeSubscriptions.recipeId, recipes.id))
      .where(eq(recipeSubscriptions.userId, user.id));

    return {
      success: true,
      data: subscriptions.map((sub) => ({
        id: sub.id,
        userId: sub.userId,
        recipeId: sub.recipeId,
        subscribed: sub.subscribed,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
        recipe: sub.recipeTitle ? {
          title: sub.recipeTitle,
          imageUrl: sub.recipeImageUrl,
        } : undefined,
      })) as (RecipeSubscription & { recipe?: { title: string; imageUrl: string | null } })[],
    } satisfies ServiceResponse<RecipeSubscription[]>;
  } catch (error) {
    console.error('[list-subscriptions] Error:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: '获取订阅列表失败，请稍后重试',
      },
    } satisfies ServiceResponse<never>;
  }
});
