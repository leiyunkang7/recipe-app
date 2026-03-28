-- Recipe App Database Schema
-- Supabase PostgreSQL Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: recipes
-- Main recipe table (content fields moved to recipe_translations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  name VARCHAR(100) UNIQUE NOT NULL
);

-- Insert default categories (name is now a key, translations are in category_translations)
INSERT INTO categories (name) VALUES
  ('breakfast'),
  ('lunch'),
  ('dinner'),
  ('dessert'),
  ('snack'),
  ('beverage'),
  ('other')
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

-- Insert common cuisines (name is now a key, translations are in cuisine_translations)
INSERT INTO cuisines (name, region) VALUES
  ('chinese', 'Asia'),
  ('italian', 'Europe'),
  ('mexican', 'North America'),
  ('indian', 'Asia'),
  ('japanese', 'Asia'),
  ('thai', 'Asia'),
  ('french', 'Europe'),
  ('american', 'North America'),
  ('mediterranean', 'Europe/Middle East'),
  ('korean', 'Asia')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- INTERNATIONALIZATION (i18n) TRANSLATION TABLES
-- ============================================================================

-- TABLE: recipe_translations
CREATE TABLE IF NOT EXISTS recipe_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(recipe_id, locale)
);

CREATE INDEX idx_recipe_translations_recipe_id ON recipe_translations(recipe_id);
CREATE INDEX idx_recipe_translations_locale ON recipe_translations(locale);
CREATE INDEX idx_recipe_translations_title_trgm ON recipe_translations USING gin(title gin_trgm_ops);

-- TABLE: ingredient_translations
CREATE TABLE IF NOT EXISTS ingredient_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ingredient_id UUID NOT NULL REFERENCES recipe_ingredients(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ingredient_id, locale)
);

CREATE INDEX idx_ingredient_translations_ingredient_id ON ingredient_translations(ingredient_id);
CREATE INDEX idx_ingredient_translations_locale ON ingredient_translations(locale);
CREATE INDEX idx_ingredient_translations_name_trgm ON ingredient_translations USING gin(name gin_trgm_ops);

-- TABLE: step_translations
CREATE TABLE IF NOT EXISTS step_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  step_id UUID NOT NULL REFERENCES recipe_steps(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL,
  instruction TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(step_id, locale)
);

CREATE INDEX idx_step_translations_step_id ON step_translations(step_id);
CREATE INDEX idx_step_translations_locale ON step_translations(locale);

-- TABLE: category_translations
CREATE TABLE IF NOT EXISTS category_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id, locale)
);

CREATE INDEX idx_category_translations_category_id ON category_translations(category_id);
CREATE INDEX idx_category_translations_locale ON category_translations(locale);

-- Insert category translations
INSERT INTO category_translations (category_id, locale, name, description) VALUES
  (1, 'en', 'Breakfast', 'Morning meals'),
  (1, 'zh-CN', '早餐', '早晨餐点'),
  (2, 'en', 'Lunch', 'Midday meals'),
  (2, 'zh-CN', '午餐', '中午餐点'),
  (3, 'en', 'Dinner', 'Evening meals'),
  (3, 'zh-CN', '晚餐', '晚间餐点'),
  (4, 'en', 'Dessert', 'Sweet treats'),
  (4, 'zh-CN', '甜点', '甜品小食'),
  (5, 'en', 'Snack', 'Light bites'),
  (5, 'zh-CN', '小吃', '轻食小点'),
  (6, 'en', 'Beverage', 'Drinks'),
  (6, 'zh-CN', '饮品', '饮料'),
  (7, 'en', 'Other', 'Miscellaneous'),
  (7, 'zh-CN', '其他', '其他类型')
ON CONFLICT (category_id, locale) DO NOTHING;

-- TABLE: cuisine_translations
CREATE TABLE IF NOT EXISTS cuisine_translations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cuisine_id INTEGER NOT NULL REFERENCES cuisines(id) ON DELETE CASCADE,
  locale VARCHAR(10) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cuisine_id, locale)
);

CREATE INDEX idx_cuisine_translations_cuisine_id ON cuisine_translations(cuisine_id);
CREATE INDEX idx_cuisine_translations_locale ON cuisine_translations(locale);

