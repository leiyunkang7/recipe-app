/**
 * Recipe Import/Export Utilities
 * Handles conversion between database format and exportable formats (JSON/CSV)
 */

import type { Recipe, Ingredient, RecipeStep } from '~/types';

export interface ExportedRecipe {
  title: string;
  description: string;
  category: string;
  cuisine: string;
  servings: number;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  ingredients: { name: string; amount: number; unit: string }[];
  steps: { stepNumber: number; instruction: string; durationMinutes?: number }[];
  tags: string[];
  nutritionInfo?: { calories?: number; protein?: number; carbs?: number; fat?: number; fiber?: number };
  source?: string;
  translations?: { locale: string; title: string; description?: string }[];
}

export function recipeToExportFormat(recipe: Recipe | Record<string, any>): ExportedRecipe {
  return {
    title: recipe.title || '',
    description: recipe.description || '',
    category: recipe.category || '',
    cuisine: recipe.cuisine || '',
    servings: recipe.servings || 0,
    prepTimeMinutes: recipe.prepTimeMinutes || recipe.prep_time_minutes || 0,
    cookTimeMinutes: recipe.cookTimeMinutes || recipe.cook_time_minutes || 0,
    difficulty: recipe.difficulty || 'medium',
    ingredients: (recipe.ingredients || []).map((ing: Ingredient | Record<string, any>) => ({
      name: ing.name || '',
      amount: typeof ing.amount === 'string' ? parseFloat(ing.amount) : (ing.amount || 0),
      unit: ing.unit || '',
    })),
    steps: (recipe.steps || []).map((step: RecipeStep | Record<string, any>) => ({
      stepNumber: step.stepNumber || step.step_number || 1,
      instruction: step.instruction || '',
      durationMinutes: step.durationMinutes || step.duration_minutes,
    })),
    tags: recipe.tags || [],
    nutritionInfo: recipe.nutritionInfo || recipe.nutrition_info,
    source: recipe.source || '',
    translations: recipe.translations || recipe.recipe_translations || [],
  };
}

export function recipesToExportFormat(recipes: (Recipe | Record<string, any>)[]): ExportedRecipe[] {
  return recipes.map(recipeToExportFormat);
}

export function importRecipeToDTO(exported: Partial<ExportedRecipe>): Record<string, any> {
  return {
    title: exported.title || 'Untitled Recipe',
    description: exported.description || '',
    category: exported.category || '主菜',
    cuisine: exported.cuisine || '',
    servings: exported.servings || 2,
    prep_time_minutes: exported.prepTimeMinutes || 10,
    cook_time_minutes: exported.cookTimeMinutes || 20,
    difficulty: exported.difficulty || 'medium',
    ingredients: (exported.ingredients || []).map(ing => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
    })),
    steps: (exported.steps || []).map((step, idx) => ({
      step_number: step.stepNumber || (idx + 1),
      instruction: step.instruction,
      duration_minutes: step.durationMinutes,
    })),
    tags: exported.tags || [],
    nutrition_info: exported.nutritionInfo || null,
    source: exported.source || '',
    translations: exported.translations || [],
  };
}

export function getRecipeCSVHeader(): string[] {
  return [
    'title', 'description', 'category', 'cuisine', 'servings',
    'prepTimeMinutes', 'cookTimeMinutes', 'difficulty',
    'ingredients', 'steps', 'tags',
    'calories', 'protein', 'carbs', 'fat', 'fiber', 'source',
  ];
}

