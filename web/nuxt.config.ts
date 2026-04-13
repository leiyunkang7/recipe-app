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
  } as unknown,

  // Route-based caching rules for optimized code splitting
  routeRules: {
    // Security headers for all routes
    '/**': {
      headers: [
        // Content Security Policy
        {
          name: 'Content-Security-Policy',
          value: [
            "default-src 'self'",
            // Script sources - allow self, inline scripts for theme, and necessary CDN
            // Note: 'unsafe-inline' and 'unsafe-eval' are required for Nuxt/Vue SSR hydration
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://accounts.google.com",
            // Style sources - allow self, inline, and Google Fonts
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            // Image sources - allow self, Supabase storage, Unsplash, Pexels, Vercel
            "img-src 'self' data: https://*.supabase.co https://*.supabase.com https://images.unsplash.com https://*.unsplash.com https://*.pexels.com https://*.vercel.app https://*.vercel-services.com blob:",
            // Font sources
            "font-src 'self' data: https://fonts.gstatic.com",
            // Connect/API sources
            "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://*.supabase.co https://*.supabase.com wss://*.supabase.co https://accounts.google.com https://browser.sentry-cdn.com https://o*.sentry.io",
            // Frame sources - prevent clickjacking
            "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com",
            // Media sources
            "media-src 'self' https://*.supabase.co blob:",
            // Object and embed sources
            "object-src 'none'",
            // Base URI restriction
            "base-uri 'self'",
            // Form action restriction
            "form-action 'self'",
            // Frame ancestors - prevent clickjacking (strictest: 'none' blocks all embedding)
            "frame-ancestors 'none'",
            // Worker/Service Worker sources
            "worker-src 'self' blob:",
            // Manifest sources (PWA)
            "manifest-src 'self'",
            // Prefetch sources
            "prefetch-src 'self'",
            // Upgrade insecure requests only on known HTTPS platforms (VERCEL === '1' for Vercel deployments)
            process.env.VERCEL === '1' || process.env.NODE_ENV === 'production' ? "upgrade-insecure-requests" : "",
          ].filter(Boolean).join('; ')
        },
        // DNS prefetch - allows browser to pre-resolve DNS for third-party domains
        { name: 'X-DNS-Prefetch-Control', value: 'on' },
        // X-Content-Type-Options - prevents MIME type sniffing
        { name: 'X-Content-Type-Options', value: 'nosniff' },
        // X-Frame-Options - prevents clickjacking (DENY is strictest; blocks all embedding)
        { name: 'X-Frame-Options', value: 'DENY' },
        // X-XSS-Protection - legacy XSS filter (modern browsers use CSP)
        { name: 'X-XSS-Protection', value: '1; mode=block' },
        // Referrer-Policy - controls referrer information
        { name: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        // Permissions-Policy - controls browser feature access
        { name: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()' },
      ]
    },

    // Static pages - DISABLED FOR BUILD - prerender for faster loading (including i18n localized versions)
    // '/': { prerender: true },
    // '/zh-CN': { prerender: true },
    // '/ja': { prerender: true },
    // '/recipes': { prerender: true },
    // '/zh-CN/recipes': { prerender: true },
    // '/ja/recipes': { prerender: true },
    // '/login': { prerender: true },
    // '/zh-CN/login': { prerender: true },
    // '/ja/login': { prerender: true },
    // '/register': { prerender: true },
    // '/zh-CN/register': { prerender: true },
    // '/ja/register': { prerender: true },
    // '/offline': { prerender: true },
    // '/zh-CN/offline': { prerender: true },
    // '/ja/offline': { prerender: true },

    // Dynamic pages - ISR with cache (including i18n localized versions)
    '/recipes/**': { isr: 3600 },
    '/zh-CN/recipes/**': { isr: 3600 },
    '/ja/recipes/**': { isr: 3600 },

    // User-specific pages - no caching (including i18n localized versions)
    '/my-recipes/**': { ssr: true, cache: false },
    '/zh-CN/my-recipes/**': { ssr: true, cache: false },
    '/ja/my-recipes/**': { ssr: true, cache: false },
    '/favorites': { ssr: true, cache: false },
    '/zh-CN/favorites': { ssr: true, cache: false },
    '/ja/favorites': { ssr: true, cache: false },

    // Admin pages - no caching, full SSR (including i18n localized versions)
    '/admin/**': { ssr: true, cache: false },
    '/zh-CN/admin/**': { ssr: true, cache: false },
    '/ja/admin/**': { ssr: true, cache: false },

    // Profile - client-side only (including i18n localized versions)
    '/profile/**': { ssr: false },
    '/zh-CN/profile/**': { ssr: false },
    '/ja/profile/**': { ssr: false },
  },
  vite: {
    json: {
      stringify: true,
    },
    build: {
      // Enable automatic vendor chunking for better code splitting
      chunkSizeWarningLimit: 100, // KB - warn if chunks are larger than this
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              // Fast path checks using more reliable pattern matching
              const normalizedId = id.replace(/\\/g, '/');

              // Page-level chunks - specific path matching to avoid false positives
              if (normalizedId.includes('/pages/admin/')) return 'chunk-admin';
              if (normalizedId.includes('/pages/profile/')) return 'chunk-profile';
              if (normalizedId.includes('/pages/my-recipes/')) return 'chunk-my-recipes';
              if (normalizedId.includes('/pages/login/') || normalizedId.includes('/pages/register/')) return 'chunk-auth';
              if (normalizedId.includes('/pages/favorites')) return 'chunk-favorites';
              if (normalizedId.includes('/pages/offline')) return 'chunk-offline';

              // Component-level chunks for heavy components
              // Use exact path matching to avoid false positives (e.g., 'recipe/' vs 'recipes/')
              const compMatch = (pattern: string) => {
                const normalizedPattern = pattern.toLowerCase();
                return normalizedId.includes('/components/' + pattern) ||
                       normalizedId.includes('/components/' + normalizedPattern);
              };

              // Heavy interactive features - split into separate chunks
              if (compMatch('recipe/CookingMode') || compMatch('recipe/StepGuide')) return 'chunk-cooking-mode';
              if (compMatch('FridgeModeModal') || compMatch('fridge/')) return 'chunk-fridge';
              if (compMatch('nutrition/')) return 'chunk-nutrition';
              if (compMatch('admin/RichTextInput')) return 'chunk-rich-text';
              if (compMatch('admin/AdminRecipeTable') || compMatch('admin/AdminRecipeList')) return 'chunk-admin-table';
              if (compMatch('NotificationPanel')) return 'chunk-notifications';
              if (compMatch('ReadingModeToggle')) return 'chunk-reading-mode';
              if (compMatch('ImageUpload')) return 'chunk-image-upload';
              if (compMatch('recipe/RecipeSharePosterModal') || compMatch('recipe/RecipeShareMenu')) return 'chunk-social-share';
              if (compMatch('recipe/RecipeDetailSidebar')) return 'chunk-recipe-sidebar';
              if (compMatch('BatchActionBar') || compMatch('SelectableRecipeCard')) return 'chunk-batch-actions';
              if (compMatch('FavoriteFolderManager') || compMatch('FavoritesCalendar')) return 'chunk-favorites-ui';
              if (compMatch('icons/') || normalizedId.includes('Skeleton') || normalizedId.includes('EmptyState')) return 'chunk-ui-primitives';
              if (compMatch('recipe/RecipeDetail') || compMatch('recipe/RecipeStatsPanel')) return 'chunk-recipe-detail';
              if (compMatch('profile/')) return 'chunk-profile-ui';
            }
            const nmIdx = id.indexOf('node_modules/');
            if (nmIdx === -1) return;
            if (id.startsWith('virtual:') || id.startsWith('\0')) return;
            const afterNm = id.slice(nmIdx + 13);
            const parts = afterNm.split('/');
            if (!parts[0]) return;
            const pkg = parts[0].startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
            // Vue core - keep together for optimal caching
            if (['vue', 'vue-router', '@vue/runtime-core', '@vue/runtime-dom', '@vue/reactivity', '@vue/shared', '@vue/compiler-core', '@vue/compiler-dom', '@vue/compiler-sfc'].includes(pkg)) return 'vendor-vue';

            // Vue ecosystem - group by purpose
            if (pkg.startsWith('@vueuse')) return 'vendor-vueuse';
            if (pkg.startsWith('@tanstack')) return 'vendor-tanstack';
            if (pkg.startsWith('@vue/')) return 'vendor-vue-extra';

            // i18n - Nuxt i18n and intlify
            if (pkg.includes('intlify') || pkg.includes('i18n')) return 'vendor-i18n';

            // Nuxt modules - group by module
            if (pkg.startsWith('@nuxtjs/')) return 'vendor-nuxtjs';
            if (pkg.includes('@nuxt/image') || pkg.includes('image')) return 'vendor-image';

            // PWA stack
            if (pkg.includes('workbox') || pkg.includes('@vite-pwa') || pkg.includes('vite-plugin-pwa')) return 'vendor-pwa';

            // Database stack - only load on admin pages
            if (pkg.startsWith('drizzle') || pkg === 'pg' || pkg === 'pg-pool') return 'vendor-database';

            // CSS framework
            if (pkg.includes('tailwindcss') || pkg.includes('@nuxtjs/tailwindcss')) return 'vendor-tailwind';

            // Sentry - separate for lazy loading
            if (pkg.includes('@sentry')) return 'vendor-sentry';

            // Zod validation - separate chunk
            if (pkg === 'zod') return 'vendor-zod';

            // Analytics
            if (pkg.includes('@vercel/analytics')) return 'vendor-analytics';

            // Database client
            if (pkg.includes('@supabase') || pkg.includes('supabase-js')) return 'vendor-supabase';


            // Editor/libs
            if (pkg.includes('@tiptap') || pkg.includes('prosemirror')) return 'vendor-editor';
          },
        },
      },
    },
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        '@vue/runtime-core',
        '@vue/runtime-dom',
      ],
      // Exclude VueUse/nuxt from pre-bundling to enable tree-shaking
      // Only useDebounceFn is explicitly imported in the app
      exclude: [
        '@vueuse/nuxt',
        '@sentry/vue',
        '@sentry/browser',
        '@sentry-internal/browser-utils',
      ],
    },
  },
  image: {
    domains: ['localhost'],
    quality: 80,
    format: ['webp', 'avif'],
    screens: { xs: 320, sm: 640, md: 768, lg: 1024, xl: 1280, xxl: 1536 },
    // Enable blur placeholder for faster perceived load
    blur: 50,
  },
  css: ['~/assets/css/design-tokens.css', '~/assets/css/main.css', '~/assets/css/material-ui-enhancements.css'],
  runtimeConfig: {
    public: {
      siteUrl: process.env.SITE_URL || 'http://localhost:3000',
      gaId: process.env.GA_ID || '',
      sentryDsn: process.env.SENTRY_DSN || '',
      appVersion: process.env.APP_VERSION || '1.0.0',
      // Supabase configuration for realtime notifications
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
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
      ] as Array<{ rel: string; sizes?: string; href: string; type?: string }>,
      script: [
        { innerHTML: "(function(){try{var t=localStorage.getItem('theme');var md=window.matchMedia('(prefers-color-scheme: dark)').matches;var dark=t==='dark'||(t!=='light'&&md);if(dark){document.documentElement.classList.add('dark');}document.querySelector('meta[name=theme-color]').setAttribute('content',dark?'#1c1917':'#f97316');}catch(e){}})()", type: 'text/javascript' }
      ] as Array<{ innerHTML: string; type: string }>
    },
    pageTransition: { name: 'page' }
  },
  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.mjs' },
      { code: 'zh-CN', name: '简体中文', file: 'zh-CN.mjs' },
      { code: 'ja', name: '日本語', file: 'ja.mjs' }
    ],
    defaultLocale: 'en',
    strategy: 'prefix_except_default',
    lazy: true,
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