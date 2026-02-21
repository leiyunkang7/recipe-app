-- Recipe App Database Schema
-- Supabase PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: recipes
-- Main recipe table
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  cuisine VARCHAR(100),
  servings INTEGER NOT NULL CHECK (servings > 0),
  prep_time_minutes INTEGER NOT NULL CHECK (prep_time_minutes >= 0),
  cook_time_minutes INTEGER NOT NULL CHECK (cook_time_minutes >= 0),
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  image_url TEXT,
  source TEXT,
  nutrition_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_recipes_category ON recipes(category);
CREATE INDEX idx_recipes_cuisine ON recipes(cuisine);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);
CREATE INDEX idx_recipes_title_trgm ON recipes USING gin(title gin_trgm_ops);
CREATE INDEX idx_recipes_description_trgm ON recipes USING gin(description gin_trgm_ops);

-- ============================================================================
-- TABLE: recipe_ingredients
-- Ingredients for each recipe
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  unit VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_name_trgm ON recipe_ingredients USING gin(name gin_trgm_ops);

-- ============================================================================
-- TABLE: recipe_steps
-- Cooking steps for each recipe
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipe_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number > 0),
  instruction TEXT NOT NULL,
  duration_minutes INTEGER CHECK (duration_minutes >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, step_number)
);

-- Create indexes
CREATE INDEX idx_recipe_steps_recipe_id ON recipe_steps(recipe_id);

-- ============================================================================
-- TABLE: recipe_tags
-- Tags for categorizing recipes
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipe_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, tag)
);

-- Create indexes
CREATE INDEX idx_recipe_tags_recipe_id ON recipe_tags(recipe_id);
CREATE INDEX idx_recipe_tags_tag_trgm ON recipe_tags USING gin(tag gin_trgm_ops);

