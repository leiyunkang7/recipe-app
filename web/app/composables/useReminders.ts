import { useToast } from './useToast'

export interface RecipeReminder {
  id: string
  userId: string
  recipeId: string
  reminderTime: string
  note?: string
  notified: boolean
  createdAt: string
  updatedAt: string
}

export interface RecipeReminderWithRecipe extends RecipeReminder {
  recipe?: {
    title: string
    imageUrl: string | null
    cookTimeMinutes: number
  }
}

export interface CreateReminderParams {
  recipeId: string
  reminderTime: string
  note?: string
}

export interface UpdateReminderParams {
  reminderTime?: string
  note?: string
  notified?: boolean
}

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  reminders: RecipeReminderWithRecipe[]
  favorites: { id: string; recipeId: string; createdAt: string }[]
}

export interface UseRemindersReturn {
  reminders: Ref<RecipeReminderWithRecipe[]>
  loading: Ref<boolean>
  isPending: Ref<boolean>
  error: Ref<string | null>
  fetchReminders: (startDate?: string, endDate?: string) => Promise<void>
  createReminder: (params: CreateReminderParams) => Promise<RecipeReminderWithRecipe | null>
  updateReminder: (id: string, params: UpdateReminderParams) => Promise<boolean>
  deleteReminder: (id: string) => Promise<boolean>
  getRemindersByDate: (date: Date) => RecipeReminderWithRecipe[]
  getRemindersForMonth: (year: number, month: number) => RecipeReminderWithRecipe[]
}

export const useReminders = (): UseRemindersReturn => {
  const reminders = useState<RecipeReminderWithRecipe[]>('reminders', () => [])
  const loading = useState<boolean>('reminders-loading', () => false)
  const isPending = useState<boolean>('reminders-pending', () => false)
  const error = useState<string | null>('reminders-error', () => null)
  const toast = useToast()

  const fetchReminders = async (startDate?: string, endDate?: string): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const query: Record<string, string> = {}
      if (startDate) query.startDate = startDate
      if (endDate) query.endDate = endDate

      const response = await $fetch<{ success: boolean; data?: RecipeReminderWithRecipe[]; error?: { code: string; message: string } }>(
        '/api/reminders',
        { query }
      )

      if (response.success && response.data) {
        reminders.value = response.data
      } else {
        error.value = response.error?.message || 'Failed to fetch reminders'
      }
    } catch (err) {
      console.error('[useReminders] fetchReminders error:', err)
      error.value = 'Network error, please try again later'
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new reminder with optimistic update
   */
  const createReminder = async (params: CreateReminderParams): Promise<RecipeReminderWithRecipe | null> => {
    // Create optimistic reminder object
    const optimisticId = `temp-${Date.now()}`
    const optimisticReminder: RecipeReminderWithRecipe = {
      id: optimisticId,
      recipeId: params.recipeId,
      reminderTime: params.reminderTime,
      note: params.note || '',
      notified: false,
      createdAt: new Date().toISOString(),
    }

    // Store previous state for rollback
    const previousReminders = [...reminders.value]

    // Optimistic update - add immediately
    reminders.value = [...reminders.value, optimisticReminder]

    try {
      const response = await $fetch<{ success: boolean; data?: RecipeReminderWithRecipe; error?: { code: string; message: string } }>(
        '/api/reminders',
        {
          method: 'POST',
          body: params,
        }
      )

      if (response.success && response.data) {
        // Replace optimistic with real data
        reminders.value = reminders.value.map((r) =>
          r.id === optimisticId ? response.data! : r
        )
        toast.success('Reminder created')
        return response.data
      }

      // Rollback on failure
      reminders.value = previousReminders
      error.value = response.error?.message || 'Failed to create reminder'
      toast.error(error.value)
      return null
    } catch (err) {
      // Rollback on error
      reminders.value = previousReminders
      console.error('[useReminders] createReminder error:', err)
      error.value = 'Network error, please try again later'
      toast.error(error.value)
      return null
    }
  }

  /**
   * Update a reminder with optimistic update
   */
  const updateReminder = async (id: string, params: UpdateReminderParams): Promise<boolean> => {
    // Store previous state for rollback
    const previousReminders = [...reminders.value]
    const reminderIndex = reminders.value.findIndex((r) => r.id === id)
    if (reminderIndex === -1) return false

    const _previousReminder = reminders.value[reminderIndex]

    // Optimistic update - apply changes immediately
    reminders.value = reminders.value.map((r) =>
      r.id === id ? { ...r, ...params } : r
    )

    try {
      const response = await $fetch<{ success: boolean; data?: RecipeReminderWithRecipe; error?: { code: string; message: string } }>(
        `/api/reminders/${id}`,
        {
          method: 'PATCH',
          body: params,
        }
      )

      if (response.success && response.data) {
        // Update with server response
        reminders.value = reminders.value.map((r) =>
          r.id === id ? response.data! : r
        )
        return true
      }

      // Rollback on failure
      reminders.value = previousReminders
      error.value = response.error?.message || 'Failed to update reminder'
      toast.error(error.value)
      return false
    } catch (err) {
      // Rollback on error
      reminders.value = previousReminders
      console.error('[useReminders] updateReminder error:', err)
      error.value = 'Network error, please try again later'
      toast.error(error.value)
      return false
    }
  }

  /**
   * Delete a reminder with optimistic update
   */
  const deleteReminder = async (id: string): Promise<boolean> => {
    // Store previous state for rollback
    const previousReminders = [...reminders.value]

    // Optimistic update - remove immediately
    reminders.value = reminders.value.filter((r) => r.id !== id)

    try {
      const response = await $fetch<{ success: boolean; error?: { code: string; message: string } }>(
        `/api/reminders/${id}`,
        { method: 'DELETE' }
      )

      if (response.success) {
        toast.success('Reminder deleted')
        return true
      }

      // Rollback on failure
      reminders.value = previousReminders
      error.value = response.error?.message || 'Failed to delete reminder'
      toast.error(error.value)
      return false
    } catch (err) {
      // Rollback on error
      reminders.value = previousReminders
      console.error('[useReminders] deleteReminder error:', err)
      error.value = 'Network error, please try again later'
      toast.error(error.value)
      return false
    }
  }

  const getRemindersByDate = (date: Date): RecipeReminderWithRecipe[] => {
    const dateStr = date.toISOString().split('T')[0]
    return reminders.value.filter((r) => {
      const reminderDateStr = new Date(r.reminderTime).toISOString().split('T')[0]
      return reminderDateStr === dateStr
    })
  }

  const getRemindersForMonth = (year: number, month: number): RecipeReminderWithRecipe[] => {
    return reminders.value.filter((r) => {
      const d = new Date(r.reminderTime)
      return d.getFullYear() === year && d.getMonth() === month
    })
  }

  return {
    reminders,
    loading,
    isPending: readonly(isPending),
    error,
    fetchReminders,
    createReminder,
    updateReminder,
    deleteReminder,
    getRemindersByDate,
    getRemindersForMonth,
  }
}