-- Insert cuisine translations
INSERT INTO cuisine_translations (cuisine_id, locale, name) VALUES
  (1, 'en', 'Chinese'),
  (1, 'zh-CN', '中式'),
  (2, 'en', 'Italian'),
  (2, 'zh-CN', '意式'),
  (3, 'en', 'Mexican'),
  (3, 'zh-CN', '墨西哥'),
  (4, 'en', 'Indian'),
  (4, 'zh-CN', '印度'),
  (5, 'en', 'Japanese'),
  (5, 'zh-CN', '日式'),
  (6, 'en', 'Thai'),
  (6, 'zh-CN', '泰式'),
  (7, 'en', 'French'),
  (7, 'zh-CN', '法式'),
  (8, 'en', 'American'),
  (8, 'zh-CN', '美式'),
  (9, 'en', 'Mediterranean'),
  (9, 'zh-CN', '地中海'),
  (10, 'en', 'Korean'),
  (10, 'zh-CN', '韩式')
ON CONFLICT (cuisine_id, locale) DO NOTHING;

-- Trigger for recipe_translations updated_at
CREATE TRIGGER update_recipe_translations_updated_at BEFORE UPDATE ON recipe_translations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
ALTER TABLE recipe_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE step_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cuisine_translations ENABLE ROW LEVEL SECURITY;

-- Public read access (anon key)
CREATE POLICY "Public read access on recipes" ON recipes
  FOR SELECT USING (true);

CREATE POLICY "Public read access on recipe_ingredients" ON recipe_ingredients
  FOR SELECT USING (true);

CREATE POLICY "Public read access on recipe_steps" ON recipe_steps
  FOR SELECT USING (true);

CREATE POLICY "Public read access on recipe_tags" ON recipe_tags
  FOR SELECT USING (true);

CREATE POLICY "Public read access on recipe_translations" ON recipe_translations
  FOR SELECT USING (true);

CREATE POLICY "Public read access on ingredient_translations" ON ingredient_translations
  FOR SELECT USING (true);

CREATE POLICY "Public read access on step_translations" ON step_translations
  FOR SELECT USING (true);

CREATE POLICY "Public read access on category_translations" ON category_translations
  FOR SELECT USING (true);

CREATE POLICY "Public read access on cuisine_translations" ON cuisine_translations
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

-- View for recipe summary with i18n support (defaults to English)
CREATE OR REPLACE VIEW recipe_summary AS
SELECT
  r.id,
  rt.title,
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
  COUNT(DISTINCT rtg.tag) as tag_count
FROM recipes r
LEFT JOIN recipe_translations rt ON r.id = rt.recipe_id AND rt.locale = 'en'
LEFT JOIN recipe_tags rtg ON r.id = rtg.recipe_id
GROUP BY r.id, rt.title;

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Sample Recipe 1: Tomato and Egg Stir-fry (番茄炒蛋)
INSERT INTO recipes (
  category, cuisine, servings,
  prep_time_minutes, cook_time_minutes, difficulty,
  nutrition_info
) VALUES (
  'dinner',
  'chinese',
  4,
  10,
  15,
  'easy',
  '{"calories": 180, "protein": 12, "carbs": 8, "fat": 14}'::jsonb
) RETURNING id;

-- Add recipe translations and related data
DO $$
DECLARE
  recipe_id UUID;
  ing_egg UUID;
  ing_tomato UUID;
  ing_scallion UUID;
  ing_salt UUID;
  ing_sugar UUID;
  ing_oil UUID;
