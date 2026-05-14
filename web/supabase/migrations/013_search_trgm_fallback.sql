-- Migration: 013_search_trgm_fallback
-- Description: Add pg_trgm gin index on recipes.title for fuzzy fallback search
-- Author: Hephaestus (爪爪)
-- Created: 2026-05-11
-- Fix: When tsvector prefix search fails on compound Chinese words,
--       pg_trgm similarity can find matches like "国宴" -> "国宴豆浆"
-- =============================================================================

-- Add gin_trgm_ops index on recipes.title if it does not exist
-- This enables trigram similarity search: similarity(title, query) > threshold
CREATE INDEX IF NOT EXISTS idx_recipes_title_trgm 
ON recipes USING gin(title gin_trgm_ops) 
WHERE title IS NOT NULL;

-- Also add on description for broader fuzzy matching
CREATE INDEX IF NOT EXISTS idx_recipes_description_trgm 
ON recipes USING gin(description gin_trgm_ops) 
WHERE description IS NOT NULL;

-- Analyze to update statistics
ANALYZE recipes;
