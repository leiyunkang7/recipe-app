import { defineEventHandler } from 'h3';
import { useDb } from '../utils/db';
import { mockCuisines, shouldUseMockData } from '../utils/mockData';
import { recipes } from '@recipe-app/database';
import { sql } from 'drizzle-orm';

export default defineEventHandler(async (_event) => {
  // Use mock data for E2E tests
  if (shouldUseMockData()) {
    return { data: mockCuisines };
  }

  const db = useDb();

  const rows = await db
    .selectDistinct({ name: recipes.cuisine })
    .from(recipes)
    .where(sql`${recipes.cuisine} IS NOT NULL`)
    .limit(100);

  const cuisines = rows.map((r: { name: string | null }, index: number) => ({
    id: index + 1,
    name: r.name,
    displayName: r.name,
  }));

  return { data: cuisines };
});
