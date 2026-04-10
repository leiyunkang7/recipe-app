import { ref, onUnmounted, readonly, computed } from 'vue';
import type { Notification, WSMessage } from '@recipe-app/shared-types';
import { createNotificationService } from '@recipe-app/notification-service';

export interface RealtimeNotificationOptions {
  supabase: unknown;
  userId: string;
  wsUrl?: string;
  enableWebSocket?: boolean;
  enableSupabaseRealtime?: boolean;
}

export interface RealtimeNotificationState {
  notifications: Readonly<Ref<Notification[]>>;
  unreadCount: Readonly<Ref<number>>;
  isConnected: Readonly<Ref<boolean>>;
  isLoading: Readonly<Ref<boolean>>;
  error: Readonly<Ref<string | null>>;
  connect: () => void;
  disconnect: () => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => Promise<boolean>;
  clearAll: () => void;
  reload: () => Promise<void>;
}

/**
 * Unified realtime notification composable
 * Combines WebSocket and Supabase Realtime for notification delivery
 */
export function useRealtimeNotifications(options: RealtimeNotificationOptions): RealtimeNotificationState {
  const {
    supabase,
    userId,
    wsUrl,
    enableWebSocket = false,
    enableSupabaseRealtime = true,
  } = options;

  const notifications = ref<Notification[]>([]);
  const isConnected = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let shouldReconnect = true;
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;
  const reconnectInterval = 3000;

  let notificationService: ReturnType<typeof createNotificationService> | null = null;
  let unsubscribeRealtime: (() => void) | null = null;

  function getWebSocketUrl(): string {
    if (typeof window === 'undefined') return '';
    if (wsUrl) return wsUrl;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/_ws`;
  }

  function initSupabaseService() {
    if (!supabase || !userId) return;
    notificationService = createNotificationService(supabase);
  }

  async function loadNotifications() {
    if (!notificationService || !userId || isLoading.value) return;

    isLoading.value = true;
    try {
      const result = await notificationService.fetchByUserId(userId, { limit: 100 });
      if (result.success && result.data) {
        notifications.value = result.data;
      }
    } catch (err) {
      console.error('[realtime-notifications] Load error:', err);
    } finally {
      isLoading.value = false;
    }
  }

  function subscribeToSupabaseRealtime() {
    if (!notificationService || !userId || !enableSupabaseRealtime) return;

    unsubscribeRealtime = notificationService.subscribeToNewNotifications(
      userId,
      (notification: Notification) => {
        addNotification(notification);
      }
    );
    isConnected.value = true;
  }

  function connectWebSocket() {
    if (!enableWebSocket || typeof window === 'undefined') return;
    if (ws?.readyState === WebSocket.OPEN) return;

    const url = getWebSocketUrl();
    if (!url) return;

    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        isConnected.value = true;
        error.value = null;
        reconnectAttempts = 0;

        ws?.send(JSON.stringify({
          type: 'subscribe',
          payload: { userId },
          timestamp: Date.now(),
          messageId: crypto.randomUUID(),
        }));

        loadNotifications();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;
          if (message.type === 'notification' && message.payload) {
            const payload = message.payload as { notification: Notification };
            const notification = {
              ...payload.notification,
              createdAt: new Date(payload.notification.createdAt),
            };
            addNotification(notification);
          }
        } catch (e) {
          console.error('[ws] Failed to parse message:', e);
        }
      };

      ws.onerror = () => {
        error.value = 'WebSocket connection error';
      };

      ws.onclose = () => {
        isConnected.value = false;
        if (shouldReconnect && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          reconnectTimer = setTimeout(connectWebSocket, reconnectInterval);
        }
      };
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to connect';
    }
  }

  function connect() {
    initSupabaseService();
    loadNotifications();
    subscribeToSupabaseRealtime();
    if (enableWebSocket) {
      connectWebSocket();
    }
  }

  function disconnect() {
    shouldReconnect = false;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      ws.close();
      ws = null;
    }
    if (unsubscribeRealtime) {
      unsubscribeRealtime();
      unsubscribeRealtime = null;
    }
    isConnected.value = false;
  }

  function addNotification(notification: Notification) {
    const exists = notifications.value.some(n => n.id === notification.id);
    if (!exists) {
      notifications.value = [notification, ...notifications.value].slice(0, 100);
    }
  }

  async function markAsRead(notificationId: string) {
    const notification = notifications.value.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      if (notificationService) {
        await notificationService.markAsRead(notificationId, userId);
      }
    }
  }

  async function markAllAsRead() {
    notifications.value.forEach(n => (n.read = true));
    if (notificationService) {
      await notificationService.markAllAsRead(userId);
    }
  }

  async function deleteNotification(notificationId: string): Promise<boolean> {
    const index = notifications.value.findIndex(n => n.id === notificationId);
    if (index === -1) return false;

    notifications.value.splice(index, 1);
    if (notificationService) {
      const result = await notificationService.delete(notificationId, userId);
      return result.success;
    }
    return true;
  }

  async function clearAll() {
    notifications.value = [];
    if (notificationService) {
      await notificationService.clearAll(userId);
    }
  }

  async function reload() {
    await loadNotifications();
  }

  onUnmounted(() => {
    disconnect();
  });

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);

  return {
    notifications: readonly(notifications),
    unreadCount,
    isConnected: readonly(isConnected),
    isLoading: readonly(isLoading),
    error: readonly(error),
    connect,
    disconnect,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    reload,
  };
}
