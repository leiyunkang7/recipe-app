const STORAGE_KEY = 'search-history'
const MAX_HISTORY_ITEMS = 10

export const useSearchHistory = () => {
  const initFromStorage = (): string[] => {
    if (import.meta.client) {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {
          return []
        }
      }
    }
    return []
  }

  const saveToStorage = (history: string[]) => {
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    }
  }

  const history = useState<string[]>('search-history', () => initFromStorage())

  const addSearch = (term: string) => {
    const trimmed = term.trim()
    if (!trimmed) return
    const filtered = history.value.filter(h => h.toLowerCase() !== trimmed.toLowerCase())
    const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS)
    history.value = updated
    saveToStorage(updated)
  }

  const removeSearch = (term: string) => {
    const updated = history.value.filter(h => h.toLowerCase() !== term.toLowerCase())
    history.value = updated
    saveToStorage(updated)
  }

  const clearHistory = () => {
    history.value = []
    saveToStorage([])
  }

  const hasSearch = (term: string): boolean => {
    return history.value.some(h => h.toLowerCase() === term.toLowerCase())
  }

  return {
    history: readonly(history),
    addSearch,
    removeSearch,
    clearHistory,
    hasSearch,
  }
}