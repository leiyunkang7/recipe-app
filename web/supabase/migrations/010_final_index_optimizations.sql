-- =============================================================================
-- Migration: 010_final_index_optimizations
-- Description: Add final index optimizations for recommendation queries
-- Author: Hephaestus
-- Created: 2026-04-09
-- =============================================================================

-- Hash index on recipe_tags.tag for equality-based lookups
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag_hash
ON recipe_tags USING hash (tag);

-- Composite index for recipe_ratings user-based queries
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user_score
ON recipe_ratings(user_id, score DESC)
WHERE score >= 4;

-- Index for recipe_tags tag-based aggregation
CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag_recipe
ON recipe_tags(tag, recipe_id);

-- Partial index for high-rated recipes (score >= 4)
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_high_score
ON recipe_ratings(recipe_id, score)
WHERE score >= 4;

-- Covering index for recipe translations title search
CREATE INDEX IF NOT EXISTS idx_recipe_translations_recipe_title
ON recipe_translations(recipe_id)
INCLUDE (title);

-- Index for notification queries by user and read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
ON notifications(user_id, created_at DESC)
WHERE is_read = false;

-- Analyze tables to update statistics
ANALYZE recipes;
ANALYZE recipe_ingredients;
ANALYZE recipe_steps;
ANALYZE recipe_tags;
ANALYZE recipe_ratings;
ANALYZE recipe_translations;
ANALYZE notifications;
ANALYZE favorites;
