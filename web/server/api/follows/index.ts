/**
 * User Follows API
 *
 * GET  /api/follows?userId=xxx&list=followers|following - Get user's followers/following
 * POST /api/follows - Follow a user
 * DELETE /api/follows?userId=xxx - Unfollow a user
 */

import { defineEventHandler, getQuery, readBody } from 'h3';
import { eq, and } from 'drizzle-orm';
import { useDb } from '../../utils/db';
import { userFollows, users } from '@recipe-app/database';
import { getCurrentUser } from '../../utils/session';
import { rateLimiters } from '../../utils/rateLimit';
import { sendNotificationToUser } from '../_ws';
import type { Notification } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  const method = event.method;
  const db = useDb();

  // GET - Get followers or following list
  if (method === 'GET') {
    const query = getQuery(event);
    const targetUserId = query.userId as string;
    const listType = (query.list as string) || 'followers'; // 'followers' or 'following'

    if (!targetUserId) {
      return { success: false, error: { code: 'MISSING_USER_ID', message: 'userId is required' } };
    }

    try {
      let results;

      if (listType === 'following') {
        results = await db
          .select({
            userId: userFollows.followingId,
            followedAt: userFollows.createdAt,
          })
          .from(userFollows)
          .where(eq(userFollows.followerId, targetUserId));
      } else {
        results = await db
          .select({
            userId: userFollows.followerId,
            followedAt: userFollows.createdAt,
          })
          .from(userFollows)
          .where(eq(userFollows.followingId, targetUserId));
      }

      return { success: true, data: results };
    } catch (error) {
      console.error('[follows] Fetch error:', error);
      return { success: false, error: { code: 'FETCH_ERROR', message: 'Failed to fetch follows' } };
    }
  }

  // POST - Follow a user
  await rateLimiters.userAction(event);
  if (method === 'POST') {
    const user = await getCurrentUser(event);
    if (!user) {
      return { success: false, error: { code: 'NOT_AUTHENTICATED', message: 'Must be logged in to follow' } };
    }

    const body = await readBody(event);
    const { userId: targetUserId } = body;

    if (!targetUserId) {
      return { success: false, error: { code: 'MISSING_USER_ID', message: 'userId is required' } };
    }

    if (targetUserId === user.id) {
      return { success: false, error: { code: 'INVALID', message: 'Cannot follow yourself' } };
    }

    try {
      await db.insert(userFollows).values({
        followerId: user.id,
        followingId: targetUserId,
      }).onConflictDoNothing();

      // Send WebSocket notification to the followed user (real-time)
      // Note: Database trigger also creates notification in DB for persistence
      try {
        const notification: Notification = {
          id: crypto.randomUUID(),
          userId: targetUserId,
          type: 'follow',
          title: '👤 New Follower',
          message: `${user.displayName || 'Someone'} started following you`,
          read: false,
          createdAt: new Date(),
        };
        sendNotificationToUser(targetUserId, notification);
      } catch (wsErr) {
        console.warn('[follows] WebSocket notification failed:', wsErr);
      }

      return { success: true };
    } catch (error) {
      console.error('[follows] Follow error:', error);
      return { success: false, error: { code: 'INSERT_ERROR', message: 'Failed to follow user' } };
    }
  }

  // DELETE - Unfollow a user
  if (method === 'DELETE') {
    const user = await getCurrentUser(event);
    if (!user) {
      return { success: false, error: { code: 'NOT_AUTHENTICATED', message: 'Must be logged in to unfollow' } };
    }

    const query = getQuery(event);
    const targetUserId = query.userId as string;

    if (!targetUserId) {
      return { success: false, error: { code: 'MISSING_USER_ID', message: 'userId is required' } };
    }

    try {
      await db.delete(userFollows).where(
        and(
          eq(userFollows.followerId, user.id),
          eq(userFollows.followingId, targetUserId)
        )
      );

      return { success: true };
    } catch (error) {
      console.error('[follows] Unfollow error:', error);
      return { success: false, error: { code: 'DELETE_ERROR', message: 'Failed to unfollow user' } };
    }
  }

  return { success: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'Only GET, POST, DELETE allowed' } };
});
