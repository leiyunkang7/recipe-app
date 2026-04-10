# Bundle Size Analysis and Optimization Recommendations

## Current Code Splitting Configuration

### Vendor Chunks (Good)
- `splitVendorChunks: true` - enabled
- `chunkSizeWarningLimit: 150KB`

### Manual Vendor Chunks (Good)
1. `vendor-vue` - Vue core (vue, vue-router, @vue/*)
2. `vendor-vueuse` - VueUse packages
3. `vendor-tanstack` - TanStack packages
4. `vendor-vue-extra` - Extra Vue packages
5. `vendor-i18n` - i18n packages
6. `vendor-nuxtjs` - NuxtJS modules
7. `vendor-image` - Image module
8. `vendor-pwa` - PWA stack
9. `vendor-database` - Database stack
10. `vendor-tailwind` - Tailwind CSS
11. `vendor-sentry` - Sentry
12. `vendor-zod` - Zod validation
13. `vendor-analytics` - Vercel Analytics
14. `vendor-supabase` - Supabase client
15. `vendor-editor` - Editor libs (Tiptap, Prosemirror)

### Page-level Chunks
- chunk-admin, chunk-profile, chunk-my-recipes, chunk-auth, chunk-favorites, chunk-offline

### Component-level Chunks
- chunk-cooking-mode, chunk-fridge, chunk-nutrition, chunk-rich-text, etc.

## Issues Identified

### Build Issue
The build is failing due to @nuxtjs/i18n module attempting to parse JSON locale files.
Error: [vite:json] i18n/locales/zh-CN.json: Failed to parse JSON file.

This appears to be a bug or configuration issue with @nuxtjs/i18n v10.2.4.

### Optimization Opportunities

1. **Reduce chunkSizeWarningLimit**: 150KB to 100KB for stricter optimization
2. **Lazy load Sentry**: Currently excluded from pre-bundling but not lazy loaded
3. **Lazy load heavy components**: CookingMode, FridgeModeModal, tiptap
4. **Database stack (drizzle/pg)**: Should be server-side only, not in client bundle
5. **Tailwind CSS**: Already split but could tree-shake unused styles

## Recommendations

1. Fix @nuxtjs/i18n configuration or file path
2. Consider lazy loading Sentry initialization
3. Use dynamic imports for heavy UI components
4. Move server-only dependencies to server middleware
