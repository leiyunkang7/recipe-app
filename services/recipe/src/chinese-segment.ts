/**
 * Chinese Text Segmentation using nodejieba
 * Handles Chinese text tokenization for keyword extraction and search
 */

// Lazy-loaded nodejieba instance (load() is expensive, do once at startup)
let _segmenter: typeof import('nodejieba') | null = null;
let _initialized = false;

function getSegmenter(): typeof import('nodejieba') | null {
  if (_segmenter !== null) {
    return _segmenter;
  }
  try {
    const nodejieba = require('nodejieba');
    // Load the dictionary - nodejieba will use its built-in default path
    nodejieba.load({});
    _segmenter = nodejieba;
    _initialized = true;
    return _segmenter;
  } catch (e) {
    console.error('[ChineseSegment] Failed to load nodejieba:', e);
    _segmenter = null;
    return null;
  }
}

/**
 * Check if text contains Chinese characters
 */
export function containsChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

/**
 * Segment Chinese text into individual words
 * Uses nodejieba for accurate Chinese word segmentation
 */
export function segmentChinese(text: string): string[] {
  const segmenter = getSegmenter();
  if (!segmenter) {
    // Fallback: return each Chinese character as a separate word
    return text.split('').filter(char => /[\u4e00-\u9fff]/.test(char));
  }
  
  try {
    // nodejieba.cut does the segmentation
    const words = segmenter.cut(text);
    return words.filter(word => word.trim().length > 0);
  } catch (e) {
    console.error('[ChineseSegment] Segmentation error:', e);
    // Fallback to character-level
    return text.split('').filter(char => /[\u4e00-\u9fff]/.test(char));
  }
}

/**
 * Segment text intelligently - handles mixed Chinese/English
 * Returns array of words for both Chinese and English text
 */
export function segmentText(text: string): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  if (containsChinese(text)) {
    // For mixed text, segment Chinese parts and split English parts
    const result: string[] = [];
    
    // Split by whitespace first to handle English words
    const parts = text.split(/\s+/);
    
    for (const part of parts) {
      if (containsChinese(part)) {
        // Segment Chinese text
        result.push(...segmentChinese(part));
      } else {
        // Keep English words (lowercase, filter short words)
        const words = part.toLowerCase().split(/[\s\-_]+/).filter(w => w.length > 1);
        result.push(...words);
      }
    }
    
    return result;
  } else {
    // English-only text - simple whitespace split
    return text.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  }
}

/**
 * Extract keywords from Chinese text using nodejieba's keyword extraction
 */
export function extractChineseKeywords(text: string, topN: number = 10): string[] {
  const segmenter = getSegmenter();
  if (!segmenter) {
    return segmentChinese(text).slice(0, topN);
  }
  
  try {
    // nodejieba.extract returns top N most important words
    const keywords = segmenter.extract(text, topN);
    return keywords.map(k => k.word);
  } catch (e) {
    console.error('[ChineseSegment] Keyword extraction error:', e);
    return segmentChinese(text).slice(0, topN);
  }
}

/**
 * Process a recipe's searchable fields for keyword extraction
 * Returns segmented words suitable for tag matching
 */
export function processRecipeKeywords(recipe: {
  title?: string;
  description?: string;
  category?: string;
  cuisine?: string;
}): string[] {
  const fieldsToProcess = [
    recipe.title,
    recipe.description,
    recipe.category,
    recipe.cuisine,
  ].filter(Boolean) as string[];

  const allWords: string[] = [];
  
  for (const field of fieldsToProcess) {
    allWords.push(...segmentText(field));
  }
  
  // Remove duplicates and filter
  return [...new Set(allWords)].filter(w => w.length > 1);
}

/**
 * Build search vector text for PostgreSQL tsvector
 * Segments Chinese text to improve search quality
 */
export function buildSearchVectorText(recipe: {
  title?: string;
  description?: string;
  category?: string;
  cuisine?: string;
  tags?: string[];
}): string {
  const parts: string[] = [];
  
  if (recipe.title) parts.push(recipe.title);
  if (recipe.description) parts.push(recipe.description);
  if (recipe.category) parts.push(recipe.category);
  if (recipe.cuisine) parts.push(recipe.cuisine);
  if (recipe.tags && Array.isArray(recipe.tags)) parts.push(...recipe.tags);
  
  const combinedText = parts.join(' ');
  
  // Segment the text and join with spaces for tsvector
  const segmented = segmentText(combinedText);
  return segmented.join(' ');
}
