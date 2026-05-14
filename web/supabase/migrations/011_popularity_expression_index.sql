-- =============================================================================
-- Migration: 011_popularity_expression_index
-- Description: Add expression index for popularity score calculation
-- Author: Hephaestus
-- Created: 2026-04-09
-- =============================================================================

-- Expression index for popular recipes ordering by (cooking_count + views * 0.1)
-- This directly supports the popularity_score calculation in recommendationService
CREATE INDEX IF NOT EXISTS idx_recipes_popularity_score
ON recipes ((cooking_count + (views * 0.1)) DESC);

-- Analyze the table to update statistics
ANALYZE recipes;
