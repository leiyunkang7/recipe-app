import type { Difficulty } from '~/types'

/**
 * Shared constants for share poster generation
 * Extracted from useSharePoster and useSharePosterLogic to avoid duplication
 */

// Category to gradient colors mapping
export const POSTER_GRADIENT_COLORS: Record<string, [string, string]> = {
  '家常菜': ['#FF6B35', '#F7C59F'],
  '快手菜': ['#2EC4B6', '#CBF3F0'],
  '甜点': ['#FF69B4', '#FFC1E3'],
  '早餐': ['#FFD93D', '#FFF3B0'],
  '晚餐': ['#6BCB77', '#D4EDDA'],
  '午餐': ['#4D96FF', '#D0E8FF'],
  '饮品': ['#9B5DE5', '#E0C3FC'],
  '零食': ['#F15BB5', '#FCC8E5'],
  '默认': ['#f97316', '#fde68a'],
}

// Difficulty configuration for poster display
export const POSTER_DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: '简单', color: '#22c55e' },
  medium: { label: '中等', color: '#f59e0b' },
  hard: { label: '困难', color: '#ef4444' },
}

// Default difficulty config for unknown values
export const DEFAULT_DIFFICULTY_CONFIG = { label: '未知', color: '#6b7280' }

/**
 * Get gradient colors for a category
 */
export function getPosterGradientColors(category: string): [string, string] {
  return POSTER_GRADIENT_COLORS[category] || POSTER_GRADIENT_COLORS['默认']
}

/**
 * Get difficulty config for a difficulty level
 */
export function getPosterDifficultyConfig(difficulty: string) {
  const config = POSTER_DIFFICULTY_CONFIG[difficulty as Difficulty]
  return config || DEFAULT_DIFFICULTY_CONFIG
}

/**
 * Calculate total time in minutes
 */
export function calculateTotalTime(prepMinutes: number | string | undefined, cookMinutes: number | string | undefined): number {
  return (Number(prepMinutes) || 0) + (Number(cookMinutes) || 0)
}

/**
 * Format time for display in poster
 */
export function formatTimeForPoster(totalMinutes: number): string {
  if (totalMinutes >= 60) {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return minutes > 0 ? hours + '小时' + minutes + '分钟' : hours + '小时'
  }
  return totalMinutes + '分钟'
}

// ============ Search Highlight Utilities ============

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[-[\]{}()*+?.,\^$|#]/g, '\$\&')
}

/**
 * Highlights search terms in text by wrapping matches with mark tags
 * Returns HTML string with highlighted terms
 */
export function highlightSearchTerms(text: string, searchQuery: string): string {
  if (!searchQuery || !text) return text

  const terms = searchQuery.trim().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return text

  // Create regex pattern matching any of the search terms (case-insensitive)
  const pattern = terms
    .map(term => '(' + escapeRegex(term) + ')')
    .join('|')
  const regex = new RegExp('(' + pattern + ')' , 'gi')

  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5 text-yellow-900 dark:text-yellow-100 font-medium">$1</mark>')
}

/**
 * Creates a regex pattern for matching search terms
 * Returns null if no valid pattern can be created
 */
export function createHighlightRegex(searchQuery: string): RegExp | null {
  if (!searchQuery?.trim()) return null

  const terms = searchQuery.trim().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return null

  const pattern = terms
    .map(term => '(' + escapeRegex(term) + ')')
    .join('|')

  try {
    return new RegExp('(' + pattern + ')' , 'gi')
  } catch {
    return null
  }
}

/**
 * Checks if text contains any of the search terms
 */
export function containsSearchTerm(text: string, searchQuery: string): boolean {
  if (!searchQuery?.trim() || !text) return false

  const terms = searchQuery.trim().split(/\s+/).filter(Boolean)
  const lowerText = text.toLowerCase()

  return terms.some(term => lowerText.includes(term.toLowerCase()))
}
