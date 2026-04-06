/**
 * Update Recipe Reminder API Endpoint
 *
 * PATCH /api/reminders/:id
 * Request body: { reminderTime?: string, note?: string, notified?: boolean }
 * Response: { success: boolean, reminder?: RecipeReminder, error?: { code, message } }
 */

import { defineEventHandler, getRouterParam, readBody } from 'h3';
import { eq, and } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { recipeReminders } from '@recipe-app/database';
import { UpdateRecipeReminderSchema, type ServiceResponse, type RecipeReminder } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  const reminderId = getRouterParam(event, 'id');
  const body = await readBody(event);

  if (!reminderId) {
    return {
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message: '提醒ID不能为空',
      },
    } satisfies ServiceResponse<never>;
  }

  // Validate request body
  const validationResult = UpdateRecipeReminderSchema.safeParse(body);
  if (!validationResult.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: validationResult.error.errors.map((e) => e.message).join(', '),
      },
    } satisfies ServiceResponse<never>;
  }

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
    // Check if reminder exists and belongs to user
    const reminder = await db
      .select()
      .from(recipeReminders)
      .where(
        and(
          eq(recipeReminders.id, reminderId),
          eq(recipeReminders.userId, user.id)
        )
      )
      .limit(1);

    if (reminder.length === 0) {
      return {
        success: false,
        error: {
          code: 'REMINDER_NOT_FOUND',
          message: '提醒不存在',
        },
      } satisfies ServiceResponse<never>;
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (body.reminderTime !== undefined) {
      updateData.reminderTime = new Date(body.reminderTime);
    }
    if (body.note !== undefined) {
      updateData.note = body.note;
    }
    if (body.notified !== undefined) {
      updateData.notified = body.notified;
    }

    // Update the reminder
    const [updated] = await db
      .update(recipeReminders)
      .set(updateData)
      .where(eq(recipeReminders.id, reminderId))
      .returning();

    return {
      success: true,
      data: {
        id: updated.id,
        userId: updated.userId,
        recipeId: updated.recipeId,
        reminderTime: updated.reminderTime,
        note: updated.note,
        notified: updated.notified,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
      } as RecipeReminder,
    } satisfies ServiceResponse<RecipeReminder>;
  } catch (error) {
    console.error('[update-reminder] Error:', error);
    return {
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: '更新提醒失败，请稍后重试',
      },
    } satisfies ServiceResponse<never>;
  }
});
