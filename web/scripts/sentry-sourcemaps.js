#!/usr/bin/env node
/**
 * Sentry Source Map Upload Script
 *
 * Uploads source maps from the .output directory to Sentry.
 * This is an alternative to the automatic @sentry/vite-plugin upload.
 * Run manually or in CI/CD after a production build.
 *
 * Usage:
 *   node scripts/sentry-sourcemaps.js
 *
 * Environment variables required:
 *   SENTRY_AUTH_TOKEN  - Sentry auth token (from https://sentry.io/settings/<org>/api-keys/)
 *   SENTRY_ORG         - Sentry organization slug
 *   SENTRY_PROJECT     - Sentry project name (e.g., recipe-app-web)
 *   SENTRY_DSN         - Sentry DSN (optional, used to extract project URL)
 *
 * Optional:
 *   SENTRY_URL         - Sentry instance URL (default: https://sentry.io)
 *   SENTRY_PREFIX      - URL prefix for stack trace paths (e.g., ~/ or /_nuxt/)
 *   SENTRY_ENV        - Environment name (production, staging, etc.)
 */

'use strict'

const { existsSync, readdirSync, statSync, createReadStream } = require('fs')
const { join, relative } = require('path')

// ---- Configuration ----
const AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN || ''
const ORG = process.env.SENTRY_ORG || ''
const PROJECT = process.env.SENTRY_PROJECT || ''
const SENTRY_URL = process.env.SENTRY_URL || 'https://sentry.io'
const PREFIX = process.env.SENTRY_PREFIX || '~/'
const ENVIRONMENT = process.env.SENTRY_ENV || 'production'
const OUTPUT_DIR = join(__dirname, '..', '.output')

// ---- Validation ----
function validate() {
  const missing = []
  if (!AUTH_TOKEN) missing.push('SENTRY_AUTH_TOKEN')
  if (!ORG) missing.push('SENTRY_ORG')
  if (!PROJECT) missing.push('SENTRY_PROJECT')

  if (missing.length > 0) {
    console.error(`[Sentry] Missing required env vars: ${missing.join(', ')}`)
    console.error('Set them in .env or export them in your CI/CD pipeline.')
    process.exit(1)
  }
}

// ---- Find all .js.map files ----
function findSourceMaps(dir, files = []) {
  if (!existsSync(dir)) return files

  for (const item of readdirSync(dir)) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      // Skip node_modules and hidden dirs
      if (!item.startsWith('.') && item !== 'node_modules') {
        findSourceMaps(fullPath, files)
      }
    } else if (item.endsWith('.js.map')) {
      // Only include minified client bundles (skip Nitro server maps)
      const isClientMap = item.includes('.js.map') && !item.includes('server')
      if (isClientMap) {
        files.push(fullPath)
      }
    }
  }

  return files
}

// ---- Upload a single source map ----
async function uploadSourceMap(filePath, index = 1, total = 1) {
  const fileName = relative(OUTPUT_DIR, filePath).replace(/\\/g, '/')
  const _jsPath = filePath.replace(/\.map$/, '')

  console.log(`[${index}/${total}] Uploading: ${fileName}`)

  const body = new FormData()
  body.append('file', createReadStream(filePath), fileName)
  body.append('name', `~/${fileName.replace(/\.map$/, '')}`)
  body.append('content_type', 'application/json')
  body.append('sourcemap', `~/${fileName.replace(/\.map$/, '')}`)

  const url = `${SENTRY_URL}/api/0/projects/${ORG}/${PROJECT}/files/source-maps/`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    console.log(`  ✅ Uploaded: ${fileName}`)
    return true
  } catch (err) {
    console.error(`  ❌ Failed: ${fileName} - ${err.message}`)
    return false
  }
}

// ---- Main ----
async function main() {
  console.log('[Sentry] Source Map Upload Script')
  console.log('================================')
  console.log(`Org:       ${ORG}`)
  console.log(`Project:   ${PROJECT}`)
  console.log(`URL:       ${SENTRY_URL}`)
  console.log(`Prefix:    ${PREFIX}`)
  console.log(`Env:       ${ENVIRONMENT}`)
  console.log(`Output:    ${OUTPUT_DIR}`)
  console.log('')

  validate()

  const maps = findSourceMaps(join(OUTPUT_DIR, 'client'))
  const serverMaps = findSourceMaps(join(OUTPUT_DIR, 'server'))

  if (serverMaps.length > 0) {
    console.warn('[Sentry] Note: Skipping server-side source maps (not needed for client debugging)')
  }

  if (maps.length === 0) {
    console.warn('[Sentry] No client source maps found in .output/client. Run `nuxt build` first.')
    process.exit(0)
  }

  console.log(`[Sentry] Found ${maps.length} source map(s)\n`)

  let successCount = 0
  let failCount = 0

  for (let i = 0; i < maps.length; i++) {
    const ok = await uploadSourceMap(maps[i], i + 1, maps.length)
    if (ok) successCount++
    else failCount++
  }

  console.log('')
  console.log('================================')
  console.log(`[Sentry] Done: ${successCount} uploaded, ${failCount} failed`)

  if (failCount > 0) {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('[Sentry] Fatal error:', err.message)
  process.exit(1)
})
