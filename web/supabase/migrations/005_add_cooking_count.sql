-- Migration: Add cooking_count column to recipes table
-- This column tracks how many times a recipe has been cooked

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cooking_count INTEGER NOT NULL DEFAULT 0;

-- Create index for faster queries on cooking_count
CREATE INDEX IF NOT EXISTS idx_recipes_cooking_count ON recipes(cooking_count DESC);
