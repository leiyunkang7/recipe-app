import { defineEventHandler, readBody, createError } from 'h3';
import { z } from 'zod';
import { recipeTips } from '@recipe-app/database';
import { useDb } from '../../utils/db';

const CreateTipSchema = z.object({
  recipeId: z.string().uuid('Invalid recipe ID'),
  amount: z.number().int().positive('Amount must be positive'),
  message: z.string().max(500).optional(),
  displayName: z.string().max(100).optional(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  
  const validationResult = CreateTipSchema.safeParse(body);
  if (!validationResult.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request body',
      data: validationResult.error.issues,
    });
  }
  
  const { recipeId, amount, message, displayName } = validationResult.data;
  const userId = event.context.user?.id;
  
  try {
    const db = useDb();
    
    const [tip] = await db
      .insert(recipeTips)
      .values({
        recipeId,
        amount,
        message: message || null,
        displayName: displayName || null,
        userId: userId || null,
      })
      .returning();
    
    return {
      success: true,
      data: {
        id: tip.id,
        amount: tip.amount,
        createdAt: tip.createdAt,
      },
    };
  } catch (error) {
    console.error('Failed to create tip:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to process tip',
    });
  }
});
