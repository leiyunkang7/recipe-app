#!/usr/bin/env node
// Insert 自制辣条 recipe into Supabase
//
// Requires env vars:
//   SUPABASE_URL=https://euucwcmtzlpoywszphsd.supabase.co
//   SUPABASE_SERVICE_KEY=<your-service-role-key>

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://euucwcmtzlpoywszphsd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_KEY env var is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const recipe = {
  title: '自制辣条',
  description: '家常自制辣条，麻辣鲜香，比买的还好吃！配方来自小红书博主「敏姐三十啷当岁」。',
  category: '小吃',
  cuisine: '中式',
  servings: 4,
  prep_time_minutes: 15,
  cook_time_minutes: 15,
  difficulty: 'medium',
  image_url: '',
  video_url: '',
  source: '小红书-敏姐三十啷当岁',
  source_url: '',
  nutrition_info: null,
};

const ingredients = [
  { name: '豆皮', amount: 500, unit: 'g', notes: '一斤，切成段' },
  { name: '南德/十三香麻辣鲜', amount: 15, unit: 'g' },
  { name: '孜然粉', amount: 10, unit: 'g' },
  { name: '五香粉', amount: 8, unit: 'g' },
  { name: '花椒粉', amount: 5, unit: 'g', notes: '青、红花椒混合' },
  { name: '盐', amount: 18, unit: 'g' },
  { name: '糖', amount: 35, unit: 'g', notes: '微甜，可减量' },
  { name: '大蒜', amount: 1, unit: '头', notes: '约40-50g，切碎' },
  { name: '白芝麻', amount: 10, unit: 'g', notes: '适量' },
  { name: '辣椒粉', amount: 15, unit: 'g', notes: '适量' },
  { name: '食用油', amount: 50, unit: 'ml', notes: '炒调料用' },
];

const steps = [
  { stepNumber: 1, instruction: '豆皮切成段，长度约5-8cm' },
  { stepNumber: 2, instruction: '把所有调料（十三香、孜然粉、五香粉、花椒粉、盐、糖）混合均匀备用' },
  { stepNumber: 3, instruction: '大蒜去皮切碎，量约一头（40-50g）' },
  { stepNumber: 4, instruction: '锅中放油，烧至六七成热，放入蒜末炒香' },
  { stepNumber: 5, instruction: '全程小火，放入混合好的调料，翻炒30秒' },
  { stepNumber: 6, instruction: '放入切好的豆皮，戴上一次性手套抓拌均匀，让每片豆皮都裹满酱汁' },
  { stepNumber: 7, instruction: '撒上白芝麻，出锅享用！' },
];

async function insertRecipe() {
  console.log('📝 Inserting 自制辣条 recipe...');

  // Insert recipe
  const { data: recipeData, error: recipeError } = await supabase
    .from('recipes')
    .insert(recipe)
    .select()
    .single();

  if (recipeError) {
    console.error('❌ Failed to insert recipe:', recipeError);
    return;
  }

  console.log('✅ Recipe inserted! ID:', recipeData.id);

  // Insert ingredients
  const ingredientsWithId = ingredients.map(ing => ({
    ...ing,
    recipe_id: recipeData.id,
  }));

  const { error: ingError } = await supabase
    .from('recipe_ingredients')
    .insert(ingredientsWithId);

  if (ingError) {
    console.error('❌ Failed to insert ingredients:', ingError);
    return;
  }
  console.log('✅ Ingredients inserted!');

  // Insert steps
  const stepsWithId = steps.map(step => ({
    ...step,
    recipe_id: recipeData.id,
  }));

  const { error: stepError } = await supabase
    .from('recipe_steps')
    .insert(stepsWithId);

  if (stepError) {
    console.error('❌ Failed to insert steps:', stepError);
    return;
  }
  console.log('✅ Steps inserted!');
  console.log('');
  console.log('🎉 自制辣条 recipe created successfully!');
}

insertRecipe().catch(console.error);
