import { ref, onUnmounted, readonly, computed, type Ref } from 'vue';
import type { WSMessage, Notification } from '@recipe-app/shared-types';

export interface WebSocketOptions {
  url: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
}

export interface WebSocketState {
  isConnected: Readonly<Ref<boolean>>;
  lastMessage: Readonly<Ref<WSMessage | null>>;
  error: Readonly<Ref<string | null>>;
  connect: () => void;
  disconnect: () => void;
  send: (message: Omit<WSMessage, 'timestamp'>) => void;
  subscribeToRecipe: (recipeId: string) => void;
  unsubscribeFromRecipe: (recipeId: string) => void;
}

export function useWebSocket(options: WebSocketOptions): WebSocketState {
  const {
    url,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    pingInterval = 30000,
  } = options;

  const isConnected = ref(false);
  const lastMessage = ref<WSMessage | null>(null);
  const error = ref<string | null>(null);
  const subscribedRecipes = ref<Set<string>>(new Set());

  let ws: WebSocket | null = null;
  let reconnectAttempts = 0;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let shouldReconnect = autoReconnect;

  function connect() {
    if (ws?.readyState === WebSocket.OPEN) return;

    try {
      ws = new WebSocket(url);

      ws.onopen = () => {
        isConnected.value = true;
        error.value = null;
        reconnectAttempts = 0;
        startPing();

        if (subscribedRecipes.value.size > 0) {
          send({
            type: 'subscribe',
            payload: {
              userId: '',
              recipeIds: Array.from(subscribedRecipes.value),
            },
          });
        }
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;
          lastMessage.value = message;
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      ws.onerror = (event) => {
        error.value = 'WebSocket connection error';
        console.error('WebSocket error:', event);
      };

      ws.onclose = () => {
        isConnected.value = false;
        stopPing();

        if (shouldReconnect && reconnectAttempts < maxReconnectAttempts) {
          reconnectAttempts++;
          reconnectTimer = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }

        if (reconnectAttempts >= maxReconnectAttempts) {
          error.value = 'Max reconnection attempts reached';
        }
      };
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to connect';
    }
  }

  function disconnect() {
    shouldReconnect = false;
    stopPing();
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      ws.close();
      ws = null;
    }
    isConnected.value = false;
  }

  function send(message: Omit<WSMessage, 'timestamp'>) {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        ...message,
        timestamp: Date.now(),
        messageId: crypto.randomUUID(),
      }));
    }
  }

  function subscribeToRecipe(recipeId: string) {
    subscribedRecipes.value.add(recipeId);
    if (isConnected.value) {
      send({
        type: 'subscribe',
        payload: {
          userId: '',
          recipeIds: [recipeId],
        },
      });
    }
  }

  function unsubscribeFromRecipe(recipeId: string) {
    subscribedRecipes.value.delete(recipeId);
    if (isConnected.value) {
      send({
        type: 'unsubscribe',
        payload: {
          userId: '',
          recipeIds: [recipeId],
        },
      });
    }
  }

  function startPing() {
    stopPing();
    pingTimer = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        send({ type: 'ping' });
      }
    }, pingInterval);
  }

  function stopPing() {
    if (pingTimer) {
      clearInterval(pingTimer);
      pingTimer = null;
    }
  }

  onUnmounted(() => {
    disconnect();
  });

  return {
    isConnected: readonly(isConnected),
    lastMessage: readonly(lastMessage),
    error: readonly(error),
    connect,
    disconnect,
    send,
    subscribeToRecipe,
    unsubscribeFromRecipe,
  };
}