BEGIN
  SELECT id INTO recipe_id FROM recipes WHERE category = 'dinner' AND cuisine = 'chinese' AND difficulty = 'easy' LIMIT 1;

  -- Recipe translations
  INSERT INTO recipe_translations (recipe_id, locale, title, description) VALUES
    (recipe_id, 'en', 'Tomato and Egg Stir-fry', 'A classic Chinese home-style dish. Sweet and savory tomatoes paired with fluffy scrambled eggs.'),
    (recipe_id, 'zh-CN', '番茄炒蛋', '经典中式家常菜。酸甜可口的番茄配上蓬松的炒蛋。');

  -- Ingredients
  INSERT INTO recipe_ingredients (recipe_id, name, amount, unit) VALUES
    (recipe_id, 'eggs', 4, 'whole'),
    (recipe_id, 'tomatoes', 3, 'medium'),
    (recipe_id, 'scallions', 2, 'stalk'),
    (recipe_id, 'salt', 0.5, 'tsp'),
    (recipe_id, 'sugar', 1, 'tsp'),
    (recipe_id, 'cooking_oil', 2, 'tbsp')
  RETURNING id INTO ing_egg;

  SELECT id INTO ing_tomato FROM recipe_ingredients WHERE recipe_id = recipe_id AND name = 'tomatoes';
  SELECT id INTO ing_scallion FROM recipe_ingredients WHERE recipe_id = recipe_id AND name = 'scallions';
  SELECT id INTO ing_salt FROM recipe_ingredients WHERE recipe_id = recipe_id AND name = 'salt';
  SELECT id INTO ing_sugar FROM recipe_ingredients WHERE recipe_id = recipe_id AND name = 'sugar';
  SELECT id INTO ing_oil FROM recipe_ingredients WHERE recipe_id = recipe_id AND name = 'cooking_oil';

  -- Ingredient translations
  INSERT INTO ingredient_translations (ingredient_id, locale, name) VALUES
    (ing_egg, 'en', 'Eggs'),
    (ing_egg, 'zh-CN', '鸡蛋'),
    (ing_tomato, 'en', 'Tomatoes'),
    (ing_tomato, 'zh-CN', '番茄'),
    (ing_scallion, 'en', 'Scallions'),
    (ing_scallion, 'zh-CN', '小葱'),
    (ing_salt, 'en', 'Salt'),
    (ing_salt, 'zh-CN', '盐'),
    (ing_sugar, 'en', 'Sugar'),
    (ing_sugar, 'zh-CN', '糖'),
    (ing_oil, 'en', 'Cooking oil'),
    (ing_oil, 'zh-CN', '食用油');

  -- Steps
  INSERT INTO recipe_steps (recipe_id, step_number, instruction, duration_minutes) VALUES
    (recipe_id, 1, 'beat_eggs', 2),
    (recipe_id, 2, 'cut_tomatoes', 3),
    (recipe_id, 3, 'scramble_eggs', 3),
    (recipe_id, 4, 'stir_fry_tomatoes', 5),
    (recipe_id, 5, 'add_seasoning', 3),
    (recipe_id, 6, 'combine', 2),
    (recipe_id, 7, 'garnish', 1);

  -- Step translations
  INSERT INTO step_translations (step_id, locale, instruction)
  SELECT rs.id, 'en', CASE rs.step_number
    WHEN 1 THEN 'Beat eggs in a bowl with a pinch of salt.'
    WHEN 2 THEN 'Cut tomatoes into wedges.'
    WHEN 3 THEN 'Heat oil in a wok over medium heat. Scramble eggs until fluffy, then set aside.'
    WHEN 4 THEN 'Add more oil to the wok. Stir-fry tomatoes until soft.'
    WHEN 5 THEN 'Add salt and sugar. Cook until tomatoes release juices.'
    WHEN 6 THEN 'Return eggs to the wok. Toss everything together.'
    WHEN 7 THEN 'Garnish with chopped scallions and serve hot.'
  END
  FROM recipe_steps rs WHERE rs.recipe_id = recipe_id;

  INSERT INTO step_translations (step_id, locale, instruction)
  SELECT rs.id, 'zh-CN', CASE rs.step_number
    WHEN 1 THEN '将鸡蛋打入碗中，加少许盐搅拌均匀。'
    WHEN 2 THEN '将番茄切成块状。'
    WHEN 3 THEN '锅中加油中火加热，将蛋液倒入炒成蓬松的蛋块，盛出备用。'
    WHEN 4 THEN '锅中再加些油，倒入番茄翻炒至软烂。'
    WHEN 5 THEN '加入盐和糖，继续翻炒至番茄出汁。'
    WHEN 6 THEN '将炒好的鸡蛋倒回锅中，翻炒均匀。'
    WHEN 7 THEN '撒上葱花即可出锅。'
  END
  FROM recipe_steps rs WHERE rs.recipe_id = recipe_id;

  INSERT INTO recipe_tags (recipe_id, tag) VALUES
    (recipe_id, 'quick'),
    (recipe_id, 'comfort-food'),
    (recipe_id, 'chinese'),
    (recipe_id, 'vegetarian');
