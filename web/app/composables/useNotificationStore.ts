import { ref, readonly, computed } from "vue"
import type { Notification, WSMessage } from "@recipe-app/shared-types"

const notifications = ref<Notification[]>([])
const isConnected = ref(false)
const error = ref<string | null>(null)
const isLoading = ref(false)
const isSyncing = ref(false)

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let shouldReconnect = true
let reconnectAttempts = 0
const maxReconnectAttempts = 5
const reconnectInterval = 3000

// Supabase service for persistence
let notificationService: any = null
let currentUserId: string | null = null

// Supabase Realtime subscription
let unsubscribeRealtime: (() => void) | null = null

function send(message: Omit<WSMessage, "timestamp">) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      ...message,
      timestamp: Date.now(),
      messageId: crypto.randomUUID(),
    }))
  }
}

function sendSubscribe() {
  if (ws?.readyState === WebSocket.OPEN && currentUserId) {
    send({
      type: 'subscribe',
      payload: { userId: currentUserId },
    })
  }
}

/**
 * Subscribe to Supabase Realtime notifications
 * Provides real-time updates when notifications are inserted
 */
function subscribeToRealtime() {
  if (!notificationService || !currentUserId) return
  
  // Unsubscribe existing subscription if any
  if (unsubscribeRealtime) {
    unsubscribeRealtime()
  }
  
  // Create new subscription using the notification service's built-in method
  // This uses Supabase Realtime under the hood
  unsubscribeRealtime = notificationService.subscribeToNewNotifications(
    currentUserId,
    (notification: Notification) => {
      addNotification(notification)
    }
  )
}

function getWebSocketUrl(): string {
  if (typeof window === "undefined") return ""
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${protocol}//${window.location.host}/_ws`
}

/**
 * Initialize the notification service with Supabase client
 * Should be called after user authentication
 */
export function initNotificationService(supabaseClient: any, userId: string) {
  if (!supabaseClient || !userId) return

  notificationService = supabaseClient
  currentUserId = userId

  // Send subscribe message if WebSocket is already connected
  sendSubscribe()

  // Load initial notifications from Supabase
  loadFromSupabase()
}

/**
 * Load notifications from Supabase
 */
async function loadFromSupabase() {
  if (!notificationService || !currentUserId || isSyncing.value) return
  
  isSyncing.value = true
  try {
    const { data, error: fetchError } = await notificationService
      .from('notifications')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (fetchError) {
      console.error('Failed to load notifications from Supabase:', fetchError)
      return
    }

    // Merge with existing notifications, avoiding duplicates
    const existingIds = new Set(notifications.value.map(n => n.id))
    const newNotifications: Notification[] = (data || [])
      .map(mapDbToNotification)
      .filter(n => !existingIds.has(n.id))
    
    if (newNotifications.length > 0) {
      notifications.value = [...newNotifications, ...notifications.value]
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 100)
    }
  } catch (err) {
    console.error('Error loading notifications:', err)
  } finally {
    isSyncing.value = false
  }
}

/**
 * Map Supabase row to Notification type
 */
function mapDbToNotification(row: any): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    recipeId: row.recipe_id || undefined,
    read: row.read,
    createdAt: new Date(row.created_at),
  }
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

        // Send subscribe message with userId if available
        sendSubscribe()

        // Reload from Supabase on reconnect to catch any missed notifications
        if (notificationService && currentUserId) {
          loadFromSupabase()
        }
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage
          if (message.type === "notification" && message.payload) {
            const payload = message.payload as { notification: Notification }
            // Convert date string to Date object if needed
            const notification = {
              ...payload.notification,
              createdAt: new Date(payload.notification.createdAt)
            }
            addNotification(notification)
            
            // Persist to Supabase if service is initialized
            if (notificationService && currentUserId && notification.userId === currentUserId) {
              persistNotification(notification)
            }
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

  function addNotification(notification: Notification) {
    // Avoid duplicates
    const exists = notifications.value.some(n => n.id === notification.id)
    if (!exists) {
      notifications.value.unshift(notification)
      // Keep only last 100 notifications in memory
      if (notifications.value.length > 100) {
        notifications.value = notifications.value.slice(0, 100)
      }
    }
  }

  /**
   * Persist a notification to Supabase
   */
  async function persistNotification(notification: Notification) {
    if (!notificationService || !currentUserId) return
    
    try {
      await notificationService
        .from('notifications')
        .upsert({
          id: notification.id,
          user_id: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          recipe_id: notification.recipeId || null,
          read: notification.read,
          created_at: notification.createdAt.toISOString(),
        }, {
          onConflict: 'id'
        })
    } catch (err) {
      console.error('Failed to persist notification:', err)
    }
  }

  function markAsRead(notificationId: string) {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      
      // Persist to Supabase
      if (notificationService && currentUserId) {
        notificationService
          .from('notifications')
          .update({ read: true })
          .eq('id', notificationId)
          .eq('user_id', currentUserId)
          .then(({ error: updateError }: any) => {
            if (updateError) {
              console.error('Failed to persist markAsRead:', updateError)
            }
          })
      }
    }
  }

  function markAllAsRead() {
    notifications.value.forEach(n => n.read = true)
    
    // Persist to Supabase
    if (notificationService && currentUserId) {
      notificationService
        .from('notifications')
        .update({ read: true })
        .eq('user_id', currentUserId)
        .eq('read', false)
        .then(({ error: updateError }: any) => {
          if (updateError) {
            console.error('Failed to persist markAllAsRead:', updateError)
          }
        })
    }
  }

  function clearNotifications() {
    const toDelete = notifications.value.filter(n => !n.read)
    notifications.value = []
    
    // Delete read notifications from Supabase
    if (notificationService && currentUserId) {
      notificationService
        .from('notifications')
        .delete()
        .eq('user_id', currentUserId)
        .eq('read', true)
        .then(({ error: deleteError }: any) => {
          if (deleteError) {
            console.error('Failed to persist clearNotifications:', deleteError)
          }
        })
    }
  }

  /**
   * Delete a specific notification
   */
  async function deleteNotification(notificationId: string): Promise<boolean> {
    const index = notifications.value.findIndex(n => n.id === notificationId)
    if (index === -1) return false
    
    notifications.value.splice(index, 1)
    
    // Delete from Supabase
    if (notificationService && currentUserId) {
      const { error: deleteError } = await notificationService
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', currentUserId)
      
      if (deleteError) {
        console.error('Failed to delete notification from Supabase:', deleteError)
        return false
      }
    }
    
    return true
  }

  /**
   * Reload notifications from Supabase
   */
  async function reload() {
    if (!notificationService || !currentUserId) return
    await loadFromSupabase()
  }

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
  const isLoadingNotifications = computed(() => isLoading.value)
  const isSyncingNotifications = computed(() => isSyncing.value)

  return {
    notifications: readonly(notifications),
    isConnected: readonly(isConnected),
    error: readonly(error),
    unreadCount,
    isLoadingNotifications,
    isSyncingNotifications,
    connect,
    disconnect,
    send,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    deleteNotification,
    reload,
    initNotificationService,
  }
}
