/**
 * Sentry Vite Plugin for Source Map Upload
 *
 * This file handles automatic source map upload to Sentry after production builds.
 * It is loaded in nuxt.config.ts via vite.plugins.
 *
 * Usage:
 *   1. Set environment variables (in .env or CI/CD secrets):
 *      SENTRY_AUTH_TOKEN=<your-sentry-auth-token>
 *      SENTRY_DSN=https://...@sentry.io/projectId
 *      SENTRY_ORG=<your-org-slug>
 *      SENTRY_PROJECT=recipe-app-web
 *
 *   2. The plugin automatically:
 *      - Uploads source maps after `nuxt build`
 *      - Deletes local .js.map files after upload
 *      - Skips in non-production builds (NODE_ENV !== 'production')
 *
 * Setup:
 *   - Auth token: https://sentry.io/settings/<org>/api-keys/
 *   - Create with scope: release:admin, project:write
 */

const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN
const SENTRY_DSN = process.env.SENTRY_DSN
const SENTRY_ORG = process.env.SENTRY_ORG || 'your-org-slug'
const SENTRY_PROJECT = process.env.SENTRY_PROJECT || 'recipe-app-web'
const IS_PROD = process.env.NODE_ENV === 'production'

// Skip if credentials are missing
if (!SENTRY_AUTH_TOKEN || !SENTRY_DSN) {
  if (IS_PROD) {
    console.warn(
      '[Sentry][Vite] SENTRY_AUTH_TOKEN or SENTRY_DSN not set. Source maps will NOT be uploaded.',
      'Set these env vars to enable source map uploads.',
    )
  }
}

// Dynamically import Sentry vite plugin (only loaded when credentials exist)
let cachedSentryPlugin = null

async function getSentryPlugin() {
  if (cachedSentryPlugin) return cachedSentryPlugin

  if (!SENTRY_AUTH_TOKEN || !SENTRY_DSN) return null

  try {
    const module = await import('@sentry/vite-plugin')
    cachedSentryPlugin = module.default
    return cachedSentryPlugin
  } catch (err) {
    console.warn('[Sentry][Vite] Failed to load @sentry/vite-plugin:', err.message)
    return null
  }
}

/**
 * Vite plugin factory — returns the Sentry plugin config.
 * Nuxt will call this at build time.
 */
export default async function sentryVitePlugin() {
  // In dev mode, skip entirely (no upload needed)
  if (!IS_PROD) {
    return null
  }

  const Plugin = await getSentryPlugin()
  if (!Plugin) {
    // No credentials or failed to load — return a no-op plugin
    return {
      name: 'sentry-sourcemaps-disabled',
      enforce: 'pre',
    }
  }

  console.log(
    `[Sentry][Vite] Configuring source map upload for ${SENTRY_ORG}/${SENTRY_PROJECT}`,
  )

  return Plugin({
    org: SENTRY_ORG,
    project: SENTRY_PROJECT,
    authToken: SENTRY_AUTH_TOKEN,
    // Upload source maps after Rollup writes them
    upload: true,
    // Remove .js.map files after successful upload (don't expose to users)
    deleteSourcemapsAfterUpload: true,
    // Don't run in non-production
    disable: !IS_PROD,
    // Suppress plugin warnings if credentials missing
    silent: !SENTRY_AUTH_TOKEN,
    // Include client + server (Nitro SSR) source maps
    include: './.output/**/*.js.map',
    // Ignore test / dev artifacts
    ignore: ['node_modules', '.output/client', '.output/server'],
    // URL prefix for stack trace frame locations
    urlPrefix: '~/',
    // Rewrite function names and line/column numbers
    rewrite: true,
    // Suppress info logs in CI
    telemetry: false,
  })
}
