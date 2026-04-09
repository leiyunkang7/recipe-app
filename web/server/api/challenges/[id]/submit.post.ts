/**
 * Submit Recipe to Cooking Challenge API Endpoint
 *
 * POST /api/challenges/[id]/submit
 */

import { defineEventHandler, readBody } from 'h3';
import { eq } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { cookingChallenges, cookingChallengeParticipants, recipes, cookingGroupMembers } from '@recipe-app/database';
import { successResponse, errorResponse } from '@recipe-app/shared-types';
import { z } from 'zod';

const SubmitSchema = z.object({
  recipeId: z.string().uuid('Invalid recipe ID'),
});

export default defineEventHandler(async (event) => {
  const user = (event.context as { user?: { id: string } })?.user;
  if (!user?.id) {
    return errorResponse('UNAUTHORIZED', '请先登录');
  }

  const challengeId = event.context.params?.id;
  if (!challengeId) {
    return errorResponse('INVALID_PARAMS', '缺少挑战赛ID');
  }

  const body = await readBody(event);
  const parsedBody = SubmitSchema.parse(body);

  const db = useDb();

  try {
    // Get challenge
    const [challenge] = await db
      .select()
      .from(cookingChallenges)
      .where(eq(cookingChallenges.id, challengeId));

    if (!challenge) {
      return errorResponse('NOT_FOUND', '挑战赛不存在');
    }

    if (challenge.status !== 'active') {
      return errorResponse('FORBIDDEN', '挑战赛未开始或已结束');
    }

    // Check if user is a member of the group
    const [membership] = await db
      .select()
      .from(cookingGroupMembers)
      .where(eq(cookingGroupMembers.groupId, challenge.groupId))
      .where(eq(cookingGroupMembers.userId, user.id));

    if (!membership) {
      return errorResponse('FORBIDDEN', '您不是小组成员，无法提交作品');
    }

    // Get recipe
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, parsedBody.recipeId));

    if (!recipe) {
      return errorResponse('NOT_FOUND', '菜谱不存在');
    }

    // Check if already participating
    const [existingParticipation] = await db
      .select()
      .from(cookingChallengeParticipants)
      .where(eq(cookingChallengeParticipants.challengeId, challengeId))
      .where(eq(cookingChallengeParticipants.userId, user.id));

    if (!existingParticipation) {
      return errorResponse('NOT_PARTICIPATING', '您尚未报名参加该挑战赛');
    }

    // Update with recipe submission
    const [updatedParticipation] = await db
      .update(cookingChallengeParticipants)
      .set({
        recipeId: parsedBody.recipeId,
        submittedAt: new Date(),
      })
      .where(eq(cookingChallengeParticipants.id, existingParticipation.id))
      .returning();

    return successResponse(updatedParticipation);
  } catch (error) {
    console.error('[submit-to-challenge] Error:', error);
    if (error instanceof z.ZodError) {
      return errorResponse('VALIDATION_ERROR', '输入数据验证失败', error.errors);
    }
    return errorResponse('SUBMIT_ERROR', '提交作品失败');
  }
});
