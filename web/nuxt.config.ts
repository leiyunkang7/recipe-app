// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },

  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/i18n', '@nuxt/image', '@vite-pwa/nuxt', '@nuxtjs/sitemap'],

  // PWA configuration
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
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    filename: 'sw.ts',
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600,
    },
    devOptions: {
      enabled: true,
      suppressWarnings: process.env.NODE_ENV === 'production',
      navigateFallback: '/',
      type: 'module',
    },
  } as unknown, // PWA type definitions are outdated

  // Vite build optimization
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@tanstack')) return 'tanstack';
              if (id.includes('drizzle')) return 'drizzle';
            }
          },
        },
      },
    },
  },

  image: {
    domains: [
      'localhost',
    ],
    quality: 80,
    format: ['webp', 'avif'],
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
    },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      siteUrl: process.env.SITE_URL || 'http://localhost:3000',
      gaId: process.env.GA_ID || '',
    }
  },

  app: {
    head: {
      htmlAttrs: {
        class: 'touch-manipulation'
      },
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
      // Inline script to prevent theme FOUC - runs before page render
      script: [
        {
          innerHTML: `(function(){try{var t=localStorage.getItem('theme-mode');var md=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=t==='dark'||(!t&&md);if(dark){document.documentElement.classList.add('dark');document.querySelector('meta[name="theme-color"]').setAttribute('content','#1c1917');}}catch(e){}})()`,
          type: 'text/javascript',
        }
      ] as unknown // Inline script type mismatch
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
  } as unknown, // i18n type definitions are incomplete

  sitemap: {
    sources: [
      '/api/sitemap'
    ],
    strictNuxtContentPaths: true,
    locales: ['en', 'zh-CN', 'ja'],
    default: {
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: 0.7
    }
  } as unknown // sitemap type definitions are incomplete
})
