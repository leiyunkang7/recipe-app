/**
 * Delete notification
 * DELETE /api/notifications/[id]
 */

import { defineEventHandler, getRouterParam } from 'h3';
import { useDb } from '../../../utils/db';
import { notifications } from '@recipe-app/database';
import { eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');

  if (!id) {
    return {
      success: false,
      error: { code: 'MISSING_ID', message: 'Notification ID is required' },
    };
  }

  try {
    const db = useDb();
    
    await db.delete(notifications).where(eq(notifications.id, id));

    return {
      success: true,
      data: { id, deleted: true },
    };
  } catch (error) {
    console.error('[notifications] Delete error:', error);
    return {
      success: false,
      error: { code: 'DELETE_ERROR', message: 'Failed to delete notification' },
    };
  }
});
