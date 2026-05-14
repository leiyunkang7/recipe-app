import { defineEventHandler, getQuery, createError } from 'h3';
import { recipeTips } from '@recipe-app/database';
import { useDb } from '../../utils/db';
import { desc, eq } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const recipeId = query.recipeId as string;

  if (!recipeId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Recipe ID is required',
    });
  }

  try {
    const db = useDb();

    // Fetch recent tips for the recipe (latest first, limit 10)
    const tips = await db
      .select({
        id: recipeTips.id,
        amount: recipeTips.amount,
        displayName: recipeTips.displayName,
        message: recipeTips.message,
        createdAt: recipeTips.createdAt,
      })
      .from(recipeTips)
      .where(eq(recipeTips.recipeId, recipeId))
      .orderBy(desc(recipeTips.createdAt))
      .limit(10);

    // Calculate total tips count and sum
    const allTips = await db
      .select({
        count: recipeTips.id,
      })
      .from(recipeTips)
      .where(eq(recipeTips.recipeId, recipeId));

    const totalTips = allTips.length;
    const totalAmount = tips.reduce((sum, tip) => sum + tip.amount, 0);

    return {
      success: true,
      data: {
        tips,
        totalTips,
        totalAmount,
      },
    };
  } catch (error) {
    console.error('Failed to fetch tips:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch tips',
    });
  }
});
