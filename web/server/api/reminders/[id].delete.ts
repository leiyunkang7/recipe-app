/**
 * Delete Recipe Reminder API Endpoint
 *
 * DELETE /api/reminders/:id
 * Response: { success: boolean, error?: { code, message } }
 */

import { defineEventHandler, getRouterParam } from 'h3';
import { eq, and } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { recipeReminders } from '@recipe-app/database';
import { type ServiceResponse } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  const reminderId = getRouterParam(event, 'id');

  if (!reminderId) {
    return {
      success: false,
      error: {
        code: 'INVALID_PARAMS',
        message: '提醒ID不能为空',
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

    // Delete the reminder
    await db
      .delete(recipeReminders)
      .where(eq(recipeReminders.id, reminderId));

    return {
      success: true,
    } satisfies ServiceResponse<never>;
  } catch (error) {
    console.error('[delete-reminder] Error:', error);
    return {
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: '删除提醒失败，请稍后重试',
      },
    } satisfies ServiceResponse<never>;
  }
});