END $$;

-- Sample Recipe 2: Fish-Flavored Shredded Pork (鱼香肉丝)
INSERT INTO recipes (
  category, cuisine, servings,
  prep_time_minutes, cook_time_minutes, difficulty,
  nutrition_info
) VALUES (
  'dinner',
  'chinese',
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
  SELECT id INTO recipe_id FROM recipes WHERE category = 'dinner' AND cuisine = 'chinese' AND difficulty = 'medium' LIMIT 1;

  -- Recipe translations
  INSERT INTO recipe_translations (recipe_id, locale, title, description) VALUES
    (recipe_id, 'en', 'Fish-Flavored Shredded Pork (Yuxiang Rousi)', 'A famous Sichuan dish with a sweet, sour, and spicy sauce. Despite the name, it contains no fish.'),
    (recipe_id, 'zh-CN', '鱼香肉丝', '著名川菜，酸甜微辣的酱汁调味。虽然名字带"鱼"，但实际不含鱼肉。');

  -- Ingredients
  INSERT INTO recipe_ingredients (recipe_id, name, amount, unit) VALUES
    (recipe_id, 'pork_loin', 300, 'grams'),
    (recipe_id, 'black_fungus', 50, 'grams'),
    (recipe_id, 'carrot', 0.5, 'piece'),
    (recipe_id, 'scallions', 3, 'stalk'),
    (recipe_id, 'ginger', 10, 'grams'),
    (recipe_id, 'garlic', 3, 'cloves'),
    (recipe_id, 'dried_red_chilies', 4, 'pieces'),
    (recipe_id, 'soy_sauce', 1, 'tbsp'),
    (recipe_id, 'vinegar', 2, 'tbsp'),
    (recipe_id, 'sugar', 1, 'tbsp'),
    (recipe_id, 'cooking_oil', 3, 'tbsp');

  -- Ingredient translations
  INSERT INTO ingredient_translations (ingredient_id, locale, name)
  SELECT ri.id, 'en', CASE
    WHEN ri.name = 'pork_loin' THEN 'Pork loin'
    WHEN ri.name = 'black_fungus' THEN 'Black fungus'
    WHEN ri.name = 'carrot' THEN 'Carrot'
    WHEN ri.name = 'scallions' THEN 'Scallions'
    WHEN ri.name = 'ginger' THEN 'Ginger'
    WHEN ri.name = 'garlic' THEN 'Garlic'
    WHEN ri.name = 'dried_red_chilies' THEN 'Dried red chilies'
    WHEN ri.name = 'soy_sauce' THEN 'Soy sauce'
    WHEN ri.name = 'vinegar' THEN 'Vinegar'
    WHEN ri.name = 'sugar' THEN 'Sugar'
    WHEN ri.name = 'cooking_oil' THEN 'Cooking oil'
  END
  FROM recipe_ingredients ri WHERE ri.recipe_id = recipe_id;

  INSERT INTO ingredient_translations (ingredient_id, locale, name)
  SELECT ri.id, 'zh-CN', CASE
    WHEN ri.name = 'pork_loin' THEN '猪里脊肉'
    WHEN ri.name = 'black_fungus' THEN '黑木耳'
    WHEN ri.name = 'carrot' THEN '胡萝卜'
    WHEN ri.name = 'scallions' THEN '小葱'
    WHEN ri.name = 'ginger' THEN '姜'
    WHEN ri.name = 'garlic' THEN '大蒜'
    WHEN ri.name = 'dried_red_chilies' THEN '干辣椒'
    WHEN ri.name = 'soy_sauce' THEN '酱油'
    WHEN ri.name = 'vinegar' THEN '醋'
    WHEN ri.name = 'sugar' THEN '糖'
    WHEN ri.name = 'cooking_oil' THEN '食用油'
  END
  FROM recipe_ingredients ri WHERE ri.recipe_id = recipe_id;

  -- Steps
  INSERT INTO recipe_steps (recipe_id, step_number, instruction, duration_minutes) VALUES
    (recipe_id, 1, 'marinate_pork', 10),
    (recipe_id, 2, 'soak_fungus', 15),
    (recipe_id, 3, 'prep_vegetables', 5),
    (recipe_id, 4, 'mix_sauce', 2),
    (recipe_id, 5, 'stir_fry_pork', 3),
    (recipe_id, 6, 'stir_fry_aromatics', 2),
    (recipe_id, 7, 'add_vegetables', 2),
    (recipe_id, 8, 'add_sauce', 3),
    (recipe_id, 9, 'final_touch', 1);

  -- Step translations
  INSERT INTO step_translations (step_id, locale, instruction)
  SELECT rs.id, 'en', CASE rs.step_number
    WHEN 1 THEN 'Cut pork into thin strips and marinate with soy sauce for 10 minutes.'
    WHEN 2 THEN 'Soak black fungus in warm water until soft. Slice into strips.'
    WHEN 3 THEN 'Julienne the carrot. Chop scallions, ginger, and garlic.'
    WHEN 4 THEN 'Mix sauce ingredients: soy sauce, vinegar, sugar, and a little water.'
    WHEN 5 THEN 'Stir-fry pork strips until white. Remove from wok.'
    WHEN 6 THEN 'Stir-fry aromatics (ginger, garlic, chilies) until fragrant.'
    WHEN 7 THEN 'Add fungus and carrots. Stir-fry for 2 minutes.'
    WHEN 8 THEN 'Return pork to wok. Pour in sauce and toss well.'
    WHEN 9 THEN 'Add scallions. Stir-fry for another minute and serve.'
  END
  FROM recipe_steps rs WHERE rs.recipe_id = recipe_id;

  INSERT INTO step_translations (step_id, locale, instruction)
  SELECT rs.id, 'zh-CN', CASE rs.step_number
    WHEN 1 THEN '将猪肉切成细丝，用酱油腌制10分钟。'
    WHEN 2 THEN '将黑木耳用温水泡软，切成丝。'
    WHEN 3 THEN '胡萝卜切丝。葱、姜、蒜切碎。'
    WHEN 4 THEN '调制鱼香汁：酱油、醋、糖加少许水调匀。'
    WHEN 5 THEN '炒锅加油，将肉丝滑炒至变色，盛出备用。'
    WHEN 6 THEN '锅中留油，爆香姜蒜和干辣椒。'
    WHEN 7 THEN '加入木耳和胡萝卜丝，翻炒2分钟。'
    WHEN 8 THEN '将肉丝倒回锅中，倒入调好的鱼香汁，翻炒均匀。'
    WHEN 9 THEN '加入葱花，翻炒一分钟即可出锅。'
  END
  FROM recipe_steps rs WHERE rs.recipe_id = recipe_id;

  INSERT INTO recipe_tags (recipe_id, tag) VALUES
    (recipe_id, 'sichuan'),
    (recipe_id, 'spicy'),
    (recipe_id, 'authentic'),
    (recipe_id, 'pork');
END $$;

-- ============================================================================
-- TABLE: favorites
-- User favorite recipes
-- ============================================================================
CREATE TABLE IF NOT EXISTS favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_recipe_id ON favorites(recipe_id);

-- ============================================================================
-- TABLE: recipe_ratings
-- User ratings for recipes (1-5 stars)
-- ============================================================================
CREATE TABLE IF NOT EXISTS recipe_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, recipe_id)
);

CREATE INDEX IF NOT EXISTS idx_recipe_ratings_user_id ON recipe_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_ratings_recipe_id ON recipe_ratings(recipe_id);

-- Trigger for recipe_ratings updated_at
CREATE TRIGGER update_recipe_ratings_updated_at
BEFORE UPDATE ON recipe_ratings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- RLS Policies for favorites and ratings
-- ============================================================================
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;

-- Favorites: Allow all operations
CREATE POLICY "Allow select for all" ON favorites FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON favorites FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow delete for all" ON favorites FOR DELETE USING (true);

-- Ratings: Allow all operations
CREATE POLICY "Allow select for all" ON recipe_ratings FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON recipe_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all" ON recipe_ratings FOR UPDATE USING (true);
CREATE POLICY "Allow delete for all" ON recipe_ratings FOR DELETE USING (true);
