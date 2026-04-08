import type { CreateRecipeDTO } from '@recipe-app/shared-types';

/**
 * Smart Tag Recommendation System
 * Analyzes recipe attributes to suggest relevant tags
 */

export interface TagSuggestion {
  tag: string;
  score: number;
  reason: string;
}

export interface SmartTagOptions {
  maxSuggestions?: number;
  includeTimeTags?: boolean;
  includeDifficultyTags?: boolean;
  includeCuisineTags?: boolean;
  includeIngredientTags?: boolean;
  includeKeywordTags?: boolean;
}

const TIME_TAGS: Array<{ pattern: (m: number) => boolean; tag: string; reason: string }> = [
  { pattern: (m: number) => m <= 15, tag: 'quick', reason: 'Takes 15 minutes or less' },
  { pattern: (m: number) => m <= 30, tag: '30-minute-meals', reason: 'Takes 30 minutes or less' },
  { pattern: (m: number) => m <= 60, tag: 'weeknight-dinner', reason: 'Ready in under an hour' },
  { pattern: (m: number) => m > 60, tag: 'slow-cooked', reason: 'Requires extended cooking time' },
];

const DIFFICULTY_TAGS: Array<{ pattern: (d: string) => boolean; tag: string; reason: string }> = [
  { pattern: (d: string) => d === 'easy', tag: 'beginner-friendly', reason: 'Easy difficulty level' },
  { pattern: (d: string) => d === 'easy', tag: 'easy', reason: 'Simple to prepare' },
  { pattern: (d: string) => d === 'medium', tag: 'intermediate', reason: 'Medium difficulty level' },
  { pattern: (d: string) => d === 'hard', tag: 'challenging', reason: 'Advanced cooking skills required' },
];

const CUISINE_TAG_MAP: Record<string, string[]> = {
  italian: ['pasta', 'mediterranean', 'comfort-food'],
  chinese: ['asian', 'stir-fry', 'wok'],
  japanese: ['asian', 'sushi', 'rice-dishes'],
  korean: ['asian', 'spicy', 'fermented'],
  indian: ['spicy', 'curry', 'flavorful', 'vegetarian-friendly'],
  mexican: ['spicy', 'tex-mex', 'flavorful'],
  french: ['elegant', 'baking', 'classic'],
  thai: ['asian', 'spicy', 'fresh'],
  american: ['comfort-food', 'bbq', 'soul-food'],
  mediterranean: ['healthy', 'fresh', 'olive-oil'],
  vietnamese: ['fresh', 'asian', 'light'],
  greek: ['mediterranean', 'fresh', 'cheese'],
  spanish: ['tapas', 'flavorful', 'rice-dishes'],
  'middle eastern': ['spiced', 'flavorful', 'vegetarian-friendly'],
  german: ['hearty', 'comfort-food', 'meat'],
  brazilian: ['grilled', 'tropical', 'flavorful'],
};

const CATEGORY_TAG_MAP: Record<string, string[]> = {
  'main course': ['entree', 'dinner'],
  appetizer: ['starter', 'finger-food', 'party'],
  dessert: ['sweet', 'baking', 'treat'],
  breakfast: ['morning', 'brunch', 'eggs'],
  lunch: ['midday', 'sandwiches', 'salads'],
  snack: ['quick-bites', 'finger-food', 'party'],
  beverage: ['drinks', 'refreshing'],
  soup: ['comfort-food', 'warm', 'hearty'],
  salad: ['fresh', 'healthy', 'light'],
  side: ['accompany', 'vegetables'],
  bread: ['baking', 'carbs', 'comfort-food'],
  sauce: ['condiment', 'flavor'],
  drink: ['beverages', 'refreshing'],
};

