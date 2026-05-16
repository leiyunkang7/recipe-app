/**
 * Chinese Text Segmentation Module
 * Uses nodejieba for accurate Chinese word segmentation
 * Falls back to regex-based extraction if nodejieba is not available
 * 
 * 爪爪出品 🐾 | 2026-05-12
 */

// Try to import nodejieba, but don't fail if it's not installed
let nodejieba: typeof import('nodejieba') | null = null;
let nodejiebaLoaded = false;

try {
  nodejieba = require('nodejieba');
  nodejiebaLoaded = true;
} catch (error) {
  console.warn('[chinese-segment] nodejieba not installed, using fallback extraction');
}

export interface SegmentResult {
  words: string[];
  tags: Array<{ word: string; tag: string }>;
}

/**
 * Initialize nodejieba - call once at application startup
 */
export function initChineseSegment(): void {
  if (!nodejiebaLoaded || !nodejieba) {
    console.warn('[chinese-segment] nodejieba not available, skipping initialization');
    return;
  }
  try {
    nodejieba.load();
    console.log('[chinese-segment] nodejieba loaded successfully');
  } catch (error) {
    console.error('[chinese-segment] nodejieba load failed:', error);
    nodejiebaLoaded = false;
  }
}

/**
 * Check if text contains Chinese characters
 */
export function hasChineseCharacters(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Extract Chinese character sequences (fallback when nodejieba is not available)
 */
function extractChineseSequences(text: string): string[] {
  // Match sequences of 2+ Chinese characters
  return text.match(/[\u4e00-\u9fa5]{2,}/g) || [];
}

/**
 * Segment text into words (Chinese + English)
 * Uses nodejieba if available, otherwise falls back to regex extraction
 * 
 * @param text Input text (Chinese/English mixed)
 * @returns SegmentResult with words and tags
 */
export function segmentText(text: string): SegmentResult {
  if (!text || text.trim().length === 0) {
    return { words: [], tags: [] };
  }

  // Check if text contains Chinese
  if (!hasChineseCharacters(text)) {
    // Pure English: split by whitespace
    const words = text.split(/\s+/).filter(w => w.length > 1);
    return { words, tags: [] };
  }

  // Extract English words
  const englishWords = text.match(/[a-zA-Z0-9]+/g) || [];
  
  // Extract Chinese text only
  const chineseText = text.replace(/[a-zA-Z0-9\s]/g, '');
  
  if (!chineseText) {
    return { words: englishWords.filter(w => w.length > 1), tags: [] };
  }

  let chineseWords: string[];
  
  if (nodejiebaLoaded && nodejieba) {
    // Use nodejieba for proper Chinese segmentation
    try {
      chineseWords = nodejieba.cut(chineseText);
    } catch (error) {
      console.warn('[chinese-segment] nodejieba cut failed, using fallback:', error);
      chineseWords = extractChineseSequences(chineseText);
    }
  } else {
    // Fallback: extract Chinese character sequences
    chineseWords = extractChineseSequences(chineseText);
  }

  // Filter and combine
  const filteredChineseWords = chineseWords.filter(
    (w: string) => w.length > 1 && !/^\d+$/.test(w)
  );

  const allWords = [
    ...englishWords.filter(w => w.length > 1),
    ...filteredChineseWords
  ];

  return {
    words: [...new Set(allWords)], // deduplicate
    tags: [] // nodejieba tag not available in fallback mode
  };
}

/**
 * Extract top N keywords from text
 * @param text Input text
 * @param topK Number of keywords to extract (default: 10)
 */
export function extractKeywords(text: string, topK: number = 10): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  if (!nodejiebaLoaded || !nodejieba) {
    // Fallback: extract Chinese character sequences
    const sequences = extractChineseSequences(text);
    return sequences.slice(0, topK);
  }

  try {
    const result = nodejieba.extract(text, topK);
    return result.map((item: { word: string }) => item.word);
  } catch (error) {
    console.error('[chinese-segment] extract failed:', error);
    return extractChineseSequences(text).slice(0, topK);
  }
}

/**
 * Extract words suitable for tag matching
 * This function handles both Chinese and English text
 */
export function extractWordsForTagging(text: string): string[] {
  const { words } = segmentText(text);
  return words;
}
