-- Create recipe_reminders table for scheduled cooking reminders
CREATE TABLE IF NOT EXISTS recipe_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  reminder_time TIMESTAMPTZ NOT NULL,
  note TEXT,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recipe_id, reminder_time)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_recipe_reminders_user_id ON recipe_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_reminders_recipe_id ON recipe_reminders(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_reminders_reminder_time ON recipe_reminders(reminder_time);

-- Enable Row Level Security
ALTER TABLE recipe_reminders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own reminders
CREATE POLICY "Users can view their own reminders"
  ON recipe_reminders FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own reminders
CREATE POLICY "Users can add their own reminders"
  ON recipe_reminders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reminders
CREATE POLICY "Users can update their own reminders"
  ON recipe_reminders FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own reminders
CREATE POLICY "Users can delete their own reminders"
  ON recipe_reminders FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recipe_reminders_updated_at()
RETURNS TRIGGER AS 3784757
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
3784757 LANGUAGE plpgsql;

-- Trigger for recipe_reminders updated_at
DROP TRIGGER IF EXISTS update_recipe_reminders_updated_at ON recipe_reminders;
CREATE TRIGGER update_recipe_reminders_updated_at
  BEFORE UPDATE ON recipe_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_recipe_reminders_updated_at();
