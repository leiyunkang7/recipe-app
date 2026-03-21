-- Migration: Add views column to recipes table
-- Description: Track view count for each recipe

ALTER TABLE recipes ADD COLUMN IF NOT EXISTS views INTEGER NOT NULL DEFAULT 0;

-- Create index for sorting by views
CREATE INDEX IF NOT EXISTS idx_recipes_views ON recipes(views DESC);
