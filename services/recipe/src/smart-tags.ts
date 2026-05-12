import type { CreateRecipeDTO } from '@recipe-app/shared-types';
import { segmentText, hasChineseCharacters } from './chinese-segment';

/**
 * Smart Tag Recommendation System
 * Analyzes recipe attributes to suggest relevant tags
 * 
 * 爪爪出品 🐾 | 2026-05-12 - Jieba integration for Chinese support
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

/**
 * Chinese Keyword to Tag Mapping
 * Maps Chinese words/ingredients to recipe tags
 * 
 * 爪爪 🐾 | 2026-05-12
 */
const CHINESE_KEYWORD_TAG_MAP: Record<string, string> = {
  // Ingredients
  '牛肉': 'beef',
  '猪肉': 'pork',
  '鸡肉': 'chicken',
  '鱼肉': 'seafood',
  '虾': 'seafood',
  '虾仁': 'seafood',
  '豆腐': 'vegetarian-protein',
  '鸡蛋': 'eggs',
  '米饭': 'rice-dishes',
  '面条': 'noodles',
  '面包': 'bread',
  '土豆': 'potato-dishes',
  '番茄': 'tomato',
  '西红柿': 'tomato',
  '洋葱': 'aromatic',
  '大蒜': 'aromatic',
  '芝士': 'cheese',
  '奶油': 'creamy',
  '黄油': 'rich',
  '橄榄': 'mediterranean',
  '柠檬': 'citrus',
  '巧克力': 'chocolate',
  '水果': 'fruit',
  '蔬菜': 'vegetables',
  '菠菜': 'greens',
  '蘑菇': 'earthy',
  '豆类': 'legumes',
  '豆浆': 'soy-milk',
  '芝麻': 'sesame',
  '核桃': 'walnut',
  '花生': 'protein',
  '南瓜': 'pumpkin',
  '玉米': 'corn',
  '紫薯': 'purple-sweet-potato',
  '红薯': 'vegetables',
  // Preparation methods
  '炒': 'stir-fry',
  '蒸': 'steamed',
  '煮': 'boiled',
  '炸': 'fried',
  '烤': 'baked',
  '炖': 'slow-cooked',
  '煎': 'pan-fried',
  // Dietary preferences
  '素食': 'vegetarian-friendly',
  '全素': 'vegan',
  '无糖': 'low-sugar',
  '低脂': 'low-fat',
  '健康': 'healthy',
  // Cuisine types
  '川菜': 'spicy',
  '粤菜': 'asian',
  '湘菜': 'spicy',
  '鲁菜': 'comfort-food',
  '淮扬': 'asian',
  '东北': 'comfort-food',
  // Meal types
  '早餐': 'breakfast',
  '午餐': 'lunch',
  '晚餐': 'dinner',
  '宵夜': 'quick-bites',
  '甜点': 'dessert',
  '小食': 'finger-food',
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

/**
 * Check if text contains Chinese characters
 */
function isChineseText(text: string): boolean {
  return hasChineseCharacters(text);
}

/**
 * Extract words from text (supports both English and Chinese)
 * Uses nodejieba for Chinese text segmentation when available
 * 
 * 爪爪 🐾 | 2026-05-12
 */
function extractWords(text: string): string[] {
  const normalized = normalizeText(text);
  
  // Check if text contains Chinese
  if (isChineseText(text)) {
    try {
      // Use nodejieba for Chinese segmentation
      const result = segmentText(text);
      return result.words.filter(w => w.length > 1);
    } catch (error) {
      // Fallback: extract Chinese character sequences (2+ chars)
      const chineseSequences = text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
      const englishWords = normalized.split(/\\s+/).filter(w => w.length > 2);
      return [...englishWords, ...chineseSequences];
    }
  }
  
  // Pure English: use original logic
  return normalized.split(/\\s+/).filter((w) => w.length > 2);
}

/**
 * Match keywords against both English and Chinese maps
 * 
 * 爪爪 🐾 | 2026-05-12
 */
function matchKeyword(words: string[]): string[] {
  const matched: string[] = [];
  for (const word of words) {
    // Check English keyword map
    const tag = KEYWORD_TAG_MAP[word];
    if (tag && !matched.includes(tag)) matched.push(tag);
    
    // Check Chinese keyword map (word itself is Chinese)
    const chineseTag = CHINESE_KEYWORD_TAG_MAP[word];
    if (chineseTag && !matched.includes(chineseTag)) matched.push(chineseTag);
  }
  return matched;
}

/**
 * Match Chinese text directly against Chinese keyword map
 * This is used when we have raw Chinese text that hasn't been segmented
 * 
 * 爪爪 🐾 | 2026-05-12
 */
function matchChineseKeyword(text: string): string[] {
  const matched: string[] = [];
  for (const [chineseWord, tag] of Object.entries(CHINESE_KEYWORD_TAG_MAP)) {
    if (text.includes(chineseWord) && !matched.includes(tag)) {
      matched.push(tag);
    }
  }
  return matched;
}

function matchCuisine(cuisine: string | undefined): string[] {
  if (!cuisine) return [];
  const normalized = normalizeText(cuisine);
  const tags: string[] = [];
  
  // Check Chinese cuisine keywords
  if (isChineseText(cuisine)) {
    const chineseMatches = matchChineseKeyword(cuisine);
    tags.push(...chineseMatches);
  }
  
  // Check English cuisine map
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
  
  // Check Chinese category keywords
  if (isChineseText(category)) {
    const chineseMatches = matchChineseKeyword(category);
    if (chineseMatches.length > 0) return chineseMatches;
  }
  
  for (const [key, value] of Object.entries(CATEGORY_TAG_MAP)) {
    if (normalized.includes(key)) return value;
  }
  return [];
}

function matchIngredients(ingredients: Array<{ name: string }>): string[] {
  const tags: string[] = [];
  const ingredientNames = ingredients.map((i: { name: string }) => normalizeText(i.name));
  
  // Check Chinese ingredient names
  const chineseIngredientNames = ingredients
    .map((i: { name: string }) => i.name)
    .filter(name => isChineseText(name));
  
  for (const chineseName of chineseIngredientNames) {
    const chineseMatches = matchChineseKeyword(chineseName);
    tags.push(...chineseMatches);
  }
  
  // Check English ingredient map
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
    
    // English keyword matching
    const englishWords = extractWords(textToAnalyze);
    const englishMatches = matchKeyword(englishWords);
    for (const tag of englishMatches) addSuggestion(tag, 40, 'Based on recipe content');
    
    // Chinese keyword matching (direct substring match)
    const originalText = [recipe.title, recipe.description || '', recipe.category, recipe.cuisine || ''].join(' ');
    if (isChineseText(originalText)) {
      const chineseMatches = matchChineseKeyword(originalText);
      for (const tag of chineseMatches) addSuggestion(tag, 40, 'Based on Chinese keywords');
    }
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, maxSuggestions);
}

