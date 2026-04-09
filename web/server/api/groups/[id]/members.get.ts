/**
 * List Cooking Group Members API Endpoint
 *
 * GET /api/groups/[id]/members
 */

import { defineEventHandler, getQuery } from 'h3';
import { eq, desc } from 'drizzle-orm';
import { useDb } from '../../../utils/db';
import { cookingGroupMembers, users } from '@recipe-app/database';
import { successResponse, errorResponse } from '@recipe-app/shared-types';
import { z } from 'zod';

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

export default defineEventHandler(async (event) => {
  const groupId = event.context.params?.id;

  if (!groupId) {
    return errorResponse('INVALID_PARAMS', '缺少小组ID');
  }

  const query = getQuery(event);
  const parsedQuery = QuerySchema.parse(query);

  const db = useDb();
  const offset = (parsedQuery.page - 1) * parsedQuery.limit;

  try {
    const membersResult = await db
      .select({
        id: cookingGroupMembers.id,
        groupId: cookingGroupMembers.groupId,
        userId: cookingGroupMembers.userId,
        role: cookingGroupMembers.role,
        joinedAt: cookingGroupMembers.joinedAt,
      })
      .from(cookingGroupMembers)
      .where(eq(cookingGroupMembers.groupId, groupId))
      .orderBy(desc(cookingGroupMembers.joinedAt))
      .limit(parsedQuery.limit)
      .offset(offset);

    // Get user info for each member
    const membersWithUsers = await Promise.all(
      membersResult.map(async (member) => {
        const [userInfo] = await db
          .select({
            id: users.id,
            displayName: users.displayName,
            avatarUrl: users.avatarUrl,
          })
          .from(users)
          .where(eq(users.id, member.userId));
        return {
          ...member,
          user: userInfo,
        };
      })
    );

    return successResponse({
      members: membersWithUsers,
      pagination: {
        page: parsedQuery.page,
        limit: parsedQuery.limit,
      },
    });
  } catch (error) {
    console.error('[list-group-members] Error:', error);
    return errorResponse('FETCH_ERROR', '获取小组成员列表失败');
  }
});
