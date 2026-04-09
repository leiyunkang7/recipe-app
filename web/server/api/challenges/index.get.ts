/**
 * List Cooking Challenges API Endpoint
 *
 * GET /api/challenges
 * Query params: page, limit, groupId, status, search
 */

import { defineEventHandler, getQuery } from 'h3';
import { eq, ilike, or, desc, count, sql, and, gte, lte } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { cookingChallenges, cookingGroupMembers, cookingChallengeParticipants } from '@recipe-app/database';
import { successResponse, errorResponse } from '@recipe-app/shared-types';
import { z } from 'zod';

const QuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  groupId: z.string().uuid().optional(),
  status: z.enum(['upcoming', 'active', 'completed']).optional(),
  search: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const user = (event.context as { user?: { id: string } })?.user;
  const query = getQuery(event);
  const parsedQuery = QuerySchema.parse(query);

  const db = useDb();
  const offset = (parsedQuery.page - 1) * parsedQuery.limit;

  try {
    const conditions = [];

    if (parsedQuery.groupId) {
      conditions.push(eq(cookingChallenges.groupId, parsedQuery.groupId));
    }

    if (parsedQuery.status) {
      conditions.push(eq(cookingChallenges.status, parsedQuery.status));
    }

    if (parsedQuery.search) {
      conditions.push(
        or(
          ilike(cookingChallenges.title, `%${parsedQuery.search}%`),
          ilike(cookingChallenges.description, `%${parsedQuery.search}%`)
        )
      );
    }

    const challengesResult = await db
      .select({
        id: cookingChallenges.id,
        groupId: cookingChallenges.groupId,
        title: cookingChallenges.title,
        description: cookingChallenges.description,
        rules: cookingChallenges.rules,
        startDate: cookingChallenges.startDate,
        endDate: cookingChallenges.endDate,
        status: cookingChallenges.status,
        createdBy: cookingChallenges.createdBy,
        createdAt: cookingChallenges.createdAt,
      })
      .from(cookingChallenges)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(cookingChallenges.startDate))
      .limit(parsedQuery.limit)
      .offset(offset);

    // Get participant counts
    const challengesWithCounts = await Promise.all(
      challengesResult.map(async (challenge) => {
        const [participantCountResult] = await db
          .select({ count: count() })
          .from(cookingChallengeParticipants)
          .where(eq(cookingChallengeParticipants.challengeId, challenge.id));

        return {
          ...challenge,
          participantCount: participantCountResult?.count ?? 0,
        };
      })
    );

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(cookingChallenges)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return successResponse({
      challenges: challengesWithCounts,
      pagination: {
        page: parsedQuery.page,
        limit: parsedQuery.limit,
        total: totalResult?.count ?? 0,
        totalPages: Math.ceil((totalResult?.count ?? 0) / parsedQuery.limit),
      },
    });
  } catch (error) {
    console.error('[list-challenges] Error:', error);
    return errorResponse('FETCH_ERROR', '获取挑战赛列表失败');
  }
});
