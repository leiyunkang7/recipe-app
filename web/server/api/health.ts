/**
 * Health Check API Endpoint
 *
 * Override for Nitro's auto-generated /api/health endpoint
 * that avoids "Nuxt I18n server context has not been set up yet" error.
 *
 * Usage: GET /api/health
 *        GET /api/health?check=database - includes database connectivity check
 */

import { defineEventHandler, getQuery } from 'h3'
import { useDb } from '../utils/db'

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
  if (check === 'database') {
    try {
      const db = useDb()
      // Simple query to test database connectivity
      const _result = await db.query.recipes.findMany({
        columns: { id: true },
        limit: 1
      })
      return { ...health, database: 'connected' }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { ...health, database: 'error', error: message }
    }
  }

  return health
})
