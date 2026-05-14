#!/usr/bin/env bun
/**
 * Backfill Tags for Existing Recipes
 * 
 * Run: bun scripts/backfill-recipe-tags.ts
 * 
 * Uses Supabase REST API via fetch (no npm packages needed).
 */

const SUPABASE_URL = 'https://sbxgxqhkktqhjrktgmgh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZLyfaEVO4pLHKpw2vDsUWg_fNGIIP9E';

// Tag extraction logic (same as Auto-Tag Hook in service.ts)
const CHINESE_KEYWORD_TAG_MAP: Record<string, string> = {
  '豆浆': '养生',
  '黑芝麻': '养发',
  '核桃': '补脑',
  '花生': '补血',
  '燕麦': '降脂',
  '绿豆': '解毒',
  '红豆': '补血',
  '南瓜': '养胃',
  '玉米': '利尿',
  '红薯': '通便',
  '紫薯': '抗氧',
  '牛奶': '补钙',
  '蜂蜜': '润肠',
  '红枣': '补血',
  '枸杞': '明目',
  '冰糖': '润肺',
  '糯米': '补气',
  '米糊': '养胃',
  '甜品': '甜品',
  '饮品': '饮品',
  '粥羹': '粥羹',
};

function extractTagsFromRecipe(recipe: any): string[] {
  const tags = new Set<string>();
  const text = `${recipe.title} ${recipe.description || ''} ${recipe.category || ''} ${recipe.cuisine || ''}`.toLowerCase();

  // 1. Difficulty tags
  if (recipe.difficulty === 'easy') {
    tags.add('easy');
    tags.add('简单');
  } else if (recipe.difficulty === 'medium') {
    tags.add('medium');
    tags.add('中等');
  } else if (recipe.difficulty === 'hard') {
    tags.add('hard');
    tags.add('困难');
  }

  // 2. Time-based tags
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
  if (totalTime <= 15) {
    tags.add('15-minute-meals');
    tags.add('一刻钟');
  } else if (totalTime <= 30) {
    tags.add('30-minute-meals');
    tags.add('半小时');
  } else if (totalTime <= 60) {
    tags.add('60-minute-meals');
    tags.add('一小时');
  }

  // 3. Cuisine tags
  if (recipe.cuisine) {
    tags.add(recipe.cuisine);
  }

  // 4. Category tags
  if (recipe.category) {
    tags.add(recipe.category);
  }

  // 5. Chinese keyword mapping
  for (const [keyword, tag] of Object.entries(CHINESE_KEYWORD_TAG_MAP)) {
    if (text.includes(keyword)) {
      tags.add(tag);
    }
  }

  // 6. Ingredient tags from ingredients array
  if (recipe.ingredients && Array.isArray(recipe.ingredients)) {
    for (const ing of recipe.ingredients) {
      const name = (ing.name || '').toLowerCase();
      for (const [keyword, tag] of Object.entries(CHINESE_KEYWORD_TAG_MAP)) {
        if (name.includes(keyword)) {
          tags.add(tag);
        }
      }
    }
  }

  return Array.from(tags).slice(0, 8); // Max 8 tags
}

async function supabaseFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HTTP ${response.status}: ${error}`);
  }

  return response.json();
}

async function backfillTags() {
  console.log('🚀 Starting tag backfill...\n');

  // 1. Get all recipes
  console.log('📋 Fetching all recipes...');
  const recipes: any[] = await supabaseFetch('recipes?select=id,title,description,category,cuisine,difficulty,prep_time_minutes,cook_time_minutes,ingredients&order=created_at.asc');
  console.log(`   Found ${recipes.length} recipes\n`);

  // 2. Get existing tags to avoid duplicates
  console.log('🔍 Checking existing tags...');
  const existingTags: any[] = await supabaseFetch('recipe_tags?select=recipe_id,tag');
  
  const existingTagMap = new Map<string, Set<string>>();
  for (const rt of existingTags) {
    if (!existingTagMap.has(rt.recipe_id)) {
      existingTagMap.set(rt.recipe_id, new Set());
    }
    existingTagMap.get(rt.recipe_id)!.add(rt.tag);
  }

  // 3. Count recipes needing tags
  let recipesNeedingTags = 0;
  let recipesAlreadyTagged = 0;

  for (const recipe of recipes) {
    const existing = existingTagMap.get(recipe.id);
    if (!existing || existing.size === 0) {
      recipesNeedingTags++;
    } else {
      recipesAlreadyTagged++;
    }
  }

  console.log(`   ✅ Already tagged: ${recipesAlreadyTagged}`);
  console.log(`   ⏳ Need tags: ${recipesNeedingTags}\n`);

  if (recipesNeedingTags === 0) {
    console.log('✨ All recipes already have tags!');
    return;
  }

  // 4. Backfill tags for recipes without them
  let successCount = 0;
  let skipCount = 0;

  for (const recipe of recipes) {
    const existingTagsSet = existingTagMap.get(recipe.id);
    
    // Skip if already has tags
    if (existingTagsSet && existingTagsSet.size > 0) {
      skipCount++;
      continue;
    }

    // Generate tags
    const newTags = extractTagsFromRecipe(recipe);

    if (newTags.length === 0) {
      console.log(`⚠️  No tags generated for: ${recipe.title}`);
      skipCount++;
      continue;
    }

    // Insert tags
    try {
      const tagRecords = newTags.map((tag: string) => ({
        recipe_id: recipe.id,
        tag: tag,
      }));

      await supabaseFetch('recipe_tags', {
        method: 'POST',
        body: JSON.stringify(tagRecords),
        headers: { 'Prefer': 'resolution=merge-duplicates' },
      });

      console.log(`✅ [${successCount + 1}] ${recipe.title}`);
      console.log(`   Tags: ${newTags.join(', ')}`);
      successCount++;
    } catch (error: any) {
      console.error(`❌ Error adding tags to "${recipe.title}":`, error.message);
      skipCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Successfully tagged: ${successCount}`);
  console.log(`   ⏭️  Skipped: ${skipCount}`);
  console.log(`   📋 Total: ${successCount + skipCount}`);
  console.log(`\n🎉 Tag backfill complete!`);
}

backfillTags().catch(console.error);
