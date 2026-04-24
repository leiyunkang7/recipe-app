<script setup lang="ts">
/**
 * ReminderModal - Create and manage recipe reminders
 *
 * Features:
 * - Create new reminder with date/time picker and optional note
 * - View reminders for a selected date
 * - Edit existing reminders
 * - Delete reminders
 *
 * Usage:
 * <ReminderModal
 *   v-model="showModal"
 *   :recipe="recipe"
 *   :initial-date="selectedDate"
 *   :existing-reminders="reminders"
 *   @saved="handleReminderSaved"
 *   @deleted="handleReminderDeleted"
 * />
 */

import type { Recipe } from '~/types'
import type { RecipeReminderWithRecipe } from '~/composables/useReminders'

interface Props {
  recipe?: Recipe | null
  initialDate?: Date | null
  existingReminders?: RecipeReminderWithRecipe[]
}

const props = withDefaults(defineProps<Props>(), {
  recipe: null,
  initialDate: null,
  existingReminders: () => [],
})

const modelValue = defineModel<boolean>({ default: false })

const emit = defineEmits<{
  (e: 'saved', reminder: RecipeReminderWithRecipe): void
  (e: 'deleted', reminderId: string): void
}>()

const { t } = useI18n()
const { createReminder, updateReminder, deleteReminder, loading: remindersLoading } = useReminders()
const { show: showToast } = useToast()

const show = computed({
  get: () => modelValue.value,
  set: (val) => emit('update:modelValue', val),
})

// Form state
const selectedDate = ref<Date>(props.initialDate ?? new Date())
const selectedTime = ref<string>('12:00')
const note = ref<string>('')
const editingReminderId = ref<string | null>(null)
const isSubmitting = ref(false)

// Combined datetime for the reminder
const reminderDateTime = computed(() => {
  const [hours, minutes] = selectedTime.value.split(':').map(Number)
  const dt = new Date(selectedDate.value)
  dt.setHours(hours, minutes, 0, 0)
  return dt.toISOString()
})

