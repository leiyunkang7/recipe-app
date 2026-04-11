# Bundle Size Analysis and Optimization Recommendations

## Current Code Splitting Configuration

### Vite Configuration
- `splitVendorChunks: true` - enabled
- `chunkSizeWarningLimit: 100KB` (reduced from 150KB)

### Manual Vendor Chunks (15 chunks)
| Chunk Name | Packages |
|------------|----------|
| vendor-vue | vue, vue-router, @vue/runtime-core, @vue/runtime-dom, @vue/reactivity, @vue/shared, @vue/compiler-core, @vue/compiler-dom, @vue/compiler-sfc |
| vendor-vueuse | @vueuse/* |
| vendor-tanstack | @tanstack/* |
| vendor-vue-extra | @vue/* (extra packages) |
| vendor-i18n | intlify, i18n packages |
| vendor-nuxtjs | @nuxtjs/* |
| vendor-image | @nuxt/image, image packages |
| vendor-pwa | workbox, @vite-pwa, vite-plugin-pwa |
| vendor-database | drizzle, pg, pg-pool |
| vendor-tailwind | tailwindcss, @nuxtjs/tailwindcss |
| vendor-sentry | @sentry/* |
| vendor-zod | zod |
| vendor-analytics | @vercel/analytics |
| vendor-supabase | @supabase, supabase-js |
| vendor-editor | @tiptap, prosemirror |

### Page-level Chunks (6 chunks)
- `chunk-admin` - Admin pages
- `chunk-profile` - Profile pages
- `chunk-my-recipes` - My recipes pages
- `chunk-auth` - Login/Register pages
- `chunk-favorites` - Favorites page
- `chunk-offline` - Offline page

### Component-level Chunks (15+ chunks)
- `chunk-cooking-mode` - CookingMode, StepGuide
- `chunk-fridge` - FridgeModeModal, fridge components
- `chunk-nutrition` - Nutrition components
- `chunk-rich-text` - RichTextInput
- `chunk-admin-table` - AdminRecipeTable, AdminRecipeList
- `chunk-notifications` - NotificationPanel
- `chunk-reading-mode` - ReadingModeToggle
- `chunk-image-upload` - ImageUpload
- `chunk-social-share` - RecipeSharePosterModal, RecipeShareMenu
- `chunk-recipe-sidebar` - RecipeDetailSidebar
- `chunk-batch-actions` - BatchActionBar, SelectableRecipeCard
- `chunk-favorites-ui` - FavoriteFolderManager, FavoritesCalendar
- `chunk-ui-primitives` - icons, Skeleton, EmptyState
- `chunk-recipe-detail` - RecipeDetail, RecipeStatsPanel
- `chunk-profile-ui` - Profile components

## Build Issues

### Issue #1: @nuxtjs/i18n JSON Parsing (BLOCKING)
**Error**: `[vite:json] locales/en.json: Failed to parse JSON file.`

The @nuxtjs/i18n v10.2.4 with Vite 7.3.1 has a bug where it fails to parse valid JSON locale files.

### Issue #2: Sentry v10 API Breaking Changes
Updated to use `httpServerIntegration()` instead.

## Implemented Optimizations

### 1. Reduced chunkSizeWarningLimit (DONE)
Changed from 150KB to 100KB for stricter optimization warnings.

### 2. Lazy Load Sentry (DONE)
Sentry is lazy-loaded only when an error occurs or after window.load event.
**Savings**: ~260KB initial bundle reduction

### 3. Server-only Dependencies
The following packages are correctly split into `vendor-database` chunk:
- `drizzle-orm`
- `pg`
- `bcryptjs` (may still be in client bundle - needs verification)

### 4. Component Lazy Loading
Pages use `defineAsyncComponent` for heavy components:
- `recipes/[id].vue`: RecipeSharePosterModal, CookingMode, StepGuide
- `index.vue`: LazyFooterSection, LazyBottomNav

### 5. Tailwind CSS Tree-shaking
Tailwind is split into `vendor-tailwind` chunk.

## Bundle Analysis Summary

| Category | Current | Status |
|----------|---------|--------|
| chunkSizeWarningLimit | 100KB | Done |
| Vendor chunks | 15 | Good |
| Page chunks | 6 | Good |
| Component chunks | 15+ | Good |
| Sentry lazy loading | Yes | Done |
| Heavy component lazy loading | Partial | Partial |

## Next Steps

1. **Fix i18n build issue** - Downgrade @nuxtjs/i18n or upgrade to compatible version
2. **Verify bundle sizes** - After fixing build, run `cd web && bun run build`
3. **Verify bcryptjs location** - Check if in client bundle unnecessarily
4. **Review heavy components** - Consider lazy loading:
   - AdvancedSearchFilters
   - RecipeFilters
   - CameraCapture
   - AIGeneratedRecipe
