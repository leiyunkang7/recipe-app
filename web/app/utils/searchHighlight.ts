/**
 * Search highlight utility
 * Provides functions to highlight search terms in text
 */

// LRU-style regex cache with max size to prevent unbounded memory growth
const MAX_CACHE_SIZE = 100
const regexCache = new Map<string, RegExp>()

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Creates and caches a regex pattern for the given search query
 * Uses LRU eviction: when cache exceeds MAX_CACHE_SIZE, the oldest entry is removed
 */
function getOrCreateHighlightRegex(searchQuery: string): RegExp | null {
  const cacheKey = searchQuery.trim()
  if (!cacheKey) return null

  const cached = regexCache.get(cacheKey)
  if (cached) return cached

  const terms = cacheKey.split(/\s+/).filter(Boolean)
  if (terms.length === 0) return null

  const pattern = terms
    .map(term => `(${escapeRegex(term)})`)
    .join('|')

  try {
    const regex = new RegExp(`(${pattern})`, 'gi')
    // Evict oldest entry when cache is full (FIFO approximation of LRU)
    if (regexCache.size >= MAX_CACHE_SIZE) {
      const firstKey = regexCache.keys().next().value
      if (firstKey !== undefined) regexCache.delete(firstKey)
    }
    regexCache.set(cacheKey, regex)
    return regex
  } catch {
    return null
  }
}

/**
 * Clears the regex cache (useful for memory cleanup)
 */
export function clearHighlightCache(): void {
  regexCache.clear()
}

/**
 * Highlights search terms in text by wrapping matches with mark tags
 * Returns HTML string with highlighted terms
 */
export function highlightSearchTerms(text: string, searchQuery: string): string {
  if (!searchQuery || !text) return text

  const regex = getOrCreateHighlightRegex(searchQuery)
  if (!regex) return text

  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5 text-yellow-900 dark:text-yellow-100 font-medium">$1</mark>')
}

/**
 * Creates a regex pattern for matching search terms
 * Returns null if no valid pattern can be created
 */
export function createHighlightRegex(searchQuery: string): RegExp | null {
  return getOrCreateHighlightRegex(searchQuery)
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
