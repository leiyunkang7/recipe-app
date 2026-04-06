/**
 * Mark all notifications as read for a user
 * POST /api/notifications/mark-all-read
 */

import { defineEventHandler, readBody } from 'h3';
import { useDb } from '../../utils/db';
import { notifications } from '@recipe-app/database';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { userId } = body;

  if (!userId) {
    return {
      success: false,
      error: { code: 'MISSING_USER_ID', message: 'userId is required' },
    };
  }

  try {
    const db = useDb();
    
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));

    return {
      success: true,
      data: { updated: true },
    };
  } catch (error) {
    console.error('[notifications] Mark all read error:', error);
    return {
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to mark all notifications as read' },
    };
  }
});
