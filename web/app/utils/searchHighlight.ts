/**
 * Search highlight utility
 * Provides functions to highlight search terms in text
 */

/**
 * Escapes special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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
    .map(term => `(${escapeRegex(term)})`)
    .join('|')
  const regex = new RegExp(`(${pattern})`, 'gi')

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
    .map(term => `(${escapeRegex(term)})`)
    .join('|')

  try {
    return new RegExp(`(${pattern})`, 'gi')
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
