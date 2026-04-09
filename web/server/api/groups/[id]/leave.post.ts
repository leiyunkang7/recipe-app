/**
 * Leave Cooking Group API Endpoint
 *
 * POST /api/groups/[id]/leave
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
    // Check if user is a member
    const [membership] = await db
      .select()
      .from(cookingGroupMembers)
      .where(eq(cookingGroupMembers.groupId, groupId))
      .where(eq(cookingGroupMembers.userId, user.id));

    if (!membership) {
      return errorResponse('NOT_MEMBER', '您不是小组成员');
    }

    // Owner cannot leave, must delete or transfer ownership
    if (membership.role === 'owner') {
      return errorResponse('FORBIDDEN', '小组创建者不能离开小组，请先转让所有权或删除小组');
    }

    await db
      .delete(cookingGroupMembers)
      .where(eq(cookingGroupMembers.id, membership.id));

    return successResponse({ left: true });
  } catch (error) {
    console.error('[leave-group] Error:', error);
    return errorResponse('LEAVE_ERROR', '离开小组失败');
  }
});
