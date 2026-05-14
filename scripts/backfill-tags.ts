#!/usr/bin/env bun
/**
 * Backfill Tags Script
 * 
 * Regenerates tags for all existing recipes using the recommendTags function.
 * This hooks into the smart-tags.ts logic to populate the recipeTags table.
 * 
 * Usage:
 *   cd /home/k/.openclaw/workspace/recipe-app
 *   bun scripts/backfill-tags.ts
 * 
 * What it does:
 *   1. Fetches all recipes from the API
 *   2. For each recipe, calls recommendTags() to generate tags
 *   3. Deletes existing tags and inserts new ones
 */

import { recommendTags } from '../services/recipe/src/smart-tags';

const API_BASE = 'http://localhost:3000/api';

// Mock CreateRecipeDTO type (simplified)
interface Ingredient {
  name: string;
  amount: string | number;
  unit: string;
}

interface Step {
  instruction: string;
  stepNumber: number;
  durationMinutes?: number;
}

interface Recipe {
  id: string;
  title: string;
  description?: string;
  category: string;
  cuisine?: string;
  servings?: number;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  difficulty?: string;
  ingredients: Ingredient[];
  steps: Step[];
}

async function fetchAllRecipes(): Promise<Recipe[]> {
  console.log('📡 Fetching all recipes...');
  const response = await fetch(`${API_BASE}/recipes?limit=100`);
  const data = await response.json();
  const recipes: Recipe[] = data.data || [];
  console.log(`✅ Found ${recipes.length} recipes`);
  return recipes;
}

async function updateRecipeTags(recipeId: string, tags: string[]): Promise<void> {
  // The API doesn't have a dedicated tag update endpoint,
  // so we use the update endpoint with just the tags
  // But the API route doesn't call recommendTags...
  // Instead, we need to directly manipulate the database via Supabase REST API
  const supabaseUrl = 'https://euucwcmtzlpoywszphsd.supabase.co';
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1dWN3Y210emxwb3l3c3pwaHNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODAwMDAsImV4cCI6MjA2MTY1NjAwMH0.ZLyfaEVO4pLHKpw2vDsUWg_fNGIIP9E';
  
  // Delete existing tags
  await fetch(`${supabaseUrl}/rest/v1/recipe_tags?recipe_id=eq.${recipeId}`, {
    method: 'DELETE',
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`,
    },
  });

  // Insert new tags
  if (tags.length > 0) {
    const tagRecords = tags.map(tag => ({
      recipe_id: recipeId,
      tag: tag,
    }));
    
    await fetch(`${supabaseUrl}/rest/v1/recipe_tags`, {
      method: 'POST',
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(tagRecords),
    });
  }
}

function generateTagsForRecipe(recipe: Recipe): string[] {
  // Build a CreateRecipeDTO-like object for recommendTags
  const dto = {
    title: recipe.title,
    description: recipe.description || '',
    category: recipe.category,
    cuisine: recipe.cuisine || '',
    difficulty: recipe.difficulty || 'medium',
    servings: recipe.servings || 2,
    prepTimeMinutes: recipe.prepTimeMinutes || 10,
    cookTimeMinutes: recipe.cookTimeMinutes || 10,
    ingredients: recipe.ingredients?.map(i => i.name) || [],
  };

  const suggestions = recommendTags(dto as any, { maxSuggestions: 8 });
  return suggestions.map(s => s.tag);
}

async function main() {
  console.log('🐾 Tag Backfill Starting...\n');

  const recipes = await fetchAllRecipes();
  
  if (recipes.length === 0) {
    console.log('❌ No recipes found to backfill');
    return;
  }

  console.log(`\n🔄 Processing ${recipes.length} recipes...\n`);

  let success = 0;
  let failed = 0;

  for (const recipe of recipes) {
    const currentTags = (recipe as any).tags || [];
    
    // Generate new tags
    const newTags = generateTagsForRecipe(recipe);
    
    if (newTags.length === 0) {
      console.log(`⚠️  ${recipe.title}: No tags generated, skipping`);
      continue;
    }

    try {
      await updateRecipeTags(recipe.id, newTags);
      const tagsStr = newTags.join(', ');
      console.log(`✅ ${recipe.title}`);
      console.log(`   Tags: ${tagsStr}`);
      success++;
    } catch (err) {
      console.log(`❌ ${recipe.title}: ${err}`);
      failed++;
    }
  }

  console.log(`\n✨ Backfill Complete!`);
  console.log(`   ✅ Success: ${success}`);
  console.log(`   ❌ Failed: ${failed}`);
}

main().catch(console.error);
