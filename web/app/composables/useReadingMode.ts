const STORAGE_KEY_READING = 'reading-mode'
const STORAGE_KEY_EYE_PROTECTION = 'eye-protection-mode'

/**
 * useReadingMode - Composable for managing reading mode and eye protection mode
 *
 * Features:
 * - Reading Mode: Simplified, distraction-free view with larger text
 * - Eye Protection Mode: Warm/sepia color scheme for reduced eye strain
 * - Persisted to localStorage for session continuity
 *
 * Usage:
 * const { readingMode, eyeProtectionMode, toggleReadingMode, toggleEyeProtection } = useReadingMode()
 */
export const useReadingMode = () => {
  // Initialize from localStorage or default to false
  const initFromStorage = (key: string, defaultValue: boolean): boolean => {
    if (import.meta.client) {
      const stored = localStorage.getItem(key)
      if (stored !== null) {
        return stored === 'true'
      }
    }
    return defaultValue
  }

  const saveToStorage = (key: string, value: boolean) => {
    if (import.meta.client) {
      localStorage.setItem(key, String(value))
    }
  }

  // Reading mode - simplified view with larger text, no decorative elements
  const readingMode = useState<boolean>('reading-mode', () => initFromStorage(STORAGE_KEY_READING, false))

  // Eye protection mode - warm sepia tones for reduced eye strain
  const eyeProtectionMode = useState<boolean>('eye-protection-mode', () => initFromStorage(STORAGE_KEY_EYE_PROTECTION, false))

  const toggleReadingMode = () => {
    readingMode.value = !readingMode.value
    saveToStorage(STORAGE_KEY_READING, readingMode.value)
  }

  const toggleEyeProtection = () => {
    eyeProtectionMode.value = !eyeProtectionMode.value
    saveToStorage(STORAGE_KEY_EYE_PROTECTION, eyeProtectionMode.value)
  }

  const disableReadingMode = () => {
    readingMode.value = false
    saveToStorage(STORAGE_KEY_READING, false)
  }

  const disableEyeProtection = () => {
    eyeProtectionMode.value = false
    saveToStorage(STORAGE_KEY_EYE_PROTECTION, false)
  }

  // Computed classes for the page wrapper
  const pageWrapperClasses = computed(() => {
    const classes: string[] = ['transition-colors', 'duration-300']

    if (eyeProtectionMode.value) {
      classes.push('bg-amber-50', 'dark:bg-amber-950')
    } else {
      classes.push('bg-stone-50', 'dark:bg-stone-900')
    }

    return classes.join(' ')
  })

  // Computed classes for text elements in reading mode
  const readingModeTextClasses = computed(() => {
    if (!readingMode.value) return ''
    return 'reading-mode-text'
  })

  // Computed classes for ingredient items
  const ingredientContainerClasses = computed(() => {
    if (!readingMode.value) return ''
    return eyeProtectionMode.value
      ? 'reading-mode-item bg-amber-100/50 dark:bg-amber-900/20'
      : 'reading-mode-item bg-stone-100/50 dark:bg-stone-800/50'
  })

  // Computed classes for step items
  const stepContainerClasses = computed(() => {
    if (!readingMode.value) return ''
    return eyeProtectionMode.value
      ? 'reading-mode-step bg-amber-100/50 dark:bg-amber-900/20'
      : 'reading-mode-step bg-stone-100/50 dark:bg-stone-800/50'
  })

  return {
    readingMode: readonly(readingMode),
    eyeProtectionMode: readonly(eyeProtectionMode),
    toggleReadingMode,
    toggleEyeProtection,
    disableReadingMode,
    disableEyeProtection,
    pageWrapperClasses,
    readingModeTextClasses,
    ingredientContainerClasses,
    stepContainerClasses,
  }
}
