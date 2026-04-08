/**
 * Create Recipe Reminder API Endpoint
 *
 * POST /api/reminders
 * Request body: { recipeId: string, reminderTime: string, note?: string }
 * Response: { success: boolean, reminder?: RecipeReminder, error?: { code, message } }
 */

import { defineEventHandler, readBody } from 'h3';
import { rateLimiters } from "../../utils/rateLimit";
import { eq, and } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { recipeReminders, recipes } from '@recipe-app/database';
import { CreateRecipeReminderSchema, type ServiceResponse, type RecipeReminder } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  // Apply rate limiting
  await rateLimiters.userAction(event);
  const body = await readBody(event);

  // Validate request body
  const validationResult = CreateRecipeReminderSchema.safeParse(body);
  if (!validationResult.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: validationResult.error.errors.map((e) => e.message).join(', '),
      },
    } satisfies ServiceResponse<never>;
  }

  const { recipeId, reminderTime, note } = validationResult.data;

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

    // Check if reminder already exists at the same time
    const existingReminder = await db
      .select()
      .from(recipeReminders)
      .where(
        and(
          eq(recipeReminders.userId, user.id),
          eq(recipeReminders.recipeId, recipeId),
          eq(recipeReminders.reminderTime, new Date(reminderTime))
        )
      )
      .limit(1);

    if (existingReminder.length > 0) {
      return {
        success: false,
        error: {
          code: 'REMINDER_EXISTS',
          message: '该时间已设置过提醒',
        },
      } satisfies ServiceResponse<never>;
    }

    // Create new reminder
    const [newReminder] = await db
      .insert(recipeReminders)
      .values({
        userId: user.id,
        recipeId: recipeId,
        reminderTime: new Date(reminderTime),
        note: note || null,
        notified: false,
      })
      .returning();

    return {
      success: true,
      data: {
        id: newReminder.id,
        userId: newReminder.userId,
        recipeId: newReminder.recipeId,
        reminderTime: newReminder.reminderTime,
        note: newReminder.note,
        notified: newReminder.notified,
        createdAt: newReminder.createdAt,
        updatedAt: newReminder.updatedAt,
      } as RecipeReminder,
    } satisfies ServiceResponse<RecipeReminder>;
  } catch (error) {
    console.error('[create-reminder] Error:', error);
    return {
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: '创建提醒失败，请稍后重试',
      },
    } satisfies ServiceResponse<never>;
  }
});
