/**
 * Mark notification as read
 * PATCH /api/notifications/[id]/read
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
    
    await db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));

    return {
      success: true,
      data: { id, read: true },
    };
  } catch (error) {
    console.error('[notifications] Mark read error:', error);
    return {
      success: false,
      error: { code: 'UPDATE_ERROR', message: 'Failed to mark notification as read' },
    };
  }
});
