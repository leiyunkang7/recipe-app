/**
 * Update Cooking Group API Endpoint
 *
 * PATCH /api/groups/[id]
 */

import { defineEventHandler, readBody } from 'h3';
import { eq } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { cookingGroups, cookingGroupMembers } from '@recipe-app/database';
import { UpdateCookingGroupDTO, successResponse } from '@recipe-app/shared-types';
import { z } from 'zod';

const UpdateGroupSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isPublic: z.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const user = (event.context as { user?: { id: string } })?.user;
  if (!user?.id) {
    return errorResponse('UNAUTHORIZED', '请先登录');
  }

  const groupId = event.context.params?.id;
  if (!groupId) {
    return errorResponse('INVALID_PARAMS', '缺少小组ID');
  }

  const body = await readBody(event);
  const parsedBody = UpdateGroupSchema.parse(body);

  const db = useDb();

  try {
    // Check if user is owner or admin
    const [membership] = await db
      .select()
      .from(cookingGroupMembers)
      .where(eq(cookingGroupMembers.groupId, groupId))
      .where(eq(cookingGroupMembers.userId, user.id));

    if (!membership || !['owner', 'admin'].includes(membership.role)) {
      return errorResponse('FORBIDDEN', '只有小组管理员可以修改小组信息');
    }

    const [updatedGroup] = await db
      .update(cookingGroups)
      .set({
        ...parsedBody,
        updatedAt: new Date(),
      })
      .where(eq(cookingGroups.id, groupId))
      .returning();

    return successResponse(updatedGroup);
  } catch (error) {
    console.error('[update-group] Error:', error);
    if (error instanceof z.ZodError) {
      return errorResponse('VALIDATION_ERROR', '输入数据验证失败', error.errors);
    }
    return errorResponse('UPDATE_ERROR', '更新小组失败');
  }
});
