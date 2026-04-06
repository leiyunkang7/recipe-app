import type { Notification, NotificationType } from '@recipe-app/shared-types';
import { ServiceResponse, successResponse, errorResponse } from '@recipe-app/shared-types';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  recipeId?: string;
}

/**
 * NotificationService - Supabase-backed notification persistence
 * 
 * Provides CRUD operations for notifications with Supabase as the backend.
 * Used by useNotificationStore to persist notifications across sessions.
 */
export class NotificationService {
  private supabase: any;

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient;
  }

  /**
   * Fetch notifications for a user from Supabase
   */
  async fetchByUserId(
    userId: string,
    options?: { limit?: number; unreadOnly?: boolean }
  ): Promise<ServiceResponse<Notification[]>> {
    try {
      const { limit = 50, unreadOnly = false } = options || {};
      
      let query = this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const { data, error } = await query;

      if (error) {
        return errorResponse('FETCH_ERROR', 'Failed to fetch notifications', error);
      }

      const notifications: Notification[] = (data || []).map(this.mapDbToNotification);
      return successResponse(notifications);
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'Failed to fetch notifications', error);
    }
  }

  /**
   * Create a new notification in Supabase
   */
  async create(params: CreateNotificationParams): Promise<ServiceResponse<Notification>> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          type: params.type,
          title: params.title,
          message: params.message,
          recipe_id: params.recipeId || null,
          read: false,
        })
        .select()
        .single();

      if (error) {
        return errorResponse('INSERT_ERROR', 'Failed to create notification', error);
      }

      return successResponse(this.mapDbToNotification(data));
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'Failed to create notification', error);
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        return errorResponse('UPDATE_ERROR', 'Failed to mark notification as read', error);
      }

      return successResponse(undefined);
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'Failed to mark notification as read', error);
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        return errorResponse('UPDATE_ERROR', 'Failed to mark all notifications as read', error);
      }

      return successResponse(undefined);
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'Failed to mark all notifications as read', error);
    }
  }

  /**
   * Delete a notification
   */
  async delete(notificationId: string, userId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        return errorResponse('DELETE_ERROR', 'Failed to delete notification', error);
      }

      return successResponse(undefined);
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'Failed to delete notification', error);
    }
  }

  /**
   * Clear all notifications for a user
   */
  async clearAll(userId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) {
        return errorResponse('DELETE_ERROR', 'Failed to clear notifications', error);
      }

      return successResponse(undefined);
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'Failed to clear notifications', error);
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<ServiceResponse<number>> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        return errorResponse('COUNT_ERROR', 'Failed to get unread count', error);
      }

      return successResponse(count || 0);
    } catch (error) {
      return errorResponse('UNKNOWN_ERROR', 'Failed to get unread count', error);
    }
  }

  /**
   * Subscribe to realtime notifications for a user
   * Returns an unsubscribe function
   */
  subscribeToNewNotifications(
    userId: string,
    onNewNotification: (notification: Notification) => void
  ): () => void {
    const subscription = this.supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          const notification = this.mapDbToNotification(payload.new);
          onNewNotification(notification);
        }
      )
      .subscribe();

    return () => {
      this.supabase.removeChannel(subscription);
    };
  }

  /**
   * Map database row to Notification type
   */
  private mapDbToNotification(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type as NotificationType,
      title: row.title,
      message: row.message,
      recipeId: row.recipe_id || undefined,
      read: row.read,
      createdAt: new Date(row.created_at),
    };
  }
}

/**
 * Create a NotificationService instance
 * Requires Supabase client to be available
 */
export function createNotificationService(supabaseClient: any): NotificationService {
  return new NotificationService(supabaseClient);
}
