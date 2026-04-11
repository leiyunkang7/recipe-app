/**
 * Vitals Data Storage Utility
 *
 * Simple JSON file-based storage for Core Web Vitals data
 * Suitable for development/testing. For production, consider:
 * - Vercel Analytics (recommended)
 * - InfluxDB/TimescaleDB (time-series database)
 * - Custom analytics pipeline
 */

import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'

const VITALS_DIR = join(process.cwd(), '.vitals-data')
const VITALS_FILE = join(VITALS_DIR, 'vitals.json')

export interface VitalRecord {
  name: string
  value: number
  delta: number
  id: string
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: string
  url?: string
  userAgent?: string
}

interface VitalsData {
  records: VitalRecord[]
  summary: {
    lastUpdated: string
    totalRecords: number
    byMetric: Record<string, { count: number; avgValue: number; goodCount: number }>
  }
}

export async function saveVitalRecord(record: Omit<VitalRecord, 'timestamp'>): Promise<void> {
  try {
    if (!existsSync(VITALS_DIR)) {
      await mkdir(VITALS_DIR, { recursive: true })
    }

    let data: VitalsData
    if (existsSync(VITALS_FILE)) {
      try {
        const content = await import('fs').then(fs => fs.promises.readFile(VITALS_FILE, 'utf-8'))
        data = JSON.parse(content)
      } catch {
        data = { records: [], summary: { lastUpdated: '', totalRecords: 0, byMetric: {} } }
      }
    } else {
      data = { records: [], summary: { lastUpdated: '', totalRecords: 0, byMetric: {} } }
    }

    const newRecord: VitalRecord = {
      ...record,
      timestamp: new Date().toISOString(),
    }

    data.records.push(newRecord)

    if (data.records.length > 10000) {
      data.records = data.records.slice(-10000)
    }

    data.summary.lastUpdated = newRecord.timestamp
    data.summary.totalRecords = data.records.length

    if (!data.summary.byMetric[record.name]) {
      data.summary.byMetric[record.name] = { count: 0, avgValue: 0, goodCount: 0 }
    }
    const metricSummary = data.summary.byMetric[record.name]
    const newCount = metricSummary.count + 1
    metricSummary.avgValue = (metricSummary.avgValue * metricSummary.count + record.value) / newCount
    metricSummary.count = newCount
    if (record.rating === 'good') {
      metricSummary.goodCount++
    }

    await writeFile(VITALS_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (err) {
    console.error('[Vitals Storage] Failed to save record:', err)
  }
}

export async function getVitalsSummary(): Promise<VitalsData['summary'] | null> {
  try {
    if (!existsSync(VITALS_FILE)) {
      return null
    }
    const content = await import('fs').then(fs => fs.promises.readFile(VITALS_FILE, 'utf-8'))
    const data: VitalsData = JSON.parse(content)
    return data.summary
  } catch {
    return null
  }
}
