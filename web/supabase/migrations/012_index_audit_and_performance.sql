-- =============================================================================
-- Migration: 012_index_audit_and_performance
-- Description: Index audit system and query performance optimizations
-- Author: Hephaestus
-- Created: 2026-04-09
-- =============================================================================

-- Query Performance Indexes
CREATE INDEX IF NOT EXISTS idx_recipes_author_id ON recipes(author_id) WHERE author_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recipes_rating_sort ON recipes(cooking_count DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_views_cooking_count ON recipes(views DESC, cooking_count DESC);

-- JSONB Path Indexes for Nutrition Queries
CREATE INDEX IF NOT EXISTS idx_recipes_nutrition_calories ON recipes((nutrition_info->>'calories')::numeric) WHERE nutrition_info IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recipes_nutrition_protein ON recipes((nutrition_info->>'protein')::numeric) WHERE nutrition_info IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recipes_nutrition_carbs ON recipes((nutrition_info->>'carbs')::numeric) WHERE nutrition_info IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_recipes_nutrition_fat ON recipes((nutrition_info->>'fat')::numeric) WHERE nutrition_info IS NOT NULL;

-- Index for Recipe Ratings Aggregation
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id_score_agg ON recipe_ratings(recipe_id, score);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_active ON recipe_ratings(recipe_id, score) WHERE score >= 3;

-- Search Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_recipes_title_description_fts ON recipes USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '')));
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_name_gin ON recipe_ingredients USING gin(name gin_trgm_ops) WHERE name IS NOT NULL;

-- Recipe Steps Optimization
CREATE INDEX IF NOT EXISTS idx_recipe_steps_recipe_step ON recipe_steps(recipe_id, step_number);

-- Notifications Optimization
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, created_at DESC) WHERE is_read = false;

-- Analyze tables
ANALYZE recipes;
ANALYZE recipe_ingredients;
ANALYZE recipe_steps;
ANALYZE recipe_tags;
ANALYZE recipe_ratings;
ANALYZE recipe_translations;
ANALYZE notifications;
ANALYZE favorites;
