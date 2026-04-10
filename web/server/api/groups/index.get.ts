/**
 * List Cooking Groups API Endpoint
 *
 * GET /api/groups
 * Query params: page, limit, search, isPublic
 */

import { defineEventHandler, getQuery } from 'h3';
import { eq, ilike, or, desc, count, sql } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { cookingGroups, cookingGroupMembers, cookingChallenges } from '@recipe-app/database';
import { successResponse } from '@recipe-app/shared-types';
import { z } from 'zod';

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
});

export default defineEventHandler(async (event) => {
  const _user = (event.context as { user?: { id: string } })?.user;

  const query = getQuery(event);
  const parsedQuery = QuerySchema.parse(query);

  const db = useDb();

  try {
    const offset = (parsedQuery.page - 1) * parsedQuery.limit;
    const conditions = [];

    if (parsedQuery.search) {
      conditions.push(
        or(
          ilike(cookingGroups.name, `%${parsedQuery.search}%`),
          ilike(cookingGroups.description, `%${parsedQuery.search}%`)
        )
      );
    }

    if (parsedQuery.isPublic !== undefined) {
      conditions.push(eq(cookingGroups.isPublic, parsedQuery.isPublic));
    }

    const groupsResult = await db
      .select({
        id: cookingGroups.id,
        name: cookingGroups.name,
        description: cookingGroups.description,
        creatorId: cookingGroups.creatorId,
        imageUrl: cookingGroups.imageUrl,
        isPublic: cookingGroups.isPublic,
        createdAt: cookingGroups.createdAt,
        updatedAt: cookingGroups.updatedAt,
      })
      .from(cookingGroups)
      .where(conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined)
      .orderBy(desc(cookingGroups.createdAt))
      .limit(parsedQuery.limit)
      .offset(offset);

    // Get member counts
    const groupsWithCounts = await Promise.all(
      groupsResult.map(async (group) => {
        const [memberCountResult] = await db
          .select({ count: count() })
          .from(cookingGroupMembers)
          .where(eq(cookingGroupMembers.groupId, group.id));

        const [challengeCountResult] = await db
          .select({ count: count() })
          .from(cookingChallenges)
          .where(eq(cookingChallenges.groupId, group.id));

        return {
          ...group,
          memberCount: memberCountResult?.count ?? 0,
          challengeCount: challengeCountResult?.count ?? 0,
        };
      })
    );

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(cookingGroups)
      .where(conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined);

    return successResponse({
      groups: groupsWithCounts,
      pagination: {
        page: parsedQuery.page,
        limit: parsedQuery.limit,
        total: totalResult?.count ?? 0,
        totalPages: Math.ceil((totalResult?.count ?? 0) / parsedQuery.limit),
      },
    });
  } catch (error) {
    console.error('[list-groups] Error:', error);
    return errorResponse('FETCH_ERROR', '获取小组列表失败');
  }
});
