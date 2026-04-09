/**
 * Join Cooking Group API Endpoint
 *
 * POST /api/groups/[id]/join
 */

import { defineEventHandler } from 'h3';
import { eq } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { cookingGroups, cookingGroupMembers } from '@recipe-app/database';
import { successResponse, errorResponse } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  const user = (event.context as { user?: { id: string } })?.user;
  if (!user?.id) {
    return errorResponse('UNAUTHORIZED', '请先登录');
  }

  const groupId = event.context.params?.id;
  if (!groupId) {
    return errorResponse('INVALID_PARAMS', '缺少小组ID');
  }

  const db = useDb();

  try {
    // Check if group exists and is public
    const [group] = await db
      .select()
      .from(cookingGroups)
      .where(eq(cookingGroups.id, groupId));

    if (!group) {
      return errorResponse('NOT_FOUND', '小组不存在');
    }

    if (!group.isPublic) {
      return errorResponse('FORBIDDEN', '该小组不公开，无法直接加入');
    }

    // Check if already a member
    const [existingMembership] = await db
      .select()
      .from(cookingGroupMembers)
      .where(eq(cookingGroupMembers.groupId, groupId))
      .where(eq(cookingGroupMembers.userId, user.id));

    if (existingMembership) {
      return errorResponse('ALREADY_MEMBER', '您已经是小组会员');
    }

    // Join the group
    const [membership] = await db
      .insert(cookingGroupMembers)
      .values({
        groupId,
        userId: user.id,
        role: 'member',
      })
      .returning();

    return successResponse(membership);
  } catch (error) {
    console.error('[join-group] Error:', error);
    return errorResponse('JOIN_ERROR', '加入小组失败');
  }
});
