-- Create favorite_folders table for organizing favorites into groups
CREATE TABLE IF NOT EXISTS favorite_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#F97316',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- Add folder_id to favorites table (nullable, default folder is null)
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES favorite_folders(id) ON DELETE SET NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_favorite_folders_user_id ON favorite_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_folder_id ON favorites(folder_id);

-- Enable Row Level Security
ALTER TABLE favorite_folders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own folders
CREATE POLICY "Users can view their own folders"
  ON favorite_folders FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own folders
CREATE POLICY "Users can add their own folders"
  ON favorite_folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own folders
CREATE POLICY "Users can update their own folders"
  ON favorite_folders FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own folders
CREATE POLICY "Users can delete their own folders"
  ON favorite_folders FOR DELETE
  USING (auth.uid() = user_id);

-- Update policy for favorites to include folder_id
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
CREATE POLICY "Users can view their own favorites"
  ON favorites FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add their own favorites" ON favorites;
CREATE POLICY "Users can add their own favorites"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;
CREATE POLICY "Users can delete their own favorites"
  ON favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for favorite_folders updated_at
DROP TRIGGER IF EXISTS update_favorite_folders_updated_at ON favorite_folders;
CREATE TRIGGER update_favorite_folders_updated_at
  BEFORE UPDATE ON favorite_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