export function getQuickTags(partial: string): string[] {
  const normalized = normalizeText(partial);
  const matches: string[] = [];
  
  // Check if partial contains Chinese
  if (isChineseText(partial)) {
    // Search Chinese keyword map
    for (const [chineseWord, tag] of Object.entries(CHINESE_KEYWORD_TAG_MAP)) {
      if (chineseWord.includes(partial) || tag.includes(normalized)) {
        if (!matches.includes(tag)) matches.push(tag);
      }
    }
  }
  
  // Search English maps
  for (const tag of Object.values(KEYWORD_TAG_MAP)) { if (tag.includes(normalized) && !matches.includes(tag)) matches.push(tag); }
  for (const tags of Object.values(CUISINE_TAG_MAP)) { for (const tag of tags) { if (tag.includes(normalized) && !matches.includes(tag)) matches.push(tag); } }
  for (const tags of Object.values(CATEGORY_TAG_MAP)) { for (const tag of tags) { if (tag.includes(normalized) && !matches.includes(tag)) matches.push(tag); } }
  for (const tags of Object.values(INGREDIENT_TAG_MAP)) { for (const tag of tags) { if (tag.includes(normalized) && !matches.includes(tag)) matches.push(tag); } }
  for (const rule of TIME_TAGS) { if (rule.tag.includes(normalized) && !matches.includes(rule.tag)) matches.push(rule.tag); }
  return matches.slice(0, 10);
}
