/**
 * WebSocket Notification Push Endpoint
 *
 * POST /api/notifications/websocket
 * Sends a notification to connected WebSocket clients
 */

import { defineEventHandler, readBody } from 'h3';
import { broadcastToRecipeSubscribers, sendNotificationToUser, broadcastToAll } from "../../api/_ws";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body || !body.type || !body.notification) {
    return {
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Invalid notification payload" },
    };
  }

  const { type, userId, recipeId, notification } = body;

  try {
    switch (type) {
      case "user":
        if (!userId) {
          return { success: false, error: { code: "MISSING_USER_ID", message: "userId is required" } };
        }
        sendNotificationToUser(userId, notification);
        break;
      case "recipe":
        if (!recipeId) {
          return { success: false, error: { code: "MISSING_RECIPE_ID", message: "recipeId is required" } };
        }
        broadcastToRecipeSubscribers(recipeId, notification);
        break;
      case "broadcast":
        broadcastToAll(notification);
        break;
      default:
        return { success: false, error: { code: "INVALID_TYPE", message: "type must be user, recipe, or broadcast" } };
    }
    return { success: true, data: { delivered: true } };
  } catch (error) {
    console.error("[ws-notify] Error:", error);
    return { success: false, error: { code: "DELIVERY_ERROR", message: "Failed to deliver notification" } };
  }
});
