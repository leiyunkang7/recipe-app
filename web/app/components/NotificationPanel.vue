<script setup lang="ts">
/**
 * NotificationPanel - 通知面板组件
 * 
 * 特性：
 * - 显示通知列表
 * - 标记已读功能
 * - 清空通知功能
 * - 点击外部关闭
 */
import { useNotificationStore } from "~/composables/useNotificationStore"
import { useClickOutside } from "~/composables/useClickOutside"

const emit = defineEmits<{
  (e: "close"): void
}>()

const { t } = useI18n()
const {
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} = useNotificationStore()

const panelRef = ref<HTMLElement | null>(null)
useClickOutside(panelRef, () => emit("close"))

const formatTime = (date: Date) => {
  const now = new Date()
  const diff = now.getTime() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return t("notifications.justNow")
  if (minutes < 60) return t("notifications.minutesAgo", { minutes })
  if (hours < 24) return t("notifications.hoursAgo", { hours })
  return t("notifications.daysAgo", { days })
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "recipe_updated":
      return "📝"
    case "recipe_deleted":
      return "🗑️"
    case "reminder_due":
      return "⏰"
    case "favorite":
      return "❤️"
    case "comment":
      return "💬"
    case "follow":
      return "👋"
    case "system":
      return "⚙️"
    default:
      return "🔔"
  }
}

const handleNotificationClick = (notificationId: string, recipeId?: string) => {
  markAsRead(notificationId)
  if (recipeId) {
    navigateTo(`/recipes/${recipeId}`)
    emit("close")
  }
}
</script>

<template>
  <div
    ref="panelRef"
    class="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden bg-white dark:bg-stone-800 rounded-xl shadow-xl border border-gray-200 dark:border-stone-700 z-50"
  >
    <!-- 面板头部 -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-stone-700">
      <h3 class="font-semibold text-gray-900 dark:text-stone-100">
        {{ t("notifications.title") }}
      </h3>
      <div class="flex items-center gap-2">
        <button
          v-if="unreadCount > 0"
          type="button"
          class="text-xs text-orange-500 hover:text-orange-600 dark:hover:text-orange-400"
          @click="markAllAsRead"
        >
          {{ t("notifications.markAllRead") }}
        </button>
        <button
          v-if="notifications.length > 0"
          type="button"
          class="text-xs text-gray-500 hover:text-gray-600 dark:text-stone-400 dark:hover:text-stone-300"
          @click="clearNotifications"
        >
          {{ t("notifications.clearAll") }}
        </button>
      </div>
    </div>

    <!-- 通知列表 -->
    <div class="max-h-72 overflow-y-auto">
      <div v-if="notifications.length === 0" class="px-4 py-8 text-center text-gray-500 dark:text-stone-400">
        <svg
          class="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-stone-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <p>{{ t("notifications.empty") }}</p>
      </div>

      <ul v-else class="divide-y divide-gray-100 dark:divide-stone-700">
        <li
          v-for="notification in notifications"
          :key="notification.id"
          class="px-4 py-3 hover:bg-gray-50 dark:hover:bg-stone-700/50 cursor-pointer transition-colors"
          :class="{ 'bg-orange-50 dark:bg-orange-900/10': !notification.read }"
          @click="handleNotificationClick(notification.id, notification.recipeId)"
        >
          <div class="flex items-start gap-3">
            <span class="text-xl" role="img" :aria-label="notification.type">
              {{ getNotificationIcon(notification.type) }}
            </span>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="font-medium text-sm text-gray-900 dark:text-stone-100 truncate">
                  {{ notification.title }}
                </p>
                <span
                  v-if="!notification.read"
                  class="w-2 h-2 flex-shrink-0 bg-orange-500 rounded-full"
                />
              </div>
              <p class="text-sm text-gray-500 dark:text-stone-400 line-clamp-2">
                {{ notification.message }}
              </p>
              <p class="mt-1 text-xs text-gray-400 dark:text-stone-500">
                {{ formatTime(notification.createdAt) }}
              </p>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
