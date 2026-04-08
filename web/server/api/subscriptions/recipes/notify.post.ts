/**
 * Notify Recipe Subscribers API Endpoint
 *
 * POST /api/subscriptions/recipes/notify
 * Request body: { recipeId: string, title: string, description?: string, updatedFields?: string[] }
 * Response: { success: boolean, notified?: number, error?: { code, message } }
 *
 * Note: This is an internal endpoint that should be called when a recipe is updated.
 * It sends email notifications to all subscribers of the recipe (both authenticated and anonymous).
 */

import { defineEventHandler, readBody } from 'h3';
import { eq, and } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { recipeSubscriptions, users, emailRecipeSubscriptions } from '@recipe-app/database';
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

    // Find all active authenticated subscribers for this recipe
    const authSubscribers = await db
      .select({
        userId: recipeSubscriptions.userId,
        email: users.email,
        displayName: users.displayName,
      })
      .from(recipeSubscriptions)
      .innerJoin(users, eq(recipeSubscriptions.userId, users.id))
      .where(eq(recipeSubscriptions.recipeId, recipeId));

    // Find all active anonymous email subscribers for this recipe (only verified subscriptions)
    const emailSubscribers = await db
      .select({
        email: emailRecipeSubscriptions.email,
        unsubscribeToken: emailRecipeSubscriptions.verificationToken,
      })
      .from(emailRecipeSubscriptions)
      .where(
        and(
          eq(emailRecipeSubscriptions.recipeId, recipeId),
          eq(emailRecipeSubscriptions.subscribed, true)
        )
      );

    // Send notification to each authenticated subscriber
    const notification: Parameters<typeof emailService.sendRecipeUpdateEmail>[1] = {
      recipeId,
      title,
      description,
      updatedFields,
    };

    let authSuccessCount = 0;
    let authFailCount = 0;

    for (const subscriber of authSubscribers) {
      const result = await emailService.sendRecipeUpdateEmail(subscriber.email, notification);
      if (result.success) {
        authSuccessCount++;
      } else {
        authFailCount++;
      }
    }

    // Send notification to each anonymous email subscriber
    let emailSuccessCount = 0;
    let emailFailCount = 0;

    for (const subscriber of emailSubscribers) {
      const result = await emailService.sendRecipeUpdateEmail(
        subscriber.email,
        notification,
        subscriber.unsubscribeToken
      );
      if (result.success) {
        emailSuccessCount++;
      } else {
        emailFailCount++;
      }
    }

    const totalNotified = authSuccessCount + emailSuccessCount;
    const totalFailed = authFailCount + emailFailCount;
    const totalSubscribers = authSubscribers.length + emailSubscribers.length;

    if (totalSubscribers === 0) {
      return {
        success: true,
        data: { notified: 0, message: '没有订阅者' },
      } satisfies ServiceResponse<{ notified: number; message: string }>;
    }

    return {
      success: true,
      data: {
        notified: totalNotified,
        failed: totalFailed,
        total: totalSubscribers,
        breakdown: {
          authenticated: { success: authSuccessCount, failed: authFailCount },
          anonymous: { success: emailSuccessCount, failed: emailFailCount },
        },
      },
    } satisfies ServiceResponse<{
      notified: number;
      failed: number;
      total: number;
      breakdown: {
        authenticated: { success: number; failed: number };
        anonymous: { success: number; failed: number };
      };
    }>;
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
