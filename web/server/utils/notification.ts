import type { Notification, NotificationType } from '@recipe-app/shared-types';
import { useDb } from './db';
import { notifications } from '@recipe-app/database';
import { eq, desc, and } from 'drizzle-orm';
import { sendNotificationToUser, broadcastToRecipeSubscribers } from '../api/_ws';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  recipeId?: string;
}

/**
 * Server-side notification service using Drizzle ORM
 * Handles database operations and WebSocket broadcasting
 */
export class ServerNotificationService {
  /**
   * Create a new notification and broadcast via WebSocket
   */
  async create(params: CreateNotificationParams): Promise<Notification> {
    const db = useDb();
    const id = crypto.randomUUID();
    const createdAt = new Date();

    await db.insert(notifications).values({
      id,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      recipeId: params.recipeId || null,
      read: false,
      createdAt,
    });

    const notification: Notification = {
      id,
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      recipeId: params.recipeId,
      read: false,
      createdAt,
    };

    // Broadcast via WebSocket
    this.broadcastNotification(notification);

    return notification;
  }

  /**
   * Broadcast notification to WebSocket clients
   */
  private broadcastNotification(notification: Notification): void {
    try {
      if (notification.recipeId) {
        broadcastToRecipeSubscribers(notification.recipeId, notification);
      }
      sendNotificationToUser(notification.userId, notification);
    } catch (error) {
      console.warn('[ServerNotificationService] WebSocket broadcast failed:', error);
    }
  }

  /**
   * Fetch notifications for a user
   */
  async fetchByUserId(userId: string, limitCount = 50): Promise<Notification[]> {
    const db = useDb();

    const results = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limitCount);

    return results.map(row => ({
      id: row.id,
      userId: row.userId,
      type: row.type as NotificationType,
      title: row.title,
      message: row.message,
      recipeId: row.recipeId || undefined,
      read: row.read,
      createdAt: row.createdAt,
    }));
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const db = useDb();
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const db = useDb();
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: string, userId: string): Promise<void> {
    const db = useDb();
    await db
      .delete(notifications)
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  /**
   * Clear all notifications for a user
   */
  async clearAll(userId: string): Promise<void> {
    const db = useDb();
    await db.delete(notifications).where(eq(notifications.userId, userId));
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    const db = useDb();
    const results = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));

    return results.length;
  }

  /**
   * Format notification for recipe update
   */
  formatRecipeUpdateNotification(
    recipeId: string,
    recipeTitle: string,
    updatedFields: string[]
  ): CreateNotificationParams {
    return {
      userId: '',
      type: 'recipe_updated',
      title: 'Recipe Updated',
      message: `${recipeTitle} has been updated. Changes: ${updatedFields.join(', ')}`,
      recipeId,
    };
  }

  /**
   * Format notification for recipe deletion
   */
  formatRecipeDeleteNotification(recipeId: string, recipeTitle: string): CreateNotificationParams {
    return {
      userId: '',
      type: 'recipe_deleted',
      title: 'Recipe Deleted',
      message: `${recipeTitle} has been removed`,
      recipeId,
    };
  }

  /**
   * Format notification for reminder
   */
  formatReminderNotification(
    recipeId: string,
    recipeTitle: string,
    _reminderTime: Date
  ): CreateNotificationParams {
    return {
      userId: '',
      type: 'reminder_due',
      title: 'Cooking Reminder',
      message: `Time to cook ${recipeTitle}!`,
      recipeId,
    };
  }
}

export const serverNotificationService = new ServerNotificationService();
