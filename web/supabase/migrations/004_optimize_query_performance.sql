-- =============================================================================
-- Migration: 004_optimize_query_performance
-- Description: Add missing indexes for query performance optimization
-- Author: Hephaestus
-- Created: 2026-04-06
-- =============================================================================

-- =============================================================================
-- SECTION 1: Recipes table indexes
-- =============================================================================

-- Index for category filtering (commonly used in recipe lists)
CREATE INDEX IF NOT EXISTS idx_recipes_category ON recipes(category);

-- Index for cuisine filtering
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine ON recipes(cuisine);

-- Index for difficulty filtering
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON recipes(difficulty);

-- Index for author filtering (important for user-specific recipe views)
CREATE INDEX IF NOT EXISTS idx_recipes_author_id ON recipes(author_id);

-- Index for sorting by creation date (used in list queries with ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);

-- Composite index for common filter + sort pattern (category + created_at)
CREATE INDEX IF NOT EXISTS idx_recipes_category_created ON recipes(category, created_at DESC);

-- Composite index for cuisine + created_at
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine_created ON recipes(cuisine, created_at DESC);

-- Index for title search optimization (ilike queries)
CREATE INDEX IF NOT EXISTS idx_recipes_title_trgm ON recipes(title) WHERE title IS NOT NULL;

-- Index for description search optimization (ilike queries)
CREATE INDEX IF NOT EXISTS idx_recipes_description_trgm ON recipes(description) WHERE description IS NOT NULL;

-- =============================================================================
-- SECTION 2: Recipe ingredients indexes
-- =============================================================================

-- Index for ingredient name searches (ilike queries in search API)
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_name_trgm ON recipe_ingredients(name) WHERE name IS NOT NULL;

-- Index for recipe_id lookups (used in JOINs and fetching ingredients for a recipe)
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);

-- =============================================================================
-- SECTION 3: Recipe steps indexes
-- =============================================================================

-- Index for recipe_id lookups (used in fetching steps for a recipe)
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);

-- =============================================================================
-- SECTION 4: Recipe tags indexes
-- =============================================================================

-- Index for tag name searches (ilike queries)
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag_trgm ON recipe_tags(tag) WHERE tag IS NOT NULL;

-- Index for recipe_id lookups (used in fetching tags for a recipe)
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);

-- =============================================================================
-- SECTION 5: Recipe ratings indexes
-- =============================================================================

-- Index for recipe_id lookups (used in GROUP BY aggregations for rating calculations)
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id);

-- Index for user_id lookups (used when checking if a user has rated a recipe)
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user_id ON recipe_ratings(user_id);

-- =============================================================================
-- SECTION 6: Recipe translations indexes
-- =============================================================================

-- Index for recipe_id lookups (used in fetching translations for a recipe)
CREATE INDEX IF NOT EXISTS idx_recipe_translations_recipe_id ON recipe_translations(recipe_id);

-- Index for locale filtering (used when querying translations for a specific locale)
CREATE INDEX IF NOT EXISTS idx_recipe_translations_locale ON recipe_translations(locale);

-- Composite index for common query pattern (locale-specific translations)
CREATE INDEX IF NOT EXISTS idx_recipe_translations_recipe_locale ON recipe_translations(recipe_id, locale);

-- =============================================================================
-- SECTION 7: Recipe reminders indexes (already exist in 003, adding missing ones)
-- =============================================================================

-- Composite index for user + reminder_time (common query for user-specific scheduled reminders)
CREATE INDEX IF NOT EXISTS idx_recipe_reminders_user_reminder ON recipe_reminders(user_id, reminder_time);

-- Index for finding unnotified reminders (background job processing)
CREATE INDEX IF NOT EXISTS idx_recipe_reminders_notified ON recipe_reminders(notified) WHERE notified = false;

-- =============================================================================
-- SECTION 8: Favorites indexes (already exist in 001, confirming coverage)
-- =============================================================================

-- Note: idx_favorites_user_id and idx_favorites_recipe_id already exist in 001

-- =============================================================================
-- SECTION 9: Favorite folders indexes
-- =============================================================================

-- Index for user_id lookups (used when fetching a user's folders)
CREATE INDEX IF NOT EXISTS idx_favorite_folders_user_id ON favorite_folders(user_id);

-- =============================================================================
-- SECTION 10: Recipe subscriptions indexes
-- =============================================================================

-- Index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_recipe_subscriptions_user_id ON recipe_subscriptions(user_id);

-- Index for recipe_id lookups
CREATE INDEX IF NOT EXISTS idx_recipe_subscriptions_recipe_id ON recipe_subscriptions(recipe_id);

-- =============================================================================
-- Verification query (run after migration to verify indexes)
-- =============================================================================
-- SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;
