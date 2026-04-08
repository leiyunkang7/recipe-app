/**
 * Notify Email Subscribers API Endpoint
 *
 * POST /api/subscriptions/email/notify
 * Request body: { recipeId: string, title: string, description?: string, updatedFields?: string[] }
 * Response: { success: boolean, notified?: number, error?: { code, message } }
 *
 * Note: This is an internal endpoint that should be called when a recipe is updated.
 * It sends email notifications to all email subscribers of the recipe.
 */

import { defineEventHandler, readBody } from 'h3';
import { eq, and } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { emailRecipeSubscriptions } from '@recipe-app/database';
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

    // Find all verified email subscribers for this recipe
    const subscribers = await db
      .select({
        email: emailRecipeSubscriptions.email,
        token: emailRecipeSubscriptions.verificationToken,
      })
      .from(emailRecipeSubscriptions)
      .where(
        and(
          eq(emailRecipeSubscriptions.recipeId, recipeId),
          eq(emailRecipeSubscriptions.subscribed, true)
        )
      );

    if (subscribers.length === 0) {
      return {
        success: true,
        data: { notified: 0, message: '没有已验证的邮箱订阅者' },
      } satisfies ServiceResponse<{ notified: number; message: string }>;
    }

    // Send notification to each subscriber
    const notification = {
      recipeId,
      title,
      description,
      updatedFields,
    };

    let successCount = 0;
    let failCount = 0;

    for (const subscriber of subscribers) {
      const result = await emailService.sendRecipeUpdateEmail(subscriber.email, notification, subscriber.token);
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
    console.error('[notify-email-subscribers] Error:', error);
    return {
      success: false,
      error: {
        code: 'NOTIFICATION_ERROR',
        message: '发送通知失败，请稍后重试',
      },
    } satisfies ServiceResponse<never>;
  }
});