const KEYWORD_TAG_MAP: Record<string, string> = {
  vegan: 'vegan',
  vegetarian: 'vegetarian-friendly',
  gluten: 'gluten-free',
  dairy: 'dairy-free',
  nut: 'nut-free',
  sugar: 'low-sugar',
  fat: 'low-fat',
  calorie: 'low-calorie',
  protein: 'high-protein',
  fiber: 'high-fiber',
  fried: 'fried',
  grilled: 'grilled',
  baked: 'baked',
  roasted: 'roasted',
  steamed: 'steamed',
  raw: 'raw',
  smoked: 'smoked',
  slow: 'slow-cooked',
  instant: 'instant-pot',
  holiday: 'holiday',
  christmas: 'christmas',
  thanksgiving: 'thanksgiving',
  summer: 'summer',
  picnic: 'picnic',
  party: 'party',
  birthday: 'birthday',
  date: 'date-night',
  romantic: 'romantic',
  comfort: 'comfort-food',
  healthy: 'healthy',
  quick: 'quick',
  easy: 'easy',
  homemade: 'homemade',
  authentic: 'authentic',
  traditional: 'traditional',
  modern: 'modern',
  fusion: 'fusion',
  gourmet: 'gourmet',
  hot: 'hot',
  cold: 'cold',
  warm: 'warm',
  chilled: 'chilled',
  frozen: 'frozen',
  gift: 'giftable',
  meal: 'meal-prep',
  prep: 'meal-prep',
  batch: 'batch-cooking',
  one: 'one-pot',
  pot: 'one-pot',
  sheet: 'sheet-pan',
  air: 'air-fryer',
  pressure: 'pressure-cooker',
};

const INGREDIENT_TAG_MAP: Record<string, string[]> = {
  chicken: ['chicken', 'protein'],
  beef: ['beef', 'protein'],
  pork: ['pork', 'protein'],
  fish: ['seafood', 'protein'],
  salmon: ['seafood', 'omega-3'],
  shrimp: ['seafood', 'protein'],
  tofu: ['vegetarian-protein', 'vegan'],
  egg: ['eggs', 'protein'],
  rice: ['rice-dishes', 'grains'],
  pasta: ['pasta', 'comfort-food'],
  noodle: ['noodles', 'asian'],
  bread: ['bread', 'carbs'],
  potato: ['potato-dishes', 'comfort-food'],
  tomato: ['tomato', 'fresh'],
  onion: ['aromatic', 'flavor'],
  garlic: ['aromatic', 'flavor'],
  cheese: ['cheese', 'comfort-food'],
  cream: ['creamy', 'rich'],
  butter: ['rich', 'baking'],
  olive: ['mediterranean', 'healthy'],
  lemon: ['citrus', 'fresh'],
  chocolate: ['chocolate', 'dessert'],
  fruit: ['fruit', 'fresh'],
  vegetable: ['vegetables', 'healthy'],
  spinach: ['greens', 'healthy'],
  mushroom: ['earthy', 'umami'],
  bean: ['legumes', 'protein'],
  lentil: ['legumes', 'protein'],
  chickpea: ['legumes', 'protein'],
};

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\\s]/g, ' ');
}

function extractWords(text: string): string[] {
  return normalizeText(text).split(/\\s+/).filter((w) => w.length > 2);
}

function matchKeyword(words: string[]): string[] {
  const matched: string[] = [];
  for (const word of words) {
    const tag = KEYWORD_TAG_MAP[word];
    if (tag && !matched.includes(tag)) matched.push(tag);
  }
  return matched;
}

function matchCuisine(cuisine: string | undefined): string[] {
  if (!cuisine) return [];
  const normalized = normalizeText(cuisine);
  const tags: string[] = [];
  for (const [key, value] of Object.entries(CUISINE_TAG_MAP)) {
    if (normalized.includes(key)) tags.push(...value);
  }
  const cuisineWords = extractWords(cuisine);
  for (const word of cuisineWords) {
    if (word.length > 3 && !['cuisine', 'style', 'food'].includes(word)) tags.push(word);
  }
  return [...new Set(tags)];
}

function matchCategory(category: string | undefined): string[] {
  if (!category) return [];
  const normalized = normalizeText(category);
  for (const [key, value] of Object.entries(CATEGORY_TAG_MAP)) {
    if (normalized.includes(key)) return value;
  }
  return [];
}

