import { defineEventHandler, getQuery, readBody, createError, type H2Event } from 'h3';
import { eq, ilike, or, and, desc, count, sql, avg } from 'drizzle-orm';
import { useDb, } from '../../utils/db';
import { mockRecipes, shouldUseMockData } from '../../utils/mockData';
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeTags,
  recipeTranslations,
  recipeRatings,
} from '@recipe-app/database';

type RecipeRow = typeof recipes.$inferSelect;
type IngredientRow = typeof recipeIngredients.$inferSelect;
type StepRow = typeof recipeSteps.$inferSelect;
type TagRow = typeof recipeTags.$inferSelect;
type TranslationRow = typeof recipeTranslations.$inferSelect;

interface IngredientInput {
  name: string;
  amount: number | string;
  unit: string;
}

interface StepInput {
  step_number: number;
  instruction: string;
  duration_minutes?: number | null;
}

interface TranslationInput {
  locale: string;
  title: string;
  description?: string;
}

function apiResponse<T>(data: T, meta?: Record<string, unknown>) {
  return {
    api_version: 'v1',
    data,
    ...(meta ? { meta } : {}),
  };
}

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === 'GET') {
    return apiResponse(await handleList(event));
  } else if (method === 'POST') {
    return apiResponse(await handleCreate(event));
  }

  throw createError({ statusCode: 405, message: 'Method not allowed' });
});
