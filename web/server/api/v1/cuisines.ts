import { defineEventHandler, getQuery } from 'h3';
import { useDb } from '../../utils/db';
import { cuisines, cuisineTranslations } from '@recipe-app/database';
import { eq, and } from 'drizzle-orm';
import { apiResponse } from '../../utils/apiVersion';

/**
 * GET /api/v1/cuisines
 *
 * Returns a list of all cuisines with optional locale filtering.
 * If locale is provided, returns translated cuisine names.
 */
export default defineEventHandler(async (event) => {
  const db = useDb();
  const query = getQuery(event);
  const locale = query.locale as string || 'zh';

  // Get all cuisines
  const cuisineRows = await db.select().from(cuisines);

  if (!cuisineRows || cuisineRows.length === 0) {
    return apiResponse({ cuisines: [] });
  }

  // Get translations for the requested locale
  const cuisineIds = cuisineRows.map(c => c.id);
  const translations = await db
    .select()
    .from(cuisineTranslations)
    .where(
      and(
        eq(cuisineTranslations.locale, locale),
      )
    );

  // Create a map of cuisine ID to translation
  const translationMap = new Map(
    translations.map(t => [t.cuisineId, t.name])
  );

  // Combine cuisines with translations
  const result = cuisineRows.map(cuisine => ({
    id: cuisine.id,
    name: cuisine.name,
    region: cuisine.region,
    translatedName: translationMap.get(cuisine.id) || cuisine.name,
  }));

  return apiResponse({ cuisines: result });
});