function matchIngredients(ingredients: Array<{ name: string }>): string[] {
  const tags: string[] = [];
  const ingredientNames = ingredients.map((i: { name: string }) => normalizeText(i.name));
  for (const [key, value] of Object.entries(INGREDIENT_TAG_MAP)) {
    for (const name of ingredientNames) {
      if (name.includes(key)) { tags.push(...value); break; }
    }
  }
  return [...new Set(tags)];
}

function matchDifficulty(difficulty: string): Array<{ tag: string; reason: string }> {
  const results: Array<{ tag: string; reason: string }> = [];
  for (const rule of DIFFICULTY_TAGS) {
    if (rule.pattern(difficulty)) results.push({ tag: rule.tag, reason: rule.reason });
  }
  return results;
}

function matchTime(prepTime: number, cookTime: number): Array<{ tag: string; reason: string }> {
  const total = prepTime + cookTime;
  const results: Array<{ tag: string; reason: string }> = [];
  for (const rule of TIME_TAGS) {
    if (rule.pattern(total)) results.push({ tag: rule.tag, reason: rule.reason });
  }
  return results;
}

export function recommendTags(recipe: CreateRecipeDTO, options: SmartTagOptions = {}): TagSuggestion[] {
  const { maxSuggestions = 10, includeTimeTags = true, includeDifficultyTags = true, includeCuisineTags = true, includeIngredientTags = true, includeKeywordTags = true } = options;
  const suggestions: TagSuggestion[] = [];
  const addedTags = new Set<string>();

  function addSuggestion(tag: string, score: number, reason: string): void {
    if (!addedTags.has(tag)) { addedTags.add(tag); suggestions.push({ tag, score, reason }); }
  }

  if (includeCuisineTags) {
    const cuisineTags = matchCuisine(recipe.cuisine);
    for (const tag of cuisineTags) addSuggestion(tag, 90, 'Based on cuisine: ' + (recipe.cuisine || 'unknown'));
  }

  const categoryTags = matchCategory(recipe.category);
  for (const tag of categoryTags) addSuggestion(tag, 80, 'Based on category: ' + recipe.category);

  if (includeDifficultyTags) {
    const difficultyResults = matchDifficulty(recipe.difficulty);
    for (const { tag, reason } of difficultyResults) addSuggestion(tag, 70, reason);
  }

  if (includeTimeTags) {
    const timeResults = matchTime(recipe.prepTimeMinutes, recipe.cookTimeMinutes);
    for (const { tag, reason } of timeResults) addSuggestion(tag, 60, reason);
  }

  if (includeIngredientTags && recipe.ingredients) {
    const ingredientTags = matchIngredients(recipe.ingredients);
    for (const tag of ingredientTags) addSuggestion(tag, 50, 'Based on ingredients');
  }

  if (includeKeywordTags) {
    const textToAnalyze = [recipe.title, recipe.description || '', recipe.category, recipe.cuisine || ''].join(' ').toLowerCase();
    const keywordMatches = matchKeyword(extractWords(textToAnalyze));
    for (const tag of keywordMatches) addSuggestion(tag, 40, 'Based on recipe content');
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, maxSuggestions);
}

export function getQuickTags(partial: string): string[] {
  const normalized = normalizeText(partial);
  const matches: string[] = [];
  for (const tag of Object.values(KEYWORD_TAG_MAP)) { if (tag.includes(normalized) && !matches.includes(tag)) matches.push(tag); }
  for (const tags of Object.values(CUISINE_TAG_MAP)) { for (const tag of tags) { if (tag.includes(normalized) && !matches.includes(tag)) matches.push(tag); } }
  for (const tags of Object.values(CATEGORY_TAG_MAP)) { for (const tag of tags) { if (tag.includes(normalized) && !matches.includes(tag)) matches.push(tag); } }
  for (const tags of Object.values(INGREDIENT_TAG_MAP)) { for (const tag of tags) { if (tag.includes(normalized) && !matches.includes(tag)) matches.push(tag); } }
  for (const rule of TIME_TAGS) { if (rule.tag.includes(normalized) && !matches.includes(rule.tag)) matches.push(rule.tag); }
  return matches.slice(0, 10);
}
