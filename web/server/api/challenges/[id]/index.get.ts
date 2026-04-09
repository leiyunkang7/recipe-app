/**
 * Get Cooking Challenge Details API Endpoint
 *
 * GET /api/challenges/[id]
 */

import { defineEventHandler } from 'h3';
import { eq, count } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { cookingChallenges, cookingChallengeParticipants, users, recipes, cookingGroups } from '@recipe-app/database';
import { successResponse, errorResponse } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  const user = (event.context as { user?: { id: string } })?.user;
  const challengeId = event.context.params?.id;

  if (!challengeId) {
    return errorResponse('INVALID_PARAMS', '缺少挑战赛ID');
  }

  const db = useDb();

  try {
    const [challenge] = await db
      .select()
      .from(cookingChallenges)
      .where(eq(cookingChallenges.id, challengeId));

    if (!challenge) {
      return errorResponse('NOT_FOUND', '挑战赛不存在');
    }

    // Get group info
    const [group] = await db
      .select({
        id: cookingGroups.id,
        name: cookingGroups.name,
        imageUrl: cookingGroups.imageUrl,
      })
      .from(cookingGroups)
      .where(eq(cookingGroups.id, challenge.groupId));

    // Get participant count
    const [participantCountResult] = await db
      .select({ count: count() })
      .from(cookingChallengeParticipants)
      .where(eq(cookingChallengeParticipants.challengeId, challengeId));

    // Get recent participants
    const participants = await db
      .select({
        id: cookingChallengeParticipants.id,
        userId: cookingChallengeParticipants.userId,
        recipeId: cookingChallengeParticipants.recipeId,
        submittedAt: cookingChallengeParticipants.submittedAt,
        score: cookingChallengeParticipants.score,
      })
      .from(cookingChallengeParticipants)
      .where(eq(cookingChallengeParticipants.challengeId, challengeId))
      .limit(10);

    // Get user and recipe info for participants
    const participantsWithDetails = await Promise.all(
      participants.map(async (p) => {
        const [userInfo] = await db
          .select({
            id: users.id,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(eq(users.id, p.userId));

        let recipeInfo = null;
        if (p.recipeId) {
          const [recipe] = await db
            .select({
              id: recipes.id,
              title: recipes.title,
              imageUrl: recipes.imageUrl,
            })
            .from(recipes)
            .where(eq(recipes.id, p.recipeId));
          recipeInfo = recipe;
        }

        return {
          ...p,
          user: userInfo,
          recipe: recipeInfo,
        };
      })
    );

    // Check if current user is participating
    let currentUserParticipation = null;
    if (user?.id) {
      const [participation] = await db
        .select()
        .from(cookingChallengeParticipants)
        .where(eq(cookingChallengeParticipants.challengeId, challengeId))
        .where(eq(cookingChallengeParticipants.userId, user.id));
      currentUserParticipation = participation;
    }

    return successResponse({
      ...challenge,
      group,
      participantCount: participantCountResult?.count ?? 0,
      participants: participantsWithDetails,
      currentUserParticipation,
    });
  } catch (error) {
    console.error('[get-challenge] Error:', error);
    return errorResponse('FETCH_ERROR', '获取挑战赛详情失败');
  }
});
