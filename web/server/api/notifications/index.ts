/**
 * Notifications API Endpoint
 *
 * GET /api/notifications - Fetch user's notifications
 * POST /api/notifications - Create a new notification
 */

import { defineEventHandler, getQuery, readBody } from 'h3';
import { useDb } from '../../utils/db';
import { notifications } from '@recipe-app/database';
import { eq, and, desc, limit } from 'drizzle-orm';
import type { NotificationType } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  const method = event.method;

  // GET - Fetch notifications
  if (method === 'GET') {
    const query = getQuery(event);
    const userId = query.userId as string;
    const limitCount = parseInt(query.limit as string) || 50;
    const unreadOnly = query.unreadOnly === 'true';

    if (!userId) {
      return {
        success: false,
        error: { code: 'MISSING_USER_ID', message: 'userId is required' },
      };
    }

    try {
      const db = useDb();
      
      let query = db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(limitCount);

      if (unreadOnly) {
        query = query.where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
      }

      const results = await query;

      // Map to Notification type
      const mapped = results.map(row => ({
        id: row.id,
        userId: row.userId,
        type: row.type,
        title: row.title,
        message: row.message,
        recipeId: row.recipeId,
        read: row.read,
        createdAt: row.createdAt,
      }));

      return {
        success: true,
        data: mapped,
      };
    } catch (error) {
      console.error('[notifications] Fetch error:', error);
      return {
        success: false,
        error: { code: 'FETCH_ERROR', message: 'Failed to fetch notifications' },
      };
    }
  }

  // POST - Create notification
  if (method === 'POST') {
    const body = await readBody(event);
    const { userId, type, title, message, recipeId } = body;

    if (!userId || !type || !title || !message) {
      return {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'userId, type, title, and message are required' },
      };
    }

    try {
      const db = useDb();
      const id = crypto.randomUUID();
      
      await db.insert(notifications).values({
        id,
        userId,
        type: type as NotificationType,
        title,
        message,
        recipeId: recipeId || null,
        read: false,
      });

      return {
        success: true,
        data: {
          id,
          userId,
          type,
          title,
          message,
          recipeId,
          read: false,
          createdAt: new Date(),
        },
      };
    } catch (error) {
      console.error('[notifications] Create error:', error);
      return {
        success: false,
        error: { code: 'INSERT_ERROR', message: 'Failed to create notification' },
      };
    }
  }

  return {
    success: false,
    error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET and POST are allowed' },
  };
});
