-- Migration: Add video support to recipes
-- Date: 2026-03-29

-- Add video_url column to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Add source_url column for original video link (e.g., 小红书 link)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Create video bucket if not exists (managed via Supabase dashboard or storage API)
-- Note: Create a public bucket named 'recipe-videos' via Supabase dashboard
