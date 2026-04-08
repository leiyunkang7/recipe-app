-- =============================================================================
-- Migration: 008_composite_covering_indexes
-- Description: Add composite and covering indexes for common query patterns
-- Author: Hephaestus
-- Created: 2026-04-07
-- =============================================================================

-- =============================================================================
-- SECTION 1: recipes table composite indexes for common filter + sort patterns
-- =============================================================================

-- Composite index for difficulty + created_at (common filter + sort pattern)
-- Used in queries like: WHERE difficulty = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty_created
ON recipes(difficulty, created_at DESC);

-- Composite index for author_id + created_at (user's recipes sorted by newest)
-- Used in queries like: WHERE author_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_recipes_author_created
ON recipes(author_id, created_at DESC);

-- Composite index for category + difficulty + created_at (multi-filter pattern)
-- Used in queries like: WHERE category = ? AND difficulty = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_recipes_category_difficulty_created
ON recipes(category, difficulty, created_at DESC);

-- Index on views for popularity-based sorting
-- Used in queries like: ORDER BY views DESC
CREATE INDEX IF NOT EXISTS idx_recipes_views_desc
ON recipes(views DESC);

-- Composite index for cuisine + difficulty + created_at
-- Used in queries like: WHERE cuisine = ? AND difficulty = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_recipes_cuisine_difficulty_created
ON recipes(cuisine, difficulty, created_at DESC);

-- =============================================================================
-- SECTION 2: recipe_ingredients covering index
-- =============================================================================

-- Covering index for ingredient queries by recipe
-- Includes all columns needed: recipe_id, name, amount, unit
-- Allows index-only scan for: SELECT name, amount, unit FROM recipe_ingredients WHERE recipe_id = ?
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id_covering
ON recipe_ingredients(recipe_id)
INCLUDE (name, amount, unit);

-- =============================================================================
-- SECTION 3: recipe_steps covering index
-- =============================================================================

-- Covering index for step queries by recipe
-- Includes all columns needed: recipe_id, step_number, instruction, duration_minutes
-- Allows index-only scan for: SELECT step_number, instruction, duration_minutes FROM recipe_steps WHERE recipe_id = ?
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_id_covering
ON recipe_steps(recipe_id)
INCLUDE (step_number, instruction, duration_minutes);

-- =============================================================================
-- SECTION 4: recipe_tags covering index
-- =============================================================================

-- Covering index for tag queries by recipe
-- Includes all columns needed: recipe_id, tag
-- Allows index-only scan for: SELECT tag FROM recipe_tags WHERE recipe_id = ?
CREATE INDEX IF NOT EXISTS idx_recipe_tags_recipe_id_covering
ON recipe_tags(recipe_id)
INCLUDE (tag);

-- =============================================================================
-- SECTION 5: recipe_ratings indexes for aggregation queries
-- =============================================================================

-- Composite index for rating aggregation (recipe_id + score)
-- Used in queries like: SELECT recipe_id, AVG(score), COUNT(*) FROM recipe_ratings GROUP BY recipe_id
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_score
ON recipe_ratings(recipe_id, score);

-- Composite index for users rating check (recipe_id + user_id)
-- Used in queries like: SELECT * FROM recipe_ratings WHERE recipe_id = ? AND user_id = ?
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_user
ON recipe_ratings(recipe_id, user_id);

-- =============================================================================
-- SECTION 6: notifications optimized index
-- =============================================================================

-- Composite index for users notification list with time ordering
-- Used in queries like: SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_notifications_user_created
ON notifications(user_id, created_at DESC);

-- =============================================================================
-- SECTION 7: recipe_translations covering index
-- =============================================================================

-- Covering index for translation queries by recipe
-- Includes all columns needed: recipe_id, locale, title, description
-- Allows index-only scan for: SELECT locale, title, description FROM recipe_translations WHERE recipe_id = ?
CREATE INDEX IF NOT EXISTS idx_recipe_translations_recipe_id_covering
ON recipe_translations(recipe_id)
INCLUDE (locale, title, description);

-- =============================================================================
-- SECTION 8: favorites optimized index
-- =============================================================================

-- Composite index for users favorites with time ordering
-- Used in queries like: SELECT * FROM favorites WHERE user_id = ? ORDER BY created_at DESC
CREATE INDEX IF NOT EXISTS idx_favorites_user_created
ON favorites(user_id, created_at DESC);

-- =============================================================================
-- Verification query (run after migration to verify indexes)
-- =============================================================================
-- SELECT indexname, tablename, indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;

-- Expected total after this migration: 31 (previous) + 14 (new) = 45+ indexes