-- ============================================================================
-- TABLE: categories
-- Predefined categories (optional, for validation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
  ('Breakfast', 'Morning meals'),
  ('Lunch', 'Midday meals'),
  ('Dinner', 'Evening meals'),
  ('Dessert', 'Sweet treats'),
  ('Snack', 'Light bites'),
  ('Beverage', 'Drinks'),
  ('Other', 'Miscellaneous')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- TABLE: cuisines
-- Predefined cuisines (optional, for validation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS cuisines (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  region VARCHAR(100)
);

-- Insert common cuisines
INSERT INTO cuisines (name, region) VALUES
  ('Chinese', 'Asia'),
  ('Italian', 'Europe'),
  ('Mexican', 'North America'),
  ('Indian', 'Asia'),
  ('Japanese', 'Asia'),
  ('Thai', 'Asia'),
  ('French', 'Europe'),
  ('American', 'North America'),
  ('Mediterranean', 'Europe/Middle East'),
  ('Korean', 'Asia')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- FUNCTION: update_updated_at
-- Automatically update updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating updated_at
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable RLS on all tables
-- ============================================================================

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_tags ENABLE ROW LEVEL SECURITY;

-- Public read access (anon key)
CREATE POLICY "Public read access on recipes" ON recipes
  FOR SELECT USING (true);

CREATE POLICY "Public read access on recipe_ingredients" ON recipe_ingredients
  FOR SELECT USING (true);

CREATE POLICY "Public read access on recipe_steps" ON recipe_steps
  FOR SELECT USING (true);

CREATE POLICY "Public read access on recipe_tags" ON recipe_tags
  FOR SELECT USING (true);

-- Service role full access (for backend operations)
-- Note: These policies are bypassed when using service role key

-- ============================================================================
-- STORAGE BUCKET: recipe-images
-- Create storage bucket for recipe images
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read access on recipe-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-images');

CREATE POLICY "Authenticated upload access on recipe-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recipe-images');

CREATE POLICY "Authenticated delete access on recipe-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'recipe-images');

-- ============================================================================
-- VIEWS (Optional helper views)
-- ============================================================================

-- View for recipe summary (useful for list views)
CREATE OR REPLACE VIEW recipe_summary AS
SELECT
  r.id,
  r.title,
  r.category,
  r.cuisine,
  r.difficulty,
  r.servings,
  r.prep_time_minutes,
  r.cook_time_minutes,
  (r.prep_time_minutes + r.cook_time_minutes) as total_time_minutes,
  r.image_url,
  r.created_at,
  r.updated_at,
  COUNT(DISTINCT rt.tag) as tag_count
FROM recipes r
LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
GROUP BY r.id;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Sample Recipe 1: Tomato and Egg Stir-fry (番茄炒蛋)
INSERT INTO recipes (
  title, description, category, cuisine, servings,
  prep_time_minutes, cook_time_minutes, difficulty,
  nutrition_info
) VALUES (
  'Tomato and Egg Stir-fry',
  'A classic Chinese home-style dish. Sweet and savory tomatoes paired with fluffy scrambled eggs.',
  'Dinner',
  'Chinese',
  4,
  10,
  15,
  'easy',
  '{"calories": 180, "protein": 12, "carbs": 8, "fat": 14}'::jsonb
) RETURNING id;

-- Get the recipe ID and add ingredients
DO $$
DECLARE
  recipe_id UUID;
BEGIN
  SELECT id INTO recipe_id FROM recipes WHERE title = 'Tomato and Egg Stir-fry' LIMIT 1;

  INSERT INTO recipe_ingredients (recipe_id, name, amount, unit) VALUES
    (recipe_id, 'Eggs', 4, 'whole'),
    (recipe_id, 'Tomatoes', 3, 'medium'),
    (recipe_id, 'Scallions', 2, 'stalk'),
    (recipe_id, 'Salt', 0.5, 'tsp'),
    (recipe_id, 'Sugar', 1, 'tsp'),
    (recipe_id, 'Cooking oil', 2, 'tbsp');

  INSERT INTO recipe_steps (recipe_id, step_number, instruction, duration_minutes) VALUES
    (recipe_id, 1, 'Beat eggs in a bowl with a pinch of salt.', 2),
    (recipe_id, 2, 'Cut tomatoes into wedges.', 3),
    (recipe_id, 3, 'Heat oil in a wok over medium heat. Scramble eggs until fluffy, then set aside.', 3),
    (recipe_id, 4, 'Add more oil to the wok. Stir-fry tomatoes until soft.', 5),
    (recipe_id, 5, 'Add salt and sugar. Cook until tomatoes release juices.', 3),
    (recipe_id, 6, 'Return eggs to the wok. Toss everything together.', 2),
    (recipe_id, 7, 'Garnish with chopped scallions and serve hot.', 1);

  INSERT INTO recipe_tags (recipe_id, tag) VALUES
    (recipe_id, 'quick'),
    (recipe_id, 'comfort-food'),
    (recipe_id, 'chinese'),
    (recipe_id, 'vegetarian');
END $$;

-- Sample Recipe 2: Fish-Flavored Shredded Pork (鱼香肉丝)
INSERT INTO recipes (
  title, description, category, cuisine, servings,
  prep_time_minutes, cook_time_minutes, difficulty,
  nutrition_info
) VALUES (
  'Fish-Flavored Shredded Pork (Yuxiang Rousi)',
  'A famous Sichuan dish with a sweet, sour, and spicy sauce. Despite the name, it contains no fish.',
  'Dinner',
  'Chinese',
  4,
  20,
  15,
  'medium',
  '{"calories": 320, "protein": 24, "carbs": 18, "fat": 22}'::jsonb
) RETURNING id;

DO $$
DECLARE
  recipe_id UUID;
BEGIN
  SELECT id INTO recipe_id FROM recipes WHERE title = 'Fish-Flavored Shredded Pork (Yuxiang Rousi)' LIMIT 1;

  INSERT INTO recipe_ingredients (recipe_id, name, amount, unit) VALUES
    (recipe_id, 'Pork loin', 300, 'grams'),
    (recipe_id, 'Black fungus', 50, 'grams'),
    (recipe_id, 'Carrot', 0.5, 'piece'),
    (recipe_id, 'Scallions', 3, 'stalk'),
    (recipe_id, 'Ginger', 10, 'grams'),
    (recipe_id, 'Garlic', 3, 'cloves'),
    (recipe_id, 'Dried red chilies', 4, 'pieces'),
    (recipe_id, 'Soy sauce', 1, 'tbsp'),
    (recipe_id, 'Vinegar', 2, 'tbsp'),
    (recipe_id, 'Sugar', 1, 'tbsp'),
    (recipe_id, 'Cooking oil', 3, 'tbsp');

  INSERT INTO recipe_steps (recipe_id, step_number, instruction, duration_minutes) VALUES
    (recipe_id, 1, 'Cut pork into thin strips and marinate with soy sauce for 10 minutes.', 10),
    (recipe_id, 2, 'Soak black fungus in warm water until soft. Slice into strips.', 15),
    (recipe_id, 3, 'Julienne the carrot. Chop scallions, ginger, and garlic.', 5),
    (recipe_id, 4, 'Mix sauce ingredients: soy sauce, vinegar, sugar, and a little water.', 2),
    (recipe_id, 5, 'Stir-fry pork strips until white. Remove from wok.', 3),
    (recipe_id, 6, 'Stir-fry aromatics (ginger, garlic, chilies) until fragrant.', 2),
    (recipe_id, 7, 'Add fungus and carrots. Stir-fry for 2 minutes.', 2),
    (recipe_id, 8, 'Return pork to wok. Pour in sauce and toss well.', 3),
    (recipe_id, 9, 'Add scallions. Stir-fry for another minute and serve.', 1);

  INSERT INTO recipe_tags (recipe_id, tag) VALUES
    (recipe_id, 'sichuan'),
    (recipe_id, 'spicy'),
    (recipe_id, 'authentic'),
    (recipe_id, 'pork');
END $$;
