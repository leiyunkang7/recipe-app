/**
 * List User Recipe Reminders API Endpoint
 *
 * GET /api/reminders
 * Response: { success: boolean, reminders?: RecipeReminder[], error?: { code, message } }
 */

import { defineEventHandler } from 'h3';
import { eq, gte, lte, and } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { recipeReminders, recipes } from '@recipe-app/database';
import { type ServiceResponse, type RecipeReminder } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
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
  const query = getQuery(event);

  try {
    // Build query conditions
    const conditions = [eq(recipeReminders.userId, user.id)];

    // Optional date range filters
    if (query.startDate) {
      conditions.push(gte(recipeReminders.reminderTime, new Date(query.startDate as string)));
    }
    if (query.endDate) {
      conditions.push(lte(recipeReminders.reminderTime, new Date(query.endDate as string)));
    }

    const reminders = await db
      .select({
        id: recipeReminders.id,
        userId: recipeReminders.userId,
        recipeId: recipeReminders.recipeId,
        reminderTime: recipeReminders.reminderTime,
        note: recipeReminders.note,
        notified: recipeReminders.notified,
        createdAt: recipeReminders.createdAt,
        updatedAt: recipeReminders.updatedAt,
        recipeTitle: recipes.title,
        recipeImageUrl: recipes.imageUrl,
        recipeCookTime: recipes.cookTimeMinutes,
      })
      .from(recipeReminders)
      .leftJoin(recipes, eq(recipeReminders.recipeId, recipes.id))
      .where(and(...conditions))
      .orderBy(recipeReminders.reminderTime);

    return {
      success: true,
      data: reminders.map((reminder) => ({
        id: reminder.id,
        userId: reminder.userId,
        recipeId: reminder.recipeId,
        reminderTime: reminder.reminderTime,
        note: reminder.note,
        notified: reminder.notified,
        createdAt: reminder.createdAt,
        updatedAt: reminder.updatedAt,
        recipe: reminder.recipeTitle ? {
          title: reminder.recipeTitle,
          imageUrl: reminder.recipeImageUrl,
          cookTimeMinutes: reminder.recipeCookTime,
        } : undefined,
      })) as (RecipeReminder & { recipe?: { title: string; imageUrl: string | null; cookTimeMinutes: number } })[],
    } satisfies ServiceResponse<RecipeReminder[]>;
  } catch (error) {
    console.error('[list-reminders] Error:', error);
    return {
      success: false,
      error: {
        code: 'FETCH_ERROR',
        message: '获取提醒列表失败，请稍后重试',
      },
    } satisfies ServiceResponse<never>;
  }
});
