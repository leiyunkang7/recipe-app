/**
 * Get Cooking Group Details API Endpoint
 *
 * GET /api/groups/[id]
 */

import { defineEventHandler } from 'h3';
import { eq, count } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { cookingGroups, cookingGroupMembers, cookingChallenges, users } from '@recipe-app/database';
import { successResponse, errorResponse } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  const user = (event.context as { user?: { id: string } })?.user;
  const groupId = event.context.params?.id;

  if (!groupId) {
    return errorResponse('INVALID_PARAMS', '缺少小组ID');
  }

  const db = useDb();

  try {
    const [group] = await db
      .select()
      .from(cookingGroups)
      .where(eq(cookingGroups.id, groupId));

    if (!group) {
      return errorResponse('NOT_FOUND', '小组不存在');
    }

    // Get member count
    const [memberCountResult] = await db
      .select({ count: count() })
      .from(cookingGroupMembers)
      .where(eq(cookingGroupMembers.groupId, groupId));

    // Get challenge count
    const [challengeCountResult] = await db
      .select({ count: count() })
      .from(cookingChallenges)
      .where(eq(cookingChallenges.groupId, groupId));

    // Get creator info if exists
    let creator = null;
    if (group.creatorId) {
      const [creatorResult] = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.id, group.creatorId));
      creator = creatorResult;
    }

    // Check if current user is a member
    let currentUserMembership = null;
    if (user?.id) {
      const [membership] = await db
        .select()
        .from(cookingGroupMembers)
        .where(eq(cookingGroupMembers.groupId, groupId))
        .where(eq(cookingGroupMembers.userId, user.id));
      currentUserMembership = membership;
    }

    return successResponse({
      ...group,
      memberCount: memberCountResult?.count ?? 0,
      challengeCount: challengeCountResult?.count ?? 0,
      creator,
      currentUserMembership,
    });
  } catch (error) {
    console.error('[get-group] Error:', error);
    return errorResponse('FETCH_ERROR', '获取小组详情失败');
  }
});
