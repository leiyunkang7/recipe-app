import { defineEventHandler } from 'h3';
import { useDb } from '../utils/db';
import { recipes } from '@recipe-app/database';
import { sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  const db = useDb();

  const rows = await db
    .selectDistinct({ name: recipes.category })
    .from(recipes)
    .where(sql`${recipes.category} IS NOT NULL`)
    .limit(100);

  const categories = rows.map((r, index) => ({
    id: index + 1,
    name: r.name,
    displayName: r.name,
  }));

  return { data: categories };
});
