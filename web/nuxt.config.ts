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
    runtimeCaching: {
      staticResources: {
        matcher: ({ request }) =>
          request.destination === 'script' ||
          request.destination === 'style' ||
          request.destination === 'font',
        handler: 'CacheFirst',
        options: {
          cacheName: 'static-resources',
          expiration: {
            maxEntries: 500,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      recipeImages: {
        matcher: ({ url }) =>
          url.hostname.includes('supabase.co') ||
          url.hostname.includes('supabase.in') ||
          url.pathname.includes('/storage/'),
        handler: 'CacheFirst',
        options: {
          cacheName: 'recipe-images',
          expiration: {
            maxEntries: 500,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      recipeListApi: {
        matcher: ({ url }) =>
          url.pathname.includes('/rest/v1/recipes') &&
          !url.search.includes('id=eq'),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'recipe-list-api',
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 24 * 60 * 60,
          },
          networkTimeoutSeconds: 10,
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      recipeDetailApi: {
        matcher: ({ url }) =>
          url.pathname.includes('/rest/v1/recipes') &&
          (url.search.includes('id=eq') || url.search.includes('id=in')),
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'recipe-detail-api',
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
          networkTimeoutSeconds: 10,
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      taxonomyApi: {
        matcher: ({ url }) =>
          url.pathname.includes('/rest/v1/categories') ||
          url.pathname.includes('/rest/v1/cuisines'),
        handler: 'CacheFirst',
        options: {
          cacheName: 'taxonomy-api',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 60 * 60,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      googleFonts: {
        matcher: ({ url }) =>
          url.origin === 'https://fonts.googleapis.com' ||
          url.origin === 'https://fonts.gstatic.com',
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts',
          expiration: {
            maxEntries: 30,
            maxAgeSeconds: 365 * 24 * 60 * 60,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      i18nResources: {
        matcher: ({ url }) =>
          url.pathname.includes('/locales/') ||
          url.pathname.endsWith('.json'),
        handler: 'CacheFirst',
        options: {
          cacheName: 'i18n-resources',
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 24 * 60 * 60,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    },
  },

  // Vite build optimization
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@supabase')) return 'supabase';
              if (id.includes('@tanstack')) return 'tanstack';
            }
          },
        },
      },
    },
    optimizeDeps: {
      exclude: ['@supabase/supabase-js'],
    },
  },

  // Nitro server optimization
  nitro: {
    externals: {
      external: ['@supabase/supabase-js'],
    },
  },

  image: {
    // Supabase storage provider
    domains: [
      'localhost',
      'supabase.co',
      'supabase.in',
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
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    }
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'zh-CN',
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
          children: `(function(){try{var t=localStorage.getItem('theme-mode');var md=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=t==='dark'||(!t&&md);if(dark){document.documentElement.classList.add('dark');document.querySelector('meta[name="theme-color"]').setAttribute('content','#1c1917');}}catch(e){}})()`,
          type: 'text/javascript',
        }
      ]
    },
    pageTransition: { name: 'page', mode: 'out-in' }
  },

  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'zh-CN', name: '简体中文', file: 'zh-CN.json' }
    ],
    defaultLocale: 'zh-CN',
    strategy: 'prefix',
    langDir: 'locales',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      fallbackLocale: 'en',
      alwaysRedirectOn: 'root',
      redirectOn: 'root'
    }
  },

  sitemap: {
    sources: [
      '/api/sitemap'
    ],
    strictNuxtContentPaths: true,
    defaultLocale: 'zh-CN',
    locales: ['en', 'zh-CN'],
    default: {
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: 0.7
    }
  }
})
