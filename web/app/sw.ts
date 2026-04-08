/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'vite-plugin-pwa/assets'
import { clientsClaim } from 'workbox-core'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare let self: ServiceWorkerGlobalScope

const CACHE_NAMES = {
  staticAssets: 'static-assets-v1',
  images: 'images-v1',
  googleFonts: 'google-fonts-v1',
  recipeApi: 'recipe-api-v1',
  otherApi: 'other-api-v1',
  supabaseImages: 'supabase-images-v1',
  externalImages: 'external-images-v1',
  vercelAssets: 'vercel-assets-v1',
  pages: 'pages-v1',
  prefetch: 'prefetch-v1',
} as const

const PRECACHE_URLS = [
  '/',
  '/recipes',
  '/offline',
  '/favorites',
]

self.skipWaiting()
clientsClaim()

precacheAndRoute(
  PRECACHE_URLS.map(url => ({ url, revision: Date.now().toString() })),
  { cacheName: CACHE_NAMES.staticAssets, cleanUrls: false }
)

cleanupOutdatedCaches()

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAMES.prefetch).then(cache => cache.addAll(PRECACHE_URLS).catch(() => {})),
      (self as unknown as ServiceWorkerGlobalScope).skipWaiting(),
    ])
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  if (request.method !== 'GET') return
  if (!url.protocol.startsWith('http')) return

  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(new CacheFirst({
      cacheName: CACHE_NAMES.staticAssets,
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 })],
    }).handle({ request, event }))
    return
  }

  if (request.destination === 'image') {
    event.respondWith(new CacheFirst({
      cacheName: CACHE_NAMES.images,
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 })],
    }).handle({ request, event }))
    return
  }

  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(new StaleWhileRevalidate({
      cacheName: CACHE_NAMES.googleFonts,
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 })],
    }).handle({ request, event }))
    return
  }

  if (url.pathname.startsWith('/api/recipes') || url.pathname.startsWith('/api/my-recipes')) {
    event.respondWith(new NetworkFirst({
      cacheName: CACHE_NAMES.recipeApi,
      networkTimeoutSeconds: 10,
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 })],
    }).handle({ request, event }))
    return
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(new NetworkFirst({
      cacheName: CACHE_NAMES.otherApi,
      networkTimeoutSeconds: 10,
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 })],
    }).handle({ request, event }))
    return
  }

  if (url.hostname.includes('supabase') || url.hostname.includes('sb')) {
    event.respondWith(new CacheFirst({
      cacheName: CACHE_NAMES.supabaseImages,
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 })],
    }).handle({ request, event }))
    return
  }

  if (url.origin.includes('images.unsplash.com') || url.origin.includes('unsplash.com') || url.origin.includes('pexels.com')) {
    event.respondWith(new CacheFirst({
      cacheName: CACHE_NAMES.externalImages,
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 })],
    }).handle({ request, event }))
    return
  }

  if (url.hostname.includes('vercel') || url.hostname.includes('vercel.app')) {
    event.respondWith(new StaleWhileRevalidate({
      cacheName: CACHE_NAMES.vercelAssets,
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 })],
    }).handle({ request, event }))
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(new NetworkFirst({
      cacheName: CACHE_NAMES.pages,
      networkTimeoutSeconds: 3,
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] }), new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 })],
    }).handle({ request, event }))
    return
  }
})

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData())
  }
})

async function syncData() {
  const clients = await self.clients.matchAll({ type: 'window' })
  clients.forEach(client => client.postMessage({ type: 'SYNC_STATUS', status: 'syncing' }))
  try {
    await Promise.resolve()
    clients.forEach(client => client.postMessage({ type: 'SYNC_STATUS', status: 'idle' }))
  } catch {
    clients.forEach(client => client.postMessage({ type: 'SYNC_STATUS', status: 'error' }))
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
  if (event.data?.type === 'CLEAR_CACHE') {
    Object.values(CACHE_NAMES).forEach(cacheName => caches.delete(cacheName))
    event.ports[0]?.postMessage({ success: true })
  }
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: '1.0.0' })
  }
})

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-for-updates') event.waitUntil(checkForUpdates())
})

async function checkForUpdates() {
  try {
    const response = await fetch('/api/version')
    if (response.ok) {
      const data = await response.json()
      const clients = await self.clients.matchAll({ type: 'window' })
      clients.forEach(client => client.postMessage({ type: 'UPDATE_AVAILABLE', version: data.version }))
    }
  } catch {}
}

export {}
