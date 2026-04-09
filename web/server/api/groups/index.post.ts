/**
 * Create Cooking Group API Endpoint
 *
 * POST /api/groups
 */

import { defineEventHandler, readBody } from 'h3';
import { eq } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { cookingGroups, cookingGroupMembers } from '@recipe-app/database';
import { CreateCookingGroupDTO, successResponse, errorResponse } from '@recipe-app/shared-types';
import { z } from 'zod';

const CreateGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(100),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isPublic: z.boolean().default(true),
});

export default defineEventHandler(async (event) => {
  const user = (event.context as { user?: { id: string } })?.user;
  if (!user?.id) {
    return errorResponse('UNAUTHORIZED', '请先登录');
  }

  const body = await readBody(event);
  const parsedBody = CreateGroupSchema.parse(body);

  const db = useDb();

  try {
    // Create the group
    const [group] = await db
      .insert(cookingGroups)
      .values({
        name: parsedBody.name,
        description: parsedBody.description,
        creatorId: user.id,
        imageUrl: parsedBody.imageUrl || null,
        isPublic: parsedBody.isPublic,
      })
      .returning();

    // Add creator as owner member
    await db.insert(cookingGroupMembers).values({
      groupId: group.id,
      userId: user.id,
      role: 'owner',
    });

    return successResponse(group);
  } catch (error) {
    console.error('[create-group] Error:', error);
    if (error instanceof z.ZodError) {
      return errorResponse('VALIDATION_ERROR', '输入数据验证失败', error.errors);
    }
    return errorResponse('CREATE_ERROR', '创建小组失败');
  }
});
