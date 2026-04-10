/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'vite-plugin-pwa/assets'
import { clientsClaim } from 'workbox-core'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'

declare let self: ServiceWorkerGlobalScope

const CACHE_VERSION = 'v2'
const CACHE_NAMES = {
  staticAssets: `static-assets-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`,
  googleFonts: `google-fonts-${CACHE_VERSION}`,
  recipeApi: `recipe-api-${CACHE_VERSION}`,
  otherApi: `other-api-${CACHE_VERSION}`,
  supabaseImages: `supabase-images-${CACHE_VERSION}`,
  externalImages: `external-images-${CACHE_VERSION}`,
  vercelAssets: `vercel-assets-${CACHE_VERSION}`,
  pages: `pages-${CACHE_VERSION}`,
  prefetch: `prefetch-${CACHE_VERSION}`,
} as const

const PRECACHE_URLS = [
  '/',
  '/recipes',
  '/offline',
  '/favorites',
]

// IndexedDB for offline data
const IDB_NAME = 'recipe-app-offline'
const IDB_VERSION = 1

self.skipWaiting()
clientsClaim()

precacheAndRoute(
  PRECACHE_URLS.map(url => ({ url, revision: Date.now().toString() })),
  { cacheName: CACHE_NAMES.staticAssets, cleanUrls: false }
)

cleanupOutdatedCaches()

// Helper: open IndexedDB
function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('recipes')) db.createObjectStore('recipes', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('recipe-lists')) db.createObjectStore('recipe-lists', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('favorites')) db.createObjectStore('favorites', { keyPath: 'id' })
      if (!db.objectStoreNames.contains('cache-meta')) db.createObjectStore('cache-meta', { keyPath: 'key' })
    }
  })
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAMES.prefetch).then(cache => cache.addAll(PRECACHE_URLS).catch(() => { })),
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
    event.waitUntil(triggerClientSync())
  }
})

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-for-updates') {
    event.waitUntil(checkForUpdates())
  }
})

// Trigger sync on all connected clients
async function triggerClientSync() {
  const clients = await self.clients.matchAll({ type: 'window' })
  if (clients.length > 0) {
    // Notify clients to run their sync logic
    clients.forEach(client => client.postMessage({ type: 'TRIGGER_SYNC' }))
    // Also trigger sync for each client via port
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_STATUS', status: 'syncing' })
    })
    // Wait a bit for clients to process, then update status
    await new Promise(resolve => setTimeout(resolve, 2000))
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_STATUS', status: 'idle' })
    })
  } else {
    // No clients open - skip waiting so SW can handle sync when next client opens
    self.skipWaiting()
  }
}

// Clear all browser caches
async function clearBrowserCaches(): Promise<void> {
  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map(name => caches.delete(name)))
}

// Clear all IndexedDB offline data
async function clearIndexedDB(): Promise<void> {
  const dbs = await indexedDB.databases()
  await Promise.all(dbs.map(db => {
    if (db.name && (db.name.includes('recipe-app') || db.name.includes('recipe_app'))) {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.deleteDatabase(db.name!)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
        request.onblocked = () => resolve()
      })
    }
  }))
}

// Get combined cache info
async function getCacheInfo(): Promise<{ swCaches: string[]; idbDatabases: string[] }> {
  const swCaches = await caches.keys()
  const dbs = await indexedDB.databases()
  const idbDatabases = dbs.filter(db => db.name && (db.name.includes('recipe-app') || db.name.includes('recipe_app'))).map(db => db.name!)
  return { swCaches, idbDatabases }
}

self.addEventListener('message', (event) => {
  const { type } = event.data || {}

  if (type === 'SKIP_WAITING') {
    self.skipWaiting()
    return
  }

  if (type === 'CLEAR_CACHE') {
    // Clear browser caches (original behavior)
    clearBrowserCaches().then(() => {
      event.ports[0]?.postMessage({ success: true, cleared: 'browser-caches' })
    }).catch(err => {
      event.ports[0]?.postMessage({ success: false, error: String(err) })
    })
    return
  }

  if (type === 'CLEAR_INDEXED_DB') {
    // Clear all IndexedDB offline stores
    clearIndexedDB().then(() => {
      event.ports[0]?.postMessage({ success: true, cleared: 'indexed-db' })
    }).catch(err => {
      event.ports[0]?.postMessage({ success: false, error: String(err) })
    })
    return
  }

  if (type === 'CLEAR_ALL_OFFLINE_DATA') {
    // Clear both browser caches AND IndexedDB
    Promise.all([clearBrowserCaches(), clearIndexedDB()]).then(() => {
      event.ports[0]?.postMessage({ success: true, cleared: 'all' })
    }).catch(err => {
      event.ports[0]?.postMessage({ success: false, error: String(err) })
    })
    return
  }

  if (type === 'GET_CACHE_INFO') {
    getCacheInfo().then(info => {
      event.ports[0]?.postMessage({ success: true, ...info })
    }).catch(err => {
      event.ports[0]?.postMessage({ success: false, error: String(err) })
    })
    return
  }

  if (type === 'GET_VERSION') {
    event.ports[0]?.postMessage({ version: CACHE_VERSION })
    return
  }

  if (type === 'PREFETCH_ROUTES') {
    const { routes } = event.data || {}
    if (Array.isArray(routes)) {
      caches.open(CACHE_NAMES.prefetch).then(async cache => {
        await Promise.allSettled(routes.map(route => cache.add(route).catch(() => { })))
        event.ports[0]?.postMessage({ success: true, count: routes.length })
      }).catch(err => {
        event.ports[0]?.postMessage({ success: false, error: String(err) })
      })
    }
    return
  }
})

async function checkForUpdates() {
  try {
    const response = await fetch('/api/version')
    if (response.ok) {
      const data = await response.json()
      const clients = await self.clients.matchAll({ type: 'window' })
      clients.forEach(client => client.postMessage({ type: 'UPDATE_AVAILABLE', version: data.version }))
    }
  } catch { }
}

export {}