// Format time for display
const formatTime = (isoString: string): string => {
  const d = new Date(isoString)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// Open edit mode for an existing reminder
const openEdit = (reminder: RecipeReminderWithRecipe) => {
  editingReminderId.value = reminder.id
  const d = new Date(reminder.reminderTime)
  selectedDate.value = d
  selectedTime.value = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  note.value = reminder.note || ''
}

const cancelEdit = () => {
  editingReminderId.value = null
  note.value = ''
  selectedTime.value = '12:00'
}

const handleSave = async () => {
  if (isSubmitting.value) return
  isSubmitting.value = true

  try {
    if (editingReminderId.value) {
      // Update existing reminder
      const success = await updateReminder(editingReminderId.value, {
        reminderTime: reminderDateTime.value,
        note: note.value || undefined,
      })
      if (success) {
        showToast(t('reminder.updated'), 'success')
        cancelEdit()
      }
    } else {
      // Create new reminder
      if (!props.recipe) return
      const reminder = await createReminder({
        recipeId: props.recipe.id,
        reminderTime: reminderDateTime.value,
        note: note.value || undefined,
      })
      if (reminder) {
        showToast(t('reminder.created'), 'success')
        emit('saved', reminder)
      }
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async (reminderId: string) => {
  if (!confirm(t('reminder.confirmDelete'))) return
  const success = await deleteReminder(reminderId)
  if (success) {
    showToast(t('reminder.deleted'), 'success')
    emit('deleted', reminderId)
    if (editingReminderId.value === reminderId) {
      cancelEdit()
    }
  }
}

// Reset form when modal opens with new recipe
watch(() => props.recipe, () => {
  cancelEdit()
  selectedDate.value = props.initialDate ?? new Date()
})

watch(() => props.initialDate, (newDate) => {
  if (newDate) selectedDate.value = newDate
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="show"
        class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        @click.self="modelValue = false"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" />

        <!-- Modal panel -->
        <div class="relative w-full sm:max-w-md bg-white dark:bg-stone-800 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[85vh] flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-stone-700">
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-stone-100">
                {{ recipe ? t('reminder.setReminder') : t('reminder.title') }}
              </h3>
              <p v-if="recipe" class="text-sm text-gray-500 dark:text-stone-400 mt-0.5">
                {{ recipe.title }}
              </p>
            </div>
            <button
              @click="modelValue = false"
              class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors"
              :aria-label="t('reminder.cancel')"
            >
              <svg class="w-5 h-5 text-gray-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="overflow-y-auto flex-1 px-5 py-4 space-y-5">
            <!-- Existing reminders for this recipe/date -->
            <div v-if="existingReminders.length > 0 && recipe" class="space-y-3">
              <h4 class="text-sm font-medium text-gray-600 dark:text-stone-400">
                {{ t('reminder.upcoming') }}
              </h4>
              <div
                v-for="reminder in existingReminders"
                :key="reminder.id"
                class="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800/30"
              >
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-800 dark:text-stone-100">
                    {{ formatDate(new Date(reminder.reminderTime)) }}
                    <span class="ml-2 text-orange-600 dark:text-orange-400">
                      {{ formatTime(reminder.reminderTime) }}
                    </span>
                  </p>
                  <p v-if="reminder.note" class="text-xs text-gray-500 dark:text-stone-400 mt-0.5 truncate">
                    {{ reminder.note }}
                  </p>
                </div>
                <div class="flex items-center gap-1 ml-2">
                  <button
                    @click="openEdit(reminder)"
                    class="p-1.5 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                    :aria-label="t('reminder.edit')"
                  >
                    <svg class="w-4 h-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    @click="handleDelete(reminder.id)"
                    class="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    :aria-label="t('reminder.delete')"
                  >
                    <svg class="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Reminder form (only show when recipe is available) -->
            <div v-if="recipe" class="space-y-4">
              <!-- Edit mode banner -->
              <div v-if="editingReminderId" class="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
                <span class="text-sm text-amber-700 dark:text-amber-400">{{ t('reminder.edit') }}</span>
                <button @click="cancelEdit" class="text-sm text-amber-600 dark:text-amber-400 hover:underline">
                  {{ t('reminder.cancel') }}
                </button>
              </div>

              <!-- Date picker -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1.5">
                  {{ t('reminder.time') }}
                </label>
                <div class="flex gap-2">
                  <input
                    v-model="selectedDate"
                    type="date"
                    class="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                  <input
                    v-model="selectedTime"
                    type="time"
                    class="w-32 px-3 py-2 rounded-xl border border-gray-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                  />
                </div>
              </div>

              <!-- Note input -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-stone-300 mb-1.5">
                  {{ t('reminder.note') }}
                </label>
                <textarea
                  v-model="note"
                  :placeholder="t('reminder.notePlaceholder')"
                  rows="2"
                  class="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-stone-600 bg-white dark:bg-stone-700 text-gray-900 dark:text-stone-100 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none"
                />
              </div>

              <!-- Submit button -->
              <button
                @click="handleSave"
                :disabled="isSubmitting || remindersLoading"
                class="w-full py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg v-if="isSubmitting" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>{{ editingReminderId ? t('reminder.save') : t('reminder.create') }}</span>
              </button>
            </div>

            <!-- No recipe selected -->
            <div v-else class="text-center py-8 text-gray-500 dark:text-stone-400">
              <svg class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p class="text-sm">{{ t('reminder.noReminders') }}</p>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition: transform 0.25s ease;
}
.modal-enter-from .modal-panel,
.modal-leave-to .modal-panel {
  transform: translateY(100%);
}
@media (min-width: 640px) {
  .modal-enter-from .modal-panel,
  .modal-leave-to .modal-panel {
    transform: translateY(20px);
  }
}
</style>
