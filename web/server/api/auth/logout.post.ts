/**
 * User Logout API Endpoint
 *
 * POST /api/auth/logout
 * Clears the session cookie
 */

import { defineEventHandler } from 'h3';
import { deleteSession, clearSessionCookie, SESSION_COOKIE_NAME } from '../../utils/session';
import type { ServiceResponse } from '@recipe-app/shared-types';

export default defineEventHandler(async (event) => {
  // Get session cookie
  const sessionId = getCookie(event, SESSION_COOKIE_NAME);
  
  if (sessionId) {
    // Delete session from store
    await deleteSession(sessionId);
  }
  
  // Clear cookie
  clearSessionCookie(event);

  return {
    success: true,
  } satisfies ServiceResponse<never>;
});
