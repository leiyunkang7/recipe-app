-- =============================================================================
-- Migration: 006_expression_indexes
-- Description: Add expression indexes for computed columns and JSONB operations
-- Author: Hephaestus
-- Created: 2026-04-07
-- =============================================================================

-- =============================================================================
-- SECTION 1: recipes table expression indexes
-- =============================================================================

-- Expression index for total cooking time filtering
-- Used in queries like: WHERE (prep_time_minutes + cook_time_minutes) <= 30
CREATE INDEX IF NOT EXISTS idx_recipes_total_time 
ON recipes((prep_time_minutes + cook_time_minutes));

-- Index for sorting by prep time (quickest recipes first)
CREATE INDEX IF NOT EXISTS idx_recipes_prep_time_asc 
ON recipes(prep_time_minutes ASC);

-- GIN index on nutrition_info JSONB column for nutrition-based queries
-- Used in queries like: WHERE (nutrition_info->>'calories')::numeric >= 500
CREATE INDEX IF NOT EXISTS idx_recipes_nutrition_info 
ON recipes USING gin (nutrition_info);

-- =============================================================================
-- SECTION 2: favorites table composite index
-- =============================================================================

-- Composite index for user + recipe lookups (common pattern in favorite operations)
-- Used in queries like: WHERE user_id = ? AND recipe_id = ?
CREATE INDEX IF NOT EXISTS idx_favorites_user_recipe 
ON favorites(user_id, recipe_id);

-- =============================================================================
-- SECTION 3: Enable required extensions
-- =============================================================================

-- Ensure pg_trgm is enabled for trigram indexes (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Ensure btree_gin is enabled for JSONB indexing (if not already enabled)  
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- =============================================================================
-- Verification query (run after migration to verify indexes)
-- =============================================================================
-- SELECT indexname, tablename, indexdef 
-- FROM pg_indexes 
-- WHERE schemaname = 'public' 
-- AND indexname LIKE 'idx_%' 
-- ORDER BY tablename, indexname;
