/**
 * Database Migration Runner
 *
 * Run: npx tsx src/seed.ts
 * Requires DATABASE_URL env var or default local connection.
 */

import { createDb } from './client';

async function runSeed() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/recipe_app';
  const db = createDb(connectionString);

  console.log('Seeding database...');

  // Insert default categories
  await db.execute(`
    INSERT INTO categories (name) VALUES
      ('breakfast'), ('lunch'), ('dinner'), ('dessert'),
      ('snack'), ('beverage'), ('other')
    ON CONFLICT (name) DO NOTHING
  `);

  // Insert default cuisines
  await db.execute(`
    INSERT INTO cuisines (name, region) VALUES
      ('chinese', 'Asia'), ('italian', 'Europe'), ('mexican', 'North America'),
      ('indian', 'Asia'), ('japanese', 'Asia'), ('thai', 'Asia'),
      ('french', 'Europe'), ('american', 'North America'),
      ('mediterranean', 'Europe/Middle East'), ('korean', 'Asia')
    ON CONFLICT (name) DO NOTHING
  `);

  // Insert category translations
  await db.execute(`
    INSERT INTO category_translations (category_id, locale, name, description) VALUES
      (1, 'en', 'Breakfast', 'Morning meals'), (1, 'zh-CN', '早餐', '早晨餐点'),
      (2, 'en', 'Lunch', 'Midday meals'), (2, 'zh-CN', '午餐', '中午餐点'),
      (3, 'en', 'Dinner', 'Evening meals'), (3, 'zh-CN', '晚餐', '晚间餐点'),
      (4, 'en', 'Dessert', 'Sweet treats'), (4, 'zh-CN', '甜点', '甜品小食'),
      (5, 'en', 'Snack', 'Light bites'), (5, 'zh-CN', '小吃', '轻食小点'),
      (6, 'en', 'Beverage', 'Drinks'), (6, 'zh-CN', '饮品', '饮料'),
      (7, 'en', 'Other', 'Miscellaneous'), (7, 'zh-CN', '其他', '其他类型')
    ON CONFLICT (category_id, locale) DO NOTHING
  `);

  // Insert cuisine translations
  await db.execute(`
    INSERT INTO cuisine_translations (cuisine_id, locale, name) VALUES
      (1, 'en', 'Chinese'), (1, 'zh-CN', '中式'),
      (2, 'en', 'Italian'), (2, 'zh-CN', '意式'),
      (3, 'en', 'Mexican'), (3, 'zh-CN', '墨西哥'),
      (4, 'en', 'Indian'), (4, 'zh-CN', '印度'),
      (5, 'en', 'Japanese'), (5, 'zh-CN', '日式'),
      (6, 'en', 'Thai'), (6, 'zh-CN', '泰式'),
      (7, 'en', 'French'), (7, 'zh-CN', '法式'),
      (8, 'en', 'American'), (8, 'zh-CN', '美式'),
      (9, 'en', 'Mediterranean'), (9, 'zh-CN', '地中海'),
      (10, 'en', 'Korean'), (10, 'zh-CN', '韩式')
    ON CONFLICT (cuisine_id, locale) DO NOTHING
  `);

  // Create update_updated_at_column trigger function
  await db.execute(`
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  // Create trigger on recipes
  await db.execute(`
    DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
    CREATE TRIGGER update_recipes_updated_at
      BEFORE UPDATE ON recipes
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
  `);

  // Create increment_views RPC function
  await db.execute(`
    CREATE OR REPLACE FUNCTION increment_views(recipe_id UUID)
    RETURNS void AS $$
    BEGIN
      UPDATE recipes SET views = COALESCE(views, 0) + 1 WHERE id = recipe_id;
    END;
    $$ LANGUAGE plpgsql
  `);

  console.log('Seed completed successfully.');
  process.exit(0);
}

runSeed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
