import { defineEventHandler, getQuery } from 'h3';
import { useDb } from '../../utils/db';
import { categories, categoryTranslations } from '@recipe-app/database';
import { eq, and } from 'drizzle-orm';
import { apiResponse } from '../../utils/apiVersion';

/**
 * GET /api/v1/categories
 *
 * Returns a list of all categories with optional locale filtering.
 * If locale is provided, returns translated category names.
 */
export default defineEventHandler(async (event) => {
  const db = useDb();
  const query = getQuery(event);
  const locale = query.locale as string || 'zh';

  // Get all categories
  const categoryRows = await db.select().from(categories);

  if (!categoryRows || categoryRows.length === 0) {
    return apiResponse({ categories: [] });
  }

  // Get translations for the requested locale
  const categoryIds = categoryRows.map(c => c.id);
  const translations = await db
    .select()
    .from(categoryTranslations)
    .where(
      and(
        eq(categoryTranslations.locale, locale),
      )
    );

  // Create a map of category ID to translation
  const translationMap = new Map(
    translations.map(t => [t.categoryId, t.name])
  );

  // Combine categories with translations
  const result = categoryRows.map(category => ({
    id: category.id,
    name: category.name,
    translatedName: translationMap.get(category.id) || category.name,
  }));

  return apiResponse({ categories: result });
});
