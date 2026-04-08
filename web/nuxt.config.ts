// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/i18n', '@nuxt/image', '@vite-pwa/nuxt', '@nuxtjs/sitemap'],
  experimental: {
    viteEnvironmentApi: true,
  },
  nitro: {
    experimental: {
      websocket: true,
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: '食谱大全 | Recipe App',
      short_name: '食谱',
      description: '发现和分享美味食谱',
      theme_color: '#f97316',
      background_color: '#ffffff',
      display: 'standalone',
      orientation: 'portrait',
      scope: '/',
      start_url: '/',
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    filename: 'sw.ts',
    client: { installPrompt: true, periodicSyncForUpdates: 3600 },
    devOptions: { enabled: true, suppressWarnings: process.env.NODE_ENV === 'production', navigateFallback: '/', type: 'module' },
    workbox: {
      navigateFallback: '/',
      cacheNames: { prefix: 'recipe-app', suffix: 'v1', guarded: ['runtime'] },
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        { matcher: ({ request }) => request.destination === 'script' || request.destination === 'style',
          handler: { strategy: 'CacheFirst' as const, options: { cacheName: 'static-assets-v1', expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }, cacheableResponse: { statuses: [0, 200] } } } },
        { matcher: ({ request }) => request.destination === 'image',
          handler: { strategy: 'CacheFirst' as const, options: { cacheName: 'images-v1', expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 }, cacheableResponse: { statuses: [0, 200] } } } },
        { matcher: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
          handler: { strategy: 'StaleWhileRevalidate' as const, options: { cacheName: 'google-fonts-v1', expiration: { maxEntries: 30, maxAgeSeconds: 365 * 24 * 60 * 60 }, cacheableResponse: { statuses: [0, 200] } } } },
        { matcher: ({ url }) => url.pathname.startsWith('/api/recipes') || url.pathname.startsWith('/api/my-recipes'),
          handler: { strategy: 'NetworkFirst' as const, options: { cacheName: 'recipe-api-v1', expiration: { maxEntries: 100, maxAgeSeconds: 7 * 24 * 60 * 60 }, networkTimeoutSeconds: 10, cacheableResponse: { statuses: [0, 200] } } } },
        { matcher: ({ url }) => url.pathname.startsWith('/api/'),
          handler: { strategy: 'NetworkFirst' as const, options: { cacheName: 'other-api-v1', expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }, networkTimeoutSeconds: 10, cacheableResponse: { statuses: [0, 200] } } } },
        // Supabase Storage images - CacheFirst with long TTL for offline access
        { matcher: ({ url }) => url.hostname.includes('supabase') || url.hostname.includes('sb'),
          handler: { strategy: 'CacheFirst' as const, options: { cacheName: 'supabase-images-v1', expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 }, cacheableResponse: { statuses: [0, 200] } } } },
        // Unsplash and external recipe images
        { matcher: ({ url }) => url.origin.includes('images.unsplash.com') || url.origin.includes('unsplash.com') || url.origin.includes('pexels.com'),
          handler: { strategy: 'CacheFirst' as const, options: { cacheName: 'external-images-v1', expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 }, cacheableResponse: { statuses: [0, 200] } } } },
        // Vercel/CDN assets - stale while revalidate for faster loads
        { matcher: ({ url }) => url.hostname.includes('vercel') || url.hostname.includes('vercel.app'),
          handler: { strategy: 'StaleWhileRevalidate' as const, options: { cacheName: 'vercel-assets-v1', expiration: { maxEntries: 100, maxAgeSeconds: 24 * 60 * 60 }, cacheableResponse: { statuses: [0, 200] } } } },
        { matcher: ({ request }) => request.mode === 'navigate',
          handler: { strategy: 'NetworkFirst' as const, options: { cacheName: 'pages-v1', expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 }, networkTimeoutSeconds: 3, cacheableResponse: { statuses: [0, 200] } } } },
      ],
    },
  } as unknown,

  vite: {
    $client: {
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (!id.includes('node_modules')) {
                if (id.includes('pages/admin')) return 'chunk-admin';
                if (id.includes('pages/profile')) return 'chunk-profile';
                if (id.includes('pages/my-recipes')) return 'chunk-my-recipes';
                return;
              }
              const nmIdx = id.indexOf('node_modules/');
              if (nmIdx === -1) return;
              const afterNm = id.slice(nmIdx + 13);
              const parts = afterNm.split('/');
              const pkg = parts[0].startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
              if (pkg.startsWith('@tanstack')) return 'vendor-tanstack';
              if (pkg.startsWith('drizzle')) return 'vendor-drizzle';
              if (['vue', 'vue-router', '@vue/runtime-core', '@vue/runtime-dom', '@vue/reactivity', '@vue/shared', '@vue/compiler-core', '@vue/compiler-dom', '@vue/compiler-sfc'].includes(pkg)) return 'vendor-vue';
              if (pkg.startsWith('@vueuse')) return 'vendor-vueuse';
              if (pkg.includes('intlify') || pkg.includes('i18n')) return 'vendor-i18n';
              if (pkg.includes('@nuxt/image') || pkg.includes('image')) return 'vendor-image';
              if (pkg.includes('workbox') || pkg.includes('@vite-pwa')) return 'vendor-pwa';
              if (pkg.includes('tailwindcss') || pkg.includes('@nuxtjs/tailwindcss')) return 'vendor-tailwind';
              if (pkg.includes('@sentry')) return 'vendor-sentry';
              if (pkg.includes('bcryptjs')) return 'vendor-crypto';
              if (pkg === 'pg' || pkg === 'pg-pool') return 'vendor-pg';
            },
          },
        },
      },
    },
    $server: {
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                const nmIdx = id.indexOf('node_modules/');
                if (nmIdx === -1) return;
                const afterNm = id.slice(nmIdx + 13);
                const parts = afterNm.split('/');
                const pkg = parts[0].startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
                if (pkg === 'pg' || pkg === 'pg-pool') return 'vendor-pg';
                if (pkg.includes('bcryptjs')) return 'vendor-crypto';
                if (pkg.startsWith('drizzle')) return 'vendor-drizzle';
              }
            },
          },
        },
      },
    },
  },
  image: {
    domains: ['localhost'],
    quality: 80,
    format: ['webp', 'avif'],
    screens: { xs: 320, sm: 640, md: 768, lg: 1024, xl: 1280, xxl: 1536 },
  },
  css: ['~/assets/css/design-tokens.css', '~/assets/css/main.css', '~/assets/css/material-ui-enhancements.css'],
  runtimeConfig: {
    public: {
      siteUrl: process.env.SITE_URL || 'http://localhost:3000',
      gaId: process.env.GA_ID || '',
      sentryDsn: process.env.SENTRY_DSN || '',
      appVersion: process.env.APP_VERSION || '1.0.0',
    }
  },
  app: {
    head: {
      htmlAttrs: { class: 'touch-manipulation' },
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=1' },
        { name: 'theme-color', content: '#f97316' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: '食谱' },
        { name: 'application-name', content: '食谱大全' },
        { name: 'robots', content: 'index, follow' }
      ],
      link: [
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/icon.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' }
      ],
      script: [
        { innerHTML: "(function(){try{var t=localStorage.getItem('theme-mode');var md=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=t==='dark'||(!t&&md);if(dark){document.documentElement.classList.add('dark');document.querySelector('meta[name=theme-color]').setAttribute('content','#1c1917');}}catch(e){}})()", type: 'text/javascript' }
      ] as unknown
    },
    pageTransition: { name: 'page' }
  },
  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'zh-CN', name: '简体中文', file: 'zh-CN.json' },
      { code: 'ja', name: '日本語', file: 'ja.json' }
    ],
    defaultLocale: 'zh-CN',
    strategy: 'prefix',
    langDir: 'locales',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      fallbackLocale: 'en',
      redirectOn: 'root'
    }
  } as unknown,

  sitemap: {
    sources: ['/api/sitemap'],
    strictNuxtContentPaths: true,
    locales: ['en', 'zh-CN', 'ja'],
    default: {
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: 0.7
    }
  } as unknown
})
