import { getCookie, setCookie, deleteCookie } from 'h3';
import { eq } from 'drizzle-orm';
import { useDb } from './db';
import { users } from '@recipe-app/database';
import type { User } from '@recipe-app/shared-types';

// Session configuration
const SESSION_COOKIE_NAME = 'session_id';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Simple session store (in production, use Redis or database)
const sessionStore = new Map<string, { userId: string; expiresAt: Date }>();

export interface SessionData {
  userId: string;
}

/**
 * Generate a random session ID
 */
function generateSessionId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  
  sessionStore.set(sessionId, { userId, expiresAt });
  
  return sessionId;
}

/**
 * Get session data by session ID
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  const session = sessionStore.get(sessionId);
  
  if (!session) {
    return null;
  }
  
  if (session.expiresAt < new Date()) {
    sessionStore.delete(sessionId);
    return null;
  }
  
  return { userId: session.userId };
}

/**
 * Delete a session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  sessionStore.delete(sessionId);
}

/**
 * Get current user from request
 */
export async function getCurrentUser(event: unknown): Promise<User | null> {
  const sessionId = getCookie(event, SESSION_COOKIE_NAME);
  
  if (!sessionId) {
    return null;
  }
  
  const session = await getSession(sessionId);
  
  if (!session) {
    return null;
  }
  
  const db = useDb();
  const result = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  
  if (result.length === 0) {
    return null;
  }
  
  const user = result[0]!;
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    role: user.role as 'admin' | 'editor' | 'user',
    emailVerified: user.emailVerified,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Set session cookie
 */
export function setSessionCookie(event: unknown, sessionId: string): void {
  setCookie(event, SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(event: unknown): void {
  deleteCookie(event, SESSION_COOKIE_NAME);
}

export { SESSION_COOKIE_NAME };
