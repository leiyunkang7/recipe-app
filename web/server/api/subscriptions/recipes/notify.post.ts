/**
 * Notify Recipe Subscribers API Endpoint
 *
 * POST /api/subscriptions/recipes/notify
 * Request body: { recipeId: string, title: string, description?: string, updatedFields?: string[] }
 * Response: { success: boolean, notified?: number, error?: { code, message } }
 *
 * Note: This is an internal endpoint that should be called when a recipe is updated.
 * It sends email notifications to all subscribers of the recipe.
 */

import { defineEventHandler, readBody } from 'h3';
import { eq } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { recipeSubscriptions, users } from '@recipe-app/database';
import { createEmailService } from '@recipe-app/email-service';
import { RecipeUpdateNotificationSchema, type ServiceResponse } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Validate request body
  const validationResult = RecipeUpdateNotificationSchema.safeParse(body);
  if (!validationResult.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: validationResult.error.errors.map((e) => e.message).join(', '),
      },
    } satisfies ServiceResponse<never>;
  }

  const { recipeId, title, description, updatedFields } = validationResult.data;

  const db = useDb();

  try {
    // Get email service instance
    const emailService = createEmailService(db as unknown);

    // Find all active subscribers for this recipe
    const subscribers = await db
      .select({
        userId: recipeSubscriptions.userId,
        email: users.email,
        displayName: users.displayName,
      })
      .from(recipeSubscriptions)
      .innerJoin(users, eq(recipeSubscriptions.userId, users.id))
      .where(eq(recipeSubscriptions.recipeId, recipeId));

    if (subscribers.length === 0) {
      return {
        success: true,
        data: { notified: 0, message: '没有订阅者' },
      } satisfies ServiceResponse<{ notified: number; message: string }>;
    }

    // Send notification to each subscriber
    const notification: Parameters<typeof emailService.sendRecipeUpdateEmail>[1] = {
      recipeId,
      title,
      description,
      updatedFields,
    };

    let successCount = 0;
    let failCount = 0;

    for (const subscriber of subscribers) {
      const result = await emailService.sendRecipeUpdateEmail(subscriber.email, notification);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    return {
      success: true,
      data: {
        notified: successCount,
        failed: failCount,
        total: subscribers.length,
      },
    } satisfies ServiceResponse<{ notified: number; failed: number; total: number }>;
  } catch (error) {
    console.error('[notify-subscribers] Error:', error);
    return {
      success: false,
      error: {
        code: 'NOTIFICATION_ERROR',
        message: '发送通知失败，请稍后重试',
      },
    } satisfies ServiceResponse<never>;
  }
});
