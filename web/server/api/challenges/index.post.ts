/**
 * Create Cooking Challenge API Endpoint
 *
 * POST /api/challenges
 */

import { defineEventHandler, readBody } from 'h3';
import { eq } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { cookingChallenges, cookingGroups, cookingGroupMembers } from '@recipe-app/database';
import { successResponse } from '@recipe-app/shared-types';
import { z } from 'zod';

const CreateChallengeSchema = z.object({
  groupId: z.string().uuid('Invalid group ID'),
  title: z.string().min(1, 'Challenge title is required').max(200),
  description: z.string().max(1000).optional(),
  rules: z.string().max(2000).optional(),
  startDate: z.string().datetime({ message: 'Invalid start date' }),
  endDate: z.string().datetime({ message: 'Invalid end date' }),
});

export default defineEventHandler(async (event) => {
  const user = (event.context as { user?: { id: string } })?.user;
  if (!user?.id) {
    return errorResponse('UNAUTHORIZED', '请先登录');
  }

  const body = await readBody(event);
  const parsedBody = CreateChallengeSchema.parse(body);

  const db = useDb();

  try {
    // Check if group exists
    const [group] = await db
      .select()
      .from(cookingGroups)
      .where(eq(cookingGroups.id, parsedBody.groupId));

    if (!group) {
      return errorResponse('NOT_FOUND', '小组不存在');
    }

    // Check if user is a member of the group
    const [membership] = await db
      .select()
      .from(cookingGroupMembers)
      .where(eq(cookingGroupMembers.groupId, parsedBody.groupId))
      .where(eq(cookingGroupMembers.userId, user.id));

    if (!membership) {
      return errorResponse('FORBIDDEN', '您不是小组成员，无法创建挑战赛');
    }

    // Validate dates
    const startDate = new Date(parsedBody.startDate);
    const endDate = new Date(parsedBody.endDate);
    if (endDate <= startDate) {
      return errorResponse('VALIDATION_ERROR', '结束时间必须晚于开始时间');
    }

    // Determine initial status
    const now = new Date();
    let status: 'upcoming' | 'active' | 'completed' = 'upcoming';
    if (now >= startDate && now <= endDate) {
      status = 'active';
    } else if (now > endDate) {
      status = 'completed';
    }

    const [challenge] = await db
      .insert(cookingChallenges)
      .values({
        groupId: parsedBody.groupId,
        title: parsedBody.title,
        description: parsedBody.description,
        rules: parsedBody.rules,
        startDate,
        endDate,
        status,
        createdBy: user.id,
      })
      .returning();

    return successResponse(challenge);
  } catch (error) {
    console.error('[create-challenge] Error:', error);
    if (error instanceof z.ZodError) {
      return errorResponse('VALIDATION_ERROR', '输入数据验证失败', error.errors);
    }
    return errorResponse('CREATE_ERROR', '创建挑战赛失败');
  }
});
