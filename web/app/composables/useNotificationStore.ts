import { ref, readonly, computed } from "vue"
import type { Notification, WSMessage } from "@recipe-app/shared-types"

const notifications = ref<Notification[]>([])
const isConnected = ref(false)
const error = ref<string | null>(null)

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let shouldReconnect = true
let reconnectAttempts = 0
const maxReconnectAttempts = 5
const reconnectInterval = 3000

function getWebSocketUrl(): string {
  if (typeof window === "undefined") return ""
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${protocol}//${window.location.host}/_ws`
}

export function useNotificationStore() {
  function connect() {
    if (typeof window === "undefined") return
    if (ws?.readyState === WebSocket.OPEN) return

    const url = getWebSocketUrl()
    if (!url) return

    try {
      ws = new WebSocket(url)

      ws.onopen = () => {
        isConnected.value = true
        error.value = null
        reconnectAttempts = 0
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage
          if (message.type === "notification" && message.payload) {
            const payload = message.payload as { notification: Notification }
            addNotification(payload.notification)
          }
        } catch (e) {
          console.error("Failed to parse notification message:", e)
        }
      }

      ws.onerror = () => {
        error.value = "WebSocket connection error"
      }

      ws.onclose = () => {
        isConnected.value = false
        if (shouldReconnect && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++
          reconnectTimer = setTimeout(connect, reconnectInterval)
        }
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to connect"
    }
  }

  function disconnect() {
    shouldReconnect = false
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (ws) {
      ws.close()
      ws = null
    }
    isConnected.value = false
  }

  function send(message: Omit<WSMessage, "timestamp">) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        ...message,
        timestamp: Date.now(),
        messageId: crypto.randomUUID(),
      }))
    }
  }

  function addNotification(notification: Notification) {
    notifications.value.unshift(notification)
  }

  function markAsRead(notificationId: string) {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  function markAllAsRead() {
    notifications.value.forEach(n => n.read = true)
  }

  function clearNotifications() {
    notifications.value = []
  }

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

  return {
    notifications: readonly(notifications),
    isConnected: readonly(isConnected),
    error: readonly(error),
    unreadCount,
    connect,
    disconnect,
    send,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  }
}
