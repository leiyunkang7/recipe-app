/**
 * useDifficulty - Utility for recipe difficulty display
 */

const difficultyColorMap: Record<string, string> = {
  easy: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  hard: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

const difficultyColorFallback = 'bg-gray-100 text-gray-800 dark:bg-stone-700 dark:text-stone-300'

export function useDifficulty() {
  const { t } = useI18n()

  const difficultyColor = (difficulty: string): string => {
    return difficultyColorMap[difficulty] ?? difficultyColorFallback
  }

  const difficultyLabel = (difficulty: string): string => {
    return t(`difficulty.${difficulty}`)
  }

  return { difficultyColor, difficultyLabel }
}
