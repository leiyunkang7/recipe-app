/**
 * Web Vitals Summary API Endpoint
 *
 * Returns aggregated CWV metrics from .vitals-data/vitals.json
 * Use: GET /api/vitals
 *
 * Response:
 * {
 *   lastUpdated: string,
 *   totalRecords: number,
 *   byMetric: { [name]: { count, avgValue, goodCount } }
 * }
 */

import { defineEventHandler } from 'h3'
import { getVitalsSummary } from '../utils/vitals-storage'

export default defineEventHandler(async () => {
  try {
    const summary = await getVitalsSummary()

    if (!summary) {
      return {
        available: false,
        message: 'No vitals data collected yet. Deploy and collect CWV metrics first.',
      }
    }

    // Add availability flag and compute additional stats
    const metrics = Object.entries(summary.byMetric).map(([name, data]) => ({
      name,
      count: data.count,
      avgValue: Math.round(data.avgValue * 100) / 100,
      goodRate: data.count > 0 ? Math.round((data.goodCount / data.count) * 100) : 0,
      goodCount: data.goodCount,
    }))

    return {
      available: true,
      lastUpdated: summary.lastUpdated,
      totalRecords: summary.totalRecords,
      metrics,
    }
  } catch (err: any) {
    console.error('[CWV-GET] Error:', err.message)
    throw createError({ statusCode: 500, message: err.message })
  }
})
