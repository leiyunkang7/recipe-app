/**
 * Database Index Definitions for Query Optimization
 */

import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

export const INDEX_DEFINITIONS = {
  recipes: [
    { name: 'idx_recipes_category', definition: 'CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category)', description: 'Filter by category' },
    { name: 'idx_recipes_cuisine', definition: 'CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine)', description: 'Filter by cuisine' },
    { name: 'idx_recipes_difficulty', definition: 'CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty)', description: 'Filter by difficulty' },
    { name: 'idx_recipes_created_at', definition: 'CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC)', description: 'Sort by date' },
    { name: 'idx_recipes_views', definition: 'CREATE INDEX IF NOT EXISTS idx_recipes_views ON recipes(views DESC)', description: 'Sort by popularity' },
    { name: 'idx_recipes_cooking_count', definition: 'CREATE INDEX IF NOT EXISTS idx_recipes_cooking_count ON recipes(cooking_count DESC)', description: 'Trending recipes' },
    { name: 'idx_recipes_prep_time', definition: 'CREATE INDEX IF NOT EXISTS idx_recipes_prep_time ON recipes(prep_time_minutes)', description: 'Filter by prep time' },
    { name: 'idx_recipes_category_cuisine', definition: 'CREATE INDEX IF NOT EXISTS idx_recipes_category_cuisine ON recipes(category, cuisine)', description: 'Combined filter' },
    { name: 'idx_recipes_author_id', definition: 'CREATE INDEX IF NOT EXISTS idx_recipes_author_id ON recipes(author_id)', description: 'Filter by author' },
  ],
  recipe_ingredients: [
    { name: 'idx_recipe_ingredients_recipe_id', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id)', description: 'Join to recipe' },
    { name: 'idx_recipe_ingredients_name', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_name ON recipe_ingredients(name)', description: 'Search by name' },
  ],
  recipe_steps: [
    { name: 'idx_recipe_steps_recipe_id', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_id ON recipe_steps(recipe_id)', description: 'Join to recipe' },
    { name: 'idx_recipe_steps_recipe_number', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_number ON recipe_steps(recipe_id, step_number)', description: 'Order steps' },
  ],
  recipe_tags: [
    { name: 'idx_recipe_tags_recipe_id', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_id ON recipe_tags(recipe_id)', description: 'Join to recipe' },
    { name: 'idx_recipe_tags_tag', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag ON recipe_tags(tag)', description: 'Filter by tag' },
    { name: 'idx_recipe_tags_tag_recipe', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag_recipe ON recipe_tags(tag, recipe_id)', description: 'Tag lookup' },
  ],
  recipe_translations: [
    { name: 'idx_recipe_translations_recipe_id', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_translations_recipe_id ON recipe_translations(recipe_id)', description: 'Join translations' },
    { name: 'idx_recipe_translations_locale', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_translations_locale ON recipe_translations(locale)', description: 'Filter by locale' },
    { name: 'idx_recipe_translations_recipe_locale', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_translations_recipe_locale ON recipe_translations(recipe_id, locale)', description: 'Unique lookup' },
  ],
  ingredient_translations: [
    { name: 'idx_ingredient_translations_ingredient_id', definition: 'CREATE INDEX IF NOT EXISTS idx_ingredient_translations_ingredient_id ON ingredient_translations(ingredient_id)', description: 'Join translations' },
    { name: 'idx_ingredient_translations_locale', definition: 'CREATE INDEX IF NOT EXISTS idx_ingredient_translations_locale ON ingredient_translations(locale)', description: 'Filter by locale' },
  ],
  step_translations: [
    { name: 'idx_step_translations_step_id', definition: 'CREATE INDEX IF NOT EXISTS idx_step_translations_step_id ON step_translations(step_id)', description: 'Join translations' },
    { name: 'idx_step_translations_locale', definition: 'CREATE INDEX IF NOT EXISTS idx_step_translations_locale ON step_translations(locale)', description: 'Filter by locale' },
  ],
  favorites: [
    { name: 'idx_favorites_user_id', definition: 'CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id)', description: 'User favorites' },
    { name: 'idx_favorites_recipe_id', definition: 'CREATE INDEX IF NOT EXISTS idx_favorites_recipe_id ON favorites(recipe_id)', description: 'Favorite count' },
    { name: 'idx_favorites_user_recipe', definition: 'CREATE INDEX IF NOT EXISTS idx_favorites_user_recipe ON favorites(user_id, recipe_id)', description: 'Check favorite' },
    { name: 'idx_favorites_folder_id', definition: 'CREATE INDEX IF NOT EXISTS idx_favorites_folder_id ON favorites(folder_id)', description: 'Folder contents' },
  ],
  recipe_ratings: [
    { name: 'idx_recipe_ratings_recipe_id', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id)', description: 'Recipe ratings' },
    { name: 'idx_recipe_ratings_user_id', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user_id ON recipe_ratings(user_id)', description: 'User ratings' },
    { name: 'idx_recipe_ratings_recipe_user', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_user ON recipe_ratings(recipe_id, user_id)', description: 'Check rating' },
  ],
  recipe_reviews: [
    { name: 'idx_recipe_reviews_recipe_id', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_reviews_recipe_id ON recipe_reviews(recipe_id)', description: 'Recipe reviews' },
    { name: 'idx_recipe_reviews_user_id', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_reviews_user_id ON recipe_reviews(user_id)', description: 'User reviews' },
    { name: 'idx_recipe_reviews_created_at', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_reviews_created_at ON recipe_reviews(created_at DESC)', description: 'Sort by date' },
  ],
  category_translations: [
    { name: 'idx_category_translations_category_id', definition: 'CREATE INDEX IF NOT EXISTS idx_category_translations_category_id ON category_translations(category_id)', description: 'Join translations' },
    { name: 'idx_category_translations_locale', definition: 'CREATE INDEX IF NOT EXISTS idx_category_translations_locale ON category_translations(locale)', description: 'Filter by locale' },
  ],
  cuisine_translations: [
    { name: 'idx_cuisine_translations_cuisine_id', definition: 'CREATE INDEX IF NOT EXISTS idx_cuisine_translations_cuisine_id ON cuisine_translations(cuisine_id)', description: 'Join translations' },
    { name: 'idx_cuisine_translations_locale', definition: 'CREATE INDEX IF NOT EXISTS idx_cuisine_translations_locale ON cuisine_translations(locale)', description: 'Filter by locale' },
  ],
  cooking_groups: [
    { name: 'idx_cooking_groups_creator_id', definition: 'CREATE INDEX IF NOT EXISTS idx_cooking_groups_creator_id ON cooking_groups(creator_id) WHERE creator_id IS NOT NULL', description: 'Creator lookup' },
    { name: 'idx_cooking_groups_name_fts', definition: 'CREATE INDEX IF NOT EXISTS idx_cooking_groups_name_fts ON cooking_groups USING gin(name gin_trgm_ops)', description: 'Name search (GIN trgm)' },
    { name: 'idx_cooking_groups_description_fts', definition: 'CREATE INDEX IF NOT EXISTS idx_cooking_groups_description_fts ON cooking_groups USING gin(description gin_trgm_ops)', description: 'Description search (GIN trgm)' },
  ],
  cooking_group_members: [
    { name: 'idx_cooking_group_members_user_id', definition: 'CREATE INDEX IF NOT EXISTS idx_cooking_group_members_user_id ON cooking_group_members(user_id)', description: 'User group membership lookup' },
  ],
  recipe_subscriptions: [
    { name: 'idx_recipe_subscriptions_user_id', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_subscriptions_user_id ON recipe_subscriptions(user_id)', description: 'User subscriptions lookup' },
    { name: 'idx_recipe_subscriptions_recipe_id', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_subscriptions_recipe_id ON recipe_subscriptions(recipe_id)', description: 'Recipe subscribers lookup' },
    { name: 'idx_recipe_subscriptions_user_recipe', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_subscriptions_user_recipe ON recipe_subscriptions(user_id, recipe_id)', description: 'Check subscription' },
  ],
  category_subscriptions: [
    { name: 'idx_category_subscriptions_user_id', definition: 'CREATE INDEX IF NOT EXISTS idx_category_subscriptions_user_id ON category_subscriptions(user_id)', description: 'User category subscriptions' },
    { name: 'idx_category_subscriptions_category', definition: 'CREATE INDEX IF NOT EXISTS idx_category_subscriptions_category ON category_subscriptions(category)', description: 'Category subscription lookup' },
  ],
  author_subscriptions: [
    { name: 'idx_author_subscriptions_user_id', definition: 'CREATE INDEX IF NOT EXISTS idx_author_subscriptions_user_id ON author_subscriptions(user_id)', description: 'User author subscriptions' },
    { name: 'idx_author_subscriptions_author_name', definition: 'CREATE INDEX IF NOT EXISTS idx_author_subscriptions_author_name ON author_subscriptions(author_name)', description: 'Author subscription lookup' },
  ],
  email_recipe_subscriptions: [
    { name: 'idx_email_recipe_subscriptions_email', definition: 'CREATE INDEX IF NOT EXISTS idx_email_recipe_subscriptions_email ON email_recipe_subscriptions(email)', description: 'Email lookup for unsubscribe' },
  ],
  recipe_tips: [
    { name: 'idx_recipe_tips_recipe_id', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_tips_recipe_id ON recipe_tips(recipe_id)', description: 'Recipe tips lookup' },
  ],
  recipe_reviews_ext: [
    { name: 'idx_recipe_reviews_recipe_created', definition: 'CREATE INDEX IF NOT EXISTS idx_recipe_reviews_recipe_created ON recipe_reviews(recipe_id, created_at DESC)', description: 'Recipe reviews pagination' },
  ],
  notifications_ext: [
    { name: 'idx_notifications_user_read_created', definition: 'CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, read, created_at DESC)', description: 'User notifications with read status' },
  ],
} as const;

export async function applyAllIndexes(db: NodePgDatabase<any>) {
  const applied: string[] = [];
  const errors: { index: string; error: string }[] = [];
  for (const tableIndexes of Object.values(INDEX_DEFINITIONS)) {
    for (const index of tableIndexes) {
      try {
        await db.execute(sql.raw(index.definition));
        applied.push(index.name);
      } catch (error) {
        errors.push({ index: index.name, error: error instanceof Error ? error.message : String(error) });
      }
    }
  }
  return { applied, errors };
}

export async function dropAllCustomIndexes(db: NodePgDatabase<any>) {
  const dropped: string[] = [];
  const errors: { index: string; error: string }[] = [];
  for (const tableIndexes of Object.values(INDEX_DEFINITIONS)) {
    for (const index of tableIndexes) {
      try {
        await db.execute(sql.raw(`DROP INDEX IF EXISTS ${index.name}`));
        dropped.push(index.name);
      } catch (error) {
        errors.push({ index: index.name, error: error instanceof Error ? error.message : String(error) });
      }
    }
  }
  return { dropped, errors };
}

export async function getIndexStatus(db: NodePgDatabase<any>): Promise<Record<string, boolean>> {
  const result = await db.execute(sql`SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`);
  const existingIndexes = new Set(result.rows.map((row: any) => row.indexname));
  const status: Record<string, boolean> = {};
  for (const tableIndexes of Object.values(INDEX_DEFINITIONS)) {
    for (const index of tableIndexes) {
      status[index.name] = existingIndexes.has(index.name);
    }
  }
  return status;
}
