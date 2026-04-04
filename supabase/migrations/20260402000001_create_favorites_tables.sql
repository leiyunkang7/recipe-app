-- Migration: Create favorites and favorite_folders tables
-- Date: 2026-04-02

-- Create favorite_folders table
CREATE TABLE IF NOT EXISTS favorite_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#F97316',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_favorite_folders_user_id ON favorite_folders(user_id);

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES favorite_folders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Unique constraint to prevent duplicate favorites
  UNIQUE(user_id, recipe_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_recipe_id ON favorites(recipe_id);
CREATE INDEX IF NOT EXISTS idx_favorites_folder_id ON favorites(folder_id);

-- Enable Row Level Security
ALTER TABLE favorite_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for favorite_folders
-- Users can only see their own folders
CREATE POLICY "Users can view their own folders"
  ON favorite_folders FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own folders
CREATE POLICY "Users can insert their own folders"
  ON favorite_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own folders
CREATE POLICY "Users can update their own folders"
  ON favorite_folders FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own folders
CREATE POLICY "Users can delete their own folders"
  ON favorite_folders FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for favorites
-- Users can only see their own favorites
CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only insert their own favorites
CREATE POLICY "Users can insert their own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own favorites
CREATE POLICY "Users can update their own favorites"
  ON favorites FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can only delete their own favorites
CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for favorite_folders updated_at
CREATE TRIGGER update_favorite_folders_updated_at
  BEFORE UPDATE ON favorite_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();