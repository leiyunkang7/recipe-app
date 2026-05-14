/**
 * Health Check API Endpoint
 * 
 * Override for Nitro's auto-generated /api/health endpoint
 * that avoids "Nuxt I18n server context has not been set up yet" error.
 * 
 * Usage: GET /api/health
 */

import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const check = query.check as string | undefined

  // Basic health status
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  }

  // Optional: database check
  // Note: ../db/index removed - build fails if referenced but db/ folder doesn't exist
  // TODO: re-add when db module is properly set up
  if (check === 'database') {
    return { ...health, database: 'unavailable', note: 'db module not configured' }
  }

  return health
})
