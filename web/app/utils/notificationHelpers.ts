/**
 * Notification helpers for social events
 *
 * Usage:
 *   import { notifyFavorite, notifyComment, notifyFollow } from '~/utils/notificationHelpers'
 *   await notifyFavorite(supabase, { userId: '...', recipeId: '...', actorName: '...' })
 */
import type { Notification, NotificationType } from '@recipe-app/shared-types'

export interface NotifyFavoriteParams {
  supabase: any
  userId: string       // Owner of the recipe (receives notification)
  recipeId: string
  actorId: string       // User who favorited
  actorName: string
  recipeTitle: string
}

export interface NotifyCommentParams {
  supabase: any
  userId: string
  recipeId: string
  actorId: string
  actorName: string
  recipeTitle: string
  commentPreview?: string
}

export interface NotifyFollowParams {
  supabase: any
  userId: string
  actorId: string
  actorName: string
}

/**
 * Create a notification and broadcast via Supabase Realtime
 */
async function createAndBroadcast(
  supabase: any,
  notification: Notification
): Promise<void> {
  // Insert into database
  const { error } = await supabase
    .from('notifications')
    .insert({
      id: notification.id,
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      recipe_id: notification.recipeId || null,
      read: false,
      created_at: notification.createdAt.toISOString(),
    })

  if (error) {
    console.error('[notify] Failed to insert notification:', error)
  }
}

/**
 * Notify recipe owner when someone favorites their recipe
 */
export async function notifyFavorite(params: NotifyFavoriteParams): Promise<void> {
  const { supabase, userId, recipeId, actorId, actorName, recipeTitle } = params

  // Don't notify yourself
  if (actorId === userId) return

  const notification: Notification = {
    id: crypto.randomUUID(),
    userId,
    type: 'favorite',
    title: '收到收藏 ❤️',
    message: `「${actorName}」收藏了你的食谱「${recipeTitle}」`,
    recipeId,
    read: false,
    createdAt: new Date(),
  }

  await createAndBroadcast(supabase, notification)
}

/**
 * Notify recipe owner when someone comments on their recipe
 */
export async function notifyComment(params: NotifyCommentParams): Promise<void> {
  const { supabase, userId, recipeId, actorId, actorName, recipeTitle, commentPreview } = params

  // Don't notify yourself
  if (actorId === userId) return

  const message = commentPreview
    ? `「${actorName}」评论了你的食谱「${recipeTitle}」: ${commentPreview.slice(0, 50)}${commentPreview.length > 50 ? '...' : ''}`
    : `「${actorName}」评论了你的食谱「${recipeTitle}」`

  const notification: Notification = {
    id: crypto.randomUUID(),
    userId,
    type: 'comment',
    title: '收到评论 💬',
    message,
    recipeId,
    read: false,
    createdAt: new Date(),
  }

  await createAndBroadcast(supabase, notification)
}

/**
 * Notify user when someone follows them
 */
export async function notifyFollow(params: NotifyFollowParams): Promise<void> {
  const { supabase, userId, actorId, actorName } = params

  // Don't notify yourself
  if (actorId === userId) return

  const notification: Notification = {
    id: crypto.randomUUID(),
    userId,
    type: 'follow',
    title: '新粉丝 👋',
    message: `「${actorName}」关注了你`,
    read: false,
    createdAt: new Date(),
  }

  await createAndBroadcast(supabase, notification)
}
