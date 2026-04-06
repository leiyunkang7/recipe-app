<script setup lang="ts">
/**
 * FavoritesCalendar - 日历组件
 *
 * 功能：
 * - 显示当前月份的日历视图
 * - 标记有收藏和提醒的日期
 * - 点击日期查看详情
 * - 支持月份切换
 *
 * 使用方式：
 * <FavoritesCalendar
 *   :favorites="favorites"
 *   :reminders="reminders"
 *   @select-date="handleSelectDate"
 * />
 */

import type { Recipe } from '~/types'
import type { RecipeReminderWithRecipe } from '~/composables/useReminders'

interface Props {
  favorites: Array<{
    id: string
    recipeId: string
    createdAt: string
  }>
  reminders: RecipeReminderWithRecipe[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'selectDate', date: Date, favorites: Props['favorites'], reminders: RecipeReminderWithRecipe[]): void
  (e: 'selectRecipe', recipe: Recipe): void
}>()

const { t } = useI18n()

const currentDate = ref(new Date())
const selectedDate = ref<Date | null>(null)

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const currentYear = computed(() => currentDate.value.getFullYear())
const currentMonth = computed(() => currentDate.value.getMonth())

const monthName = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value, 1)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
})

const today = new Date()
today.setHours(0, 0, 0, 0)

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  const startDay = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  const days: Array<{
    date: Date
    isCurrentMonth: boolean
    isToday: boolean
    hasFavorites: boolean
    hasReminders: boolean
    favoritesCount: number
    remindersCount: number
  }> = []

  // Previous month days
  const prevMonth = new Date(year, month, 0)
  const prevMonthDays = prevMonth.getDate()
  for (let i = startDay - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const date = new Date(year, month - 1, day)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      hasFavorites: false,
      hasReminders: false,
      favoritesCount: 0,
      remindersCount: 0,
    })
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dateStr = date.toISOString().split('T')[0]

    const dayFavorites = props.favorites.filter((f) => {
      const favDate = new Date(f.createdAt)
      favDate.setHours(0, 0, 0, 0)
      return favDate.toISOString().split('T')[0] === dateStr
    })

    const dayReminders = props.reminders.filter((r) => {
      const reminderDate = new Date(r.reminderTime)
      reminderDate.setHours(0, 0, 0, 0)
      return reminderDate.toISOString().split('T')[0] === dateStr
    })

    days.push({
      date,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      hasFavorites: dayFavorites.length > 0,
      hasReminders: dayReminders.length > 0,
      favoritesCount: dayFavorites.length,
      remindersCount: dayReminders.length,
    })
  }

  // Next month days
  const remainingDays = 42 - days.length // 6 rows * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      hasFavorites: false,
      hasReminders: false,
      favoritesCount: 0,
      remindersCount: 0,
    })
  }

  return days
})

const prevMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value - 1, 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentYear.value, currentMonth.value + 1, 1)
}

const goToToday = () => {
  currentDate.value = new Date()
}

const selectDate = (day: typeof calendarDays.value[0]) => {
  selectedDate.value = day.date

  const dateStr = day.date.toISOString().split('T')[0]
  const dayFavorites = props.favorites.filter((f) => {
    const favDate = new Date(f.createdAt)
    favDate.setHours(0, 0, 0, 0)
    return favDate.toISOString().split('T')[0] === dateStr
  })

  const dayReminders = props.reminders.filter((r) => {
    const reminderDate = new Date(r.reminderTime)
    reminderDate.setHours(0, 0, 0, 0)
    return reminderDate.toISOString().split('T')[0] === dateStr
  })

  emit('selectDate', day.date, dayFavorites, dayReminders)
}

