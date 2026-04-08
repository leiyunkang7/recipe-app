/**
 * Email Subscription API Endpoint
 *
 * POST /api/subscriptions/email
 * Request body: { email: string, recipeId: string }
 * Response: { success: boolean, message?: string, error?: { code, message } }
 *
 * This endpoint allows anonymous users to subscribe to recipe update notifications via email.
 * A verification email will be sent to confirm the subscription.
 */

import { defineEventHandler, readBody } from 'h3';
import { eq, and } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { emailRecipeSubscriptions, recipes } from '@recipe-app/database';
import { SubscribeByEmailSchema, type ServiceResponse } from '@recipe-app/shared-types';
import { createEmailService } from '@recipe-app/email-service';

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  // Validate request body
  const validationResult = SubscribeByEmailSchema.safeParse(body);
  if (!validationResult.success) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: validationResult.error.errors.map((e) => e.message).join(', '),
      },
    } satisfies ServiceResponse<never>;
  }

  const { email, recipeId } = validationResult.data;
  const db = useDb();

  try {
    // Check if recipe exists
    const recipe = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, recipeId))
      .limit(1);

    if (recipe.length === 0) {
      return {
        success: false,
        error: {
          code: 'RECIPE_NOT_FOUND',
          message: '食谱不存在',
        },
      } satisfies ServiceResponse<never>;
    }

    // Check if subscription already exists
    const existingSubscription = await db
      .select()
      .from(emailRecipeSubscriptions)
      .where(
        and(
          eq(emailRecipeSubscriptions.email, email),
          eq(emailRecipeSubscriptions.recipeId, recipeId)
        )
      )
      .limit(1);

    if (existingSubscription.length > 0) {
      const existing = existingSubscription[0];
      if (existing.subscribed) {
        return {
          success: true,
          data: { message: '您已经订阅了此食谱的更新通知' },
        } satisfies ServiceResponse<{ message: string }>;
      }
      // Resend verification email for unverified subscription
      const emailService = createEmailService(db as any);
      const result = await emailService.sendSubscriptionVerificationEmail(email, {
        recipeId,
        recipeTitle: recipe[0].title,
        token: existing.verificationToken,
      });

      return {
        success: true,
        data: { message: '验证邮件已重新发送，请查收您的邮箱' },
      } satisfies ServiceResponse<{ message: string }>;
    }

    // Generate verification token
    const verificationToken = generateToken();

    // Create new subscription with unverified status
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(emailRecipeSubscriptions).values({
      email,
      recipeId,
      verificationToken,
      subscribed: false,
      expiresAt,
    });

    // Send verification email
    const emailService = createEmailService(db as any);
    const result = await emailService.sendSubscriptionVerificationEmail(email, {
      recipeId,
      recipeTitle: recipe[0].title,
      token: verificationToken,
    });

    return {
      success: true,
      data: { message: '请查收您的邮箱以确认订阅' },
    } satisfies ServiceResponse<{ message: string }>;
  } catch (error) {
    console.error('[subscribe-by-email] Error:', error);
    return {
      success: false,
      error: {
        code: 'SUBSCRIPTION_ERROR',
        message: '订阅失败，请稍后重试',
      },
    } satisfies ServiceResponse<never>;
  }
});

/**
 * Generate a secure random token
 */
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
