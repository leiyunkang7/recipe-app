/**
 * Delete Cooking Group API Endpoint
 *
 * DELETE /api/groups/[id]
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
    // Check if user is owner
    const [membership] = await db
      .select()
      .from(cookingGroupMembers)
      .where(eq(cookingGroupMembers.groupId, groupId))
      .where(eq(cookingGroupMembers.userId, user.id));

    if (!membership || membership.role !== 'owner') {
      return errorResponse('FORBIDDEN', '只有小组创建者可以删除小组');
    }

    await db.delete(cookingGroups).where(eq(cookingGroups.id, groupId));

    return successResponse({ deleted: true });
  } catch (error) {
    console.error('[delete-group] Error:', error);
    return errorResponse('DELETE_ERROR', '删除小组失败');
  }
});
