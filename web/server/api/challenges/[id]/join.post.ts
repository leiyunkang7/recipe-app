/**
 * Join Cooking Challenge API Endpoint
 *
 * POST /api/challenges/[id]/join
 */

import { defineEventHandler } from 'h3';
import { eq } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { cookingChallenges, cookingChallengeParticipants, cookingGroupMembers } from '@recipe-app/database';
import { successResponse, errorResponse } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  const user = (event.context as { user?: { id: string } })?.user;
  if (!user?.id) {
    return errorResponse('UNAUTHORIZED', '请先登录');
  }

  const challengeId = event.context.params?.id;
  if (!challengeId) {
    return errorResponse('INVALID_PARAMS', '缺少挑战赛ID');
  }

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

    if (challenge.status === 'completed') {
      return errorResponse('FORBIDDEN', '挑战赛已结束，无法参加');
    }

    // Check if user is a member of the group
    const [membership] = await db
      .select()
      .from(cookingGroupMembers)
      .where(eq(cookingGroupMembers.groupId, challenge.groupId))
      .where(eq(cookingGroupMembers.userId, user.id));

    if (!membership) {
      return errorResponse('FORBIDDEN', '您不是小组成员，无法参加该挑战赛');
    }

    // Check if already participating
    const [existingParticipation] = await db
      .select()
      .from(cookingChallengeParticipants)
      .where(eq(cookingChallengeParticipants.challengeId, challengeId))
      .where(eq(cookingChallengeParticipants.userId, user.id));

    if (existingParticipation) {
      return errorResponse('ALREADY_PARTICIPATING', '您已经报名参加该挑战赛');
    }

    // Join the challenge
    const [participation] = await db
      .insert(cookingChallengeParticipants)
      .values({
        challengeId,
        userId: user.id,
      })
      .returning();

    return successResponse(participation);
  } catch (error) {
    console.error('[join-challenge] Error:', error);
    return errorResponse('JOIN_ERROR', '参加挑战赛失败');
  }
});
