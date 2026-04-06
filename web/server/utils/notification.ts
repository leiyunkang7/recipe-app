import type { Notification, NotificationType } from '@recipe-app/shared-types';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  recipeId?: string;
}

export class NotificationService {
  createNotification(params: CreateNotificationParams): Notification {
    return {
      id: crypto.randomUUID(),
      userId: params.userId,
      type: params.type,
      title: params.title,
      message: params.message,
      recipeId: params.recipeId,
      read: false,
      createdAt: new Date(),
    };
  }

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

  formatRecipeDeleteNotification(recipeId: string, recipeTitle: string): CreateNotificationParams {
    return {
      userId: '',
      type: 'recipe_deleted',
      title: 'Recipe Deleted',
      message: `${recipeTitle} has been removed`,
      recipeId,
    };
  }

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

export const notificationService = new NotificationService();
