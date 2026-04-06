import type { RecipeReminder } from '@recipe-app/shared-types'

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
  const error = useState<string | null>('reminders-error', () => null)

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
        error.value = response.error?.message || '获取提醒列表失败'
      }
    } catch (err) {
      console.error('[useReminders] fetchReminders error:', err)
      error.value = '网络错误，请稍后重试'
    } finally {
      loading.value = false
    }
  }

  const createReminder = async (params: CreateReminderParams): Promise<RecipeReminderWithRecipe | null> => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data?: RecipeReminderWithRecipe; error?: { code: string; message: string } }>(
        '/api/reminders',
        {
          method: 'POST',
          body: params,
        }
      )

      if (response.success && response.data) {
        reminders.value = [...reminders.value, response.data]
        return response.data
      } else {
        error.value = response.error?.message || '创建提醒失败'
        return null
      }
    } catch (err) {
      console.error('[useReminders] createReminder error:', err)
      error.value = '网络错误，请稍后重试'
      return null
    } finally {
      loading.value = false
    }
  }

  const updateReminder = async (id: string, params: UpdateReminderParams): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; data?: RecipeReminderWithRecipe; error?: { code: string; message: string } }>(
        `/api/reminders/${id}`,
        {
          method: 'PATCH',
          body: params,
        }
      )

      if (response.success && response.data) {
        const index = reminders.value.findIndex((r) => r.id === id)
        if (index !== -1) {
          reminders.value[index] = response.data
        }
        return true
      } else {
        error.value = response.error?.message || '更新提醒失败'
        return false
      }
    } catch (err) {
      console.error('[useReminders] updateReminder error:', err)
      error.value = '网络错误，请稍后重试'
      return false
    } finally {
      loading.value = false
    }
  }

  const deleteReminder = async (id: string): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ success: boolean; error?: { code: string; message: string } }>(
        `/api/reminders/${id}`,
        { method: 'DELETE' }
      )

      if (response.success) {
        reminders.value = reminders.value.filter((r) => r.id !== id)
        return true
      } else {
        error.value = response.error?.message || '删除提醒失败'
        return false
      }
    } catch (err) {
      console.error('[useReminders] deleteReminder error:', err)
      error.value = '网络错误，请稍后重试'
      return false
    } finally {
      loading.value = false
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
    error,
    fetchReminders,
    createReminder,
    updateReminder,
    deleteReminder,
    getRemindersByDate,
    getRemindersForMonth,
  }
}
