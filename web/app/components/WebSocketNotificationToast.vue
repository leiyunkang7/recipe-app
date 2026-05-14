<script setup lang="ts">
/**
 * WebSocketNotificationToast - WebSocket 实时通知 Toast 组件
 *
 * 功能：
 * - 监听 WebSocket 实时通知
 * - 当收到新通知时显示 Toast 弹出
 * - 自动消失
 * - 仅显示来自其他用户的通知（避免重复提示）
 *
 * 使用方式：
 * 在 app.vue 或 layout 中添加 <WebSocketNotificationToast />
 */
import { watch, ref, onMounted, onUnmounted } from "vue"
import { useNotificationStore } from "~/composables/useNotificationStore"
import { useToast } from "~/composables/useToast"

const props = defineProps<{
  /** 当前用户 ID，用于过滤自己的通知 */
  currentUserId?: string
}>()

const notificationStore = useNotificationStore()
const toast = useToast()

// Track processed notification IDs to avoid duplicates
const processedIds = ref<Set<string>>(new Set())

// Notification type definition
interface Notification {
  id: string
  userId?: string
  type: string
  title: string
  message: string
  recipeId?: string
  read: boolean
  createdAt: Date
}

// Get notification icon based on type
function getToastType(type: string): "info" | "success" | "error" | "warning" {
  switch (type) {
    case "recipe_updated":
      return "info"
    case "recipe_deleted":
      return "warning"
    case "reminder_due":
      return "success"
    case "favorite":
      return "success"
    case "comment":
      return "info"
    case "follow":
      return "success"
    case "system":
      return "info"
    default:
      return "info"
  }
}

// Show toast for a notification
function showNotificationToast(notification: Notification) {
  // Skip if already processed
  if (processedIds.value.has(notification.id)) {
    return
  }
  processedIds.value.add(notification.id)

  // Limit the size of processed IDs set
  if (processedIds.value.size > 100) {
    const firstKey = processedIds.value.values().next().value
    if (firstKey !== undefined) {
      processedIds.value.delete(firstKey)
    }
  }

  // Skip notifications from current user (toast only shows for other users' actions)
  if (notification.userId === props.currentUserId) {
    return
  }

  const toastType = getToastType(notification.type)
  toast.show(notification.message, toastType, 5000)
}

// Watch for new notifications
let unwatch: (() => void) | null = null

onMounted(() => {
  // Process existing notifications to avoid showing old ones
  notificationStore.notifications.value.forEach(n => {
    processedIds.value.add(n.id)
  })

  // Watch for changes to notifications array
  unwatch = watch(
    () => notificationStore.notifications.value,
    (newNotifications, oldNotifications) => {
      if (!newNotifications || !oldNotifications) return

      // Find new notifications (added at the beginning)
      if (newNotifications.length > oldNotifications.length) {
        // Get the IDs of old notifications
        const oldIds = new Set(oldNotifications.map(n => n.id))

        // Find new notifications
        for (const notification of newNotifications) {
          if (!oldIds.has(notification.id)) {
            showNotificationToast(notification as Notification)
            break // Only show the most recent one
          }
        }
      }
    },
    { deep: true }
  )
})

onUnmounted(() => {
  if (unwatch) {
    unwatch()
  }
})
</script>

<template>
  <!-- 此组件不渲染任何内容，仅用于监听和显示 Toast -->
  <slot />
</template>