export function recipeToCSVRow(recipe: ExportedRecipe): string[] {
  const ingredients = recipe.ingredients
    .map(ing => `${ing.amount} ${ing.unit} ${ing.name}`)
    .join('; ');
  const steps = recipe.steps
    .map(step => `${step.stepNumber}. ${step.instruction}`)
    .join(' | ');
  const tags = recipe.tags.join(', ');

  return [
    escapeCSV(recipe.title),
    escapeCSV(recipe.description),
    escapeCSV(recipe.category),
    escapeCSV(recipe.cuisine),
    String(recipe.servings),
    String(recipe.prepTimeMinutes),
    String(recipe.cookTimeMinutes),
    recipe.difficulty,
    escapeCSV(ingredients),
    escapeCSV(steps),
    escapeCSV(tags),
    String(recipe.nutritionInfo?.calories || ''),
    String(recipe.nutritionInfo?.protein || ''),
    String(recipe.nutritionInfo?.carbs || ''),
    String(recipe.nutritionInfo?.fat || ''),
    String(recipe.nutritionInfo?.fiber || ''),
    escapeCSV(recipe.source || ''),
  ];
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function parseCSVRow(row: string[]): Partial<ExportedRecipe> | null {
  if (!row.length || !row[0]) return null;

  const [
    title, description, category, cuisine, servings,
    prepTimeMinutes, cookTimeMinutes, difficulty,
    ingredients, steps, tags,
    calories, protein, carbs, fat, fiber, source,
  ] = row;

  const parsedIngredients: { name: string; amount: number; unit: string }[] = [];
  if (ingredients) {
    const ingParts = ingredients.split(';').map(s => s.trim()).filter(Boolean);
    for (const part of ingParts) {
      const match = part.match(/^([\d.]+)\s*(\S+)?\s+(.+)$/);
      if (match) {
        parsedIngredients.push({ amount: parseFloat(match[1]), unit: match[2] || '', name: match[3] });
      } else {
        parsedIngredients.push({ amount: 1, unit: '', name: part });
      }
    }
  }

  const parsedSteps: { stepNumber: number; instruction: string; durationMinutes?: number }[] = [];
  if (steps) {
    const stepParts = steps.split('|').map(s => s.trim()).filter(Boolean);
    stepParts.forEach((part, idx) => {
      const match = part.match(/^(\d+)\.\s*(.+)$/);
      parsedSteps.push({
        stepNumber: match ? parseInt(match[1]) : idx + 1,
        instruction: match ? match[2] : part,
      });
    });
  }

  const nutritionInfo: Record<string, number> = {};
  if (calories) nutritionInfo.calories = parseFloat(calories);
  if (protein) nutritionInfo.protein = parseFloat(protein);
  if (carbs) nutritionInfo.carbs = parseFloat(carbs);
  if (fat) nutritionInfo.fat = parseFloat(fat);
  if (fiber) nutritionInfo.fiber = parseFloat(fiber);

  return {
    title: title || 'Untitled Recipe',
    description: description || '',
    category: category || '主菜',
    cuisine: cuisine || '',
    servings: servings ? parseInt(servings) : 2,
    prepTimeMinutes: prepTimeMinutes ? parseInt(prepTimeMinutes) : 10,
    cookTimeMinutes: cookTimeMinutes ? parseInt(cookTimeMinutes) : 20,
    difficulty: (difficulty as 'easy' | 'medium' | 'hard') || 'medium',
    ingredients: parsedIngredients,
    steps: parsedSteps,
    tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    nutritionInfo: Object.keys(nutritionInfo).length ? nutritionInfo as any : undefined,
    source: source || '',
  };
}

export function generateCSV(recipes: ExportedRecipe[]): string {
  const header = getRecipeCSVHeader();
  const rows = recipes.map(recipeToCSVRow);
  const csvContent = [header.join(','), ...rows.map(row => row.join(','))].join('\n');
  return '\ufeff' + csvContent;
}

export function parseCSV(content: string): Partial<ExportedRecipe>[] {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) return [];
  const recipes: Partial<ExportedRecipe>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row) {
      const parsed = parseCSVRow(row);
      if (parsed) recipes.push(parsed);
    }
  }
  return recipes;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') { current += '"'; i += 2; }
        else { inQuotes = false; i++; }
      } else { current += char; i++; }
    } else {
      if (char === '"') { inQuotes = true; i++; }
      else if (char === ',') { result.push(current); current = ''; i++; }
      else { current += char; i++; }
    }
  }
  result.push(current);
  return result;
}