const getDayClasses = (day: typeof calendarDays.value[0]) => {
  const classes = ['w-full aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-all duration-200']

  if (!day.isCurrentMonth) {
    classes.push('text-gray-300 dark:text-stone-600')
  } else if (day.isToday) {
    classes.push('bg-orange-500 text-white font-semibold ring-2 ring-orange-300 ring-offset-1')
  } else if (selectedDate.value && day.date.getTime() === selectedDate.value.getTime()) {
    classes.push('bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 font-medium')
  } else {
    classes.push('hover:bg-orange-50 dark:hover:bg-stone-700/50 text-gray-700 dark:text-stone-200 cursor-pointer')
  }

  if (day.hasFavorites || day.hasReminders) {
    classes.push('font-medium')
  }

  return classes.join(' ')
}

const getIndicatorClasses = (type: 'favorite' | 'reminder') => {
  if (type === 'favorite') {
    return 'w-1.5 h-1.5 rounded-full bg-red-500'
  }
  return 'w-1.5 h-1.5 rounded-full bg-blue-500'
}
</script>

<template>
  <div class="favorites-calendar bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-gray-100 dark:border-stone-700 overflow-hidden">
    <!-- Header -->
    <div class="calendar-header flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-stone-800 dark:to-stone-700 border-b border-gray-100 dark:border-stone-600">
      <button
        @click="prevMonth"
        class="p-2 rounded-full hover:bg-white/50 dark:hover:bg-stone-600/50 transition-colors"
        aria-label="上个月"
      >
        <svg class="w-5 h-5 text-gray-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div class="flex items-center gap-3">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-stone-100">{{ monthName }}</h3>
        <button
          v-if="currentYear !== today.getFullYear() || currentMonth !== today.getMonth()"
          @click="goToToday"
          class="px-2 py-1 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-md transition-colors"
        >
          今天
        </button>
      </div>

      <button
        @click="nextMonth"
        class="p-2 rounded-full hover:bg-white/50 dark:hover:bg-stone-600/50 transition-colors"
        aria-label="下个月"
      >
        <svg class="w-5 h-5 text-gray-600 dark:text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Week days header -->
    <div class="calendar-weekdays grid grid-cols-7 border-b border-gray-100 dark:border-stone-700">
      <div
        v-for="(day, index) in weekDays"
        :key="day"
        class="py-2 text-center text-xs font-medium text-gray-500 dark:text-stone-400"
        :class="{ 'text-red-500': index === 0 }"
      >
        {{ day }}
      </div>
    </div>

    <!-- Calendar grid -->
    <div class="calendar-grid grid grid-cols-7 p-2 gap-1">
      <div
        v-for="(day, index) in calendarDays"
        :key="index"
        :class="getDayClasses(day)"
        @click="day.isCurrentMonth && selectDate(day)"
      >
        <span class="day-number">{{ day.date.getDate() }}</span>

        <!-- Indicators -->
        <div v-if="day.isCurrentMonth && (day.hasFavorites || day.hasReminders)" class="flex gap-0.5 mt-0.5">
          <span v-if="day.hasFavorites" :class="getIndicatorClasses('favorite')" />
          <span v-if="day.hasReminders" :class="getIndicatorClasses('reminder')" />
        </div>

        <!-- Count badge -->
        <div
          v-if="day.isCurrentMonth && (day.favoritesCount > 0 || day.remindersCount > 0)"
          class="absolute top-0.5 right-0.5"
        />
      </div>
    </div>

    <!-- Legend -->
    <div class="calendar-legend flex items-center justify-center gap-6 py-3 border-t border-gray-100 dark:border-stone-700 bg-gray-50 dark:bg-stone-800/50">
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-red-500" />
        <span class="text-xs text-gray-500 dark:text-stone-400">{{ t('favorites.title') }}</span>
      </div>
      <div class="flex items-center gap-1.5">
        <span class="w-2 h-2 rounded-full bg-blue-500" />
        <span class="text-xs text-gray-500 dark:text-stone-400">{{ t('reminder.title') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.favorites-calendar {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.day-number {
  font-size: 0.875rem;
  line-height: 1;
}
</style>
