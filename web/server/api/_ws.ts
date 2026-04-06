import { defineWebSocketHandler } from 'h3';
import type { WSMessage, WSClient, SubscribePayload } from '@recipe-app/shared-types';

// In-memory store for connected clients
const clients = new Map<string, WSClient>();
const recipeSubscribers = new Map<string, Set<string>>();

function generateClientId(): string {
  return crypto.randomUUID();
}

function createAckMessage(messageId?: string): WSMessage {
  return {
    type: 'ack',
    payload: { success: true },
    timestamp: Date.now(),
    messageId,
  };
}

function createErrorMessage(error: string, messageId?: string): WSMessage {
  return {
    type: 'error',
    payload: { error },
    timestamp: Date.now(),
    messageId,
  };
}

function createNotificationMessage(notification: unknown, messageId?: string): WSMessage {
  return {
    type: 'notification',
    payload: { notification },
    timestamp: Date.now(),
    messageId,
  };
}

export const websocketHandler = defineWebSocketHandler({
  open(peer) {
    const clientId = generateClientId();
    const client: WSClient = {
      id: clientId,
      userId: null,
      send(message: WSMessage) {
        peer.send(JSON.stringify(message));
      },
    };
    
    clients.set(clientId, client);
    
    // Send welcome ack
    client.send(createAckMessage());
  },

  message(peer, message) {
    const client = Array.from(clients.values()).find(c => c.id === peer.id);
    if (!client) return;

    try {
      const data = typeof message === 'string' ? JSON.parse(message) : message;
      const wsMessage = data as WSMessage;

      switch (wsMessage.type) {
        case 'ping':
          peer.send(JSON.stringify({
            type: 'pong',
            timestamp: Date.now(),
          }));
          break;

        case 'subscribe':
          if (wsMessage.payload) {
            const payload = wsMessage.payload as SubscribePayload;
            client.userId = payload.userId || client.userId;
            
            if (payload.recipeIds) {
              for (const recipeId of payload.recipeIds) {
                // Add to recipe subscribers
                if (!recipeSubscribers.has(recipeId)) {
                  recipeSubscribers.set(recipeId, new Set());
                }
                recipeSubscribers.get(recipeId)!.add(client.id);
              }
            }
          }
          
          peer.send(JSON.stringify(createAckMessage(wsMessage.messageId)));
          break;

        case 'unsubscribe':
          if (wsMessage.payload) {
            const payload = wsMessage.payload as SubscribePayload;
            if (payload.recipeIds) {
              for (const recipeId of payload.recipeIds) {
                const subscribers = recipeSubscribers.get(recipeId);
                if (subscribers) {
                  subscribers.delete(client.id);
                  if (subscribers.size === 0) {
                    recipeSubscribers.delete(recipeId);
                  }
                }
              }
            }
          }
          
          peer.send(JSON.stringify(createAckMessage(wsMessage.messageId)));
          break;

        default:
          peer.send(JSON.stringify(createErrorMessage('Unknown message type', wsMessage.messageId)));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      peer.send(JSON.stringify(createErrorMessage('Failed to process message')));
    }
  },

  close(peer) {
    // Remove client from all recipe subscriptions
    for (const [recipeId, subscribers] of recipeSubscribers.entries()) {
      subscribers.delete(peer.id);
      if (subscribers.size === 0) {
        recipeSubscribers.delete(recipeId);
      }
    }
    
    // Remove client from clients map
    for (const [clientId, client] of clients.entries()) {
      if (client.id === peer.id) {
        clients.delete(clientId);
        break;
      }
    }
  },

  error(peer, error) {
    console.error('WebSocket error for peer:', peer.id, error);
  },
});

// Helper function to broadcast notification to recipe subscribers
export function broadcastToRecipeSubscribers(recipeId: string, notification: unknown) {
  const subscribers = recipeSubscribers.get(recipeId);
  if (!subscribers) return;

  const message = createNotificationMessage(notification);
  
  for (const clientId of subscribers) {
    const client = clients.get(clientId);
    if (client) {
      client.send(message);
    }
  }
}

// Helper function to send notification to specific user
export function sendNotificationToUser(userId: string, notification: unknown) {
  const message = createNotificationMessage(notification);
  
  for (const client of clients.values()) {
    if (client.userId === userId) {
      client.send(message);
    }
  }
}

// Helper function to broadcast to all connected clients
export function broadcastToAll(notification: unknown) {
  const message = createNotificationMessage(notification);
  
  for (const client of clients.values()) {
    client.send(message);
  }
}
