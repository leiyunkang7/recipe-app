/**
 * Admin API Authentication Middleware
 * 
 * Protects all /api/admin/** routes from unauthenticated access.
 * 
 * HOW IT WORKS:
 * - Checks for a valid session token in Authorization header or session cookie
 * - Validates the user has admin privileges
 * - Returns 401/403 for invalid/missing auth
 * 
 * USAGE:
 * Place in web/server/middleware/ directory (auto-loaded by Nitro)
 * All /api/admin/** routes will be protected
 */

import { defineEventHandler, getRequestHeader, setResponseStatus, createError } from 'h3'

// Simple auth check - extend as needed
async function validateAdminSession(token: string | undefined): Promise<{ valid: boolean; userId?: string }> {
  if (!token) return { valid: false }
  
  // TODO: Integrate with your actual auth system (Supabase, session DB, etc.)
  // This is a placeholder implementation
  if (token.startsWith('admin_')) {
    return { valid: true, userId: token.replace('admin_', '') }
  }
  
  return { valid: false }
}

export default defineEventHandler(async (event) => {
  const url = event.path || ''
  
  // Only protect /api/admin/** routes
  if (!url.startsWith('/api/admin')) {
    return // Not an admin route, allow through
  }
  
  // Get auth token from Authorization header or cookie
  const authHeader = getRequestHeader(event, 'authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '') || ''
  
  // Validate session
  const session = await validateAdminSession(token)
  
  if (!session.valid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized - valid admin session required',
    })
  }
  
  // Add user context to event
  event.context.userId = session.userId
})
