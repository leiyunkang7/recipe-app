# Nuxt 4 Research Report
Date: 2026/04/10
Current Project Version: ^4.3.1

## New Features

### 1. Directory Structure (srcDir -> app/)
- Default srcDir changed to app/ instead of project root
- serverDir defaults to <rootDir>/server
- New shared/ directory for code shared between Vue app and Nitro server
- ~ alias now points to app/ directory

### 2. Singleton Data Fetching Layer
- Shared refs for same key in useAsyncData/useFetch
- getCachedData now receives context object with cause
- Reactive key support (computed/plain refs as keys)
- Data cleanup when last component unmounts

### 3. Component Name Normalization
- Vue generates component names matching Nuxt naming pattern
- Affects KeepAlive and Vue DevTools

### 4. Shared Prerender Data
- useAsyncData/useFetch data automatically shared across prerendered pages

### 5. Granular Inline Styles
- Nuxt now only inlines styles for Vue components, not global CSS
- Revert with features: { inlineStyles: true }

### 6. Pending Value Alignment
- pending is now true only when status is pending

### 7. Shallow Data Reactivity
- data from useAsyncData/useFetch is now shallowRef instead of ref

### 8. TypeScript Configuration Changes
- compilerOptions.noUncheckedIndexedAccess is now true by default
- Separate tsconfig files: tsconfig.app.json, tsconfig.server.json, tsconfig.node.json, tsconfig.shared.json

### 9. Unhead v2
- Removed props: vmid, hid, children, body
- Promise input no longer supported
- Tags sorted using Capo.js by default

### 10. Module Loading Order Fix
- Layer modules load first (deeper layers first)
- Project modules load last (highest priority)

## Breaking Changes

### High Impact
1. Directory Structure - Move assets/, components/, composables/, layouts/, middleware/, pages/, plugins/, utils/ into app/
2. Remove window.__NUXT__ - Use useNuxtApp().payload instead
3. Remove top-level generate config - Use nitro.prerender options instead
4. Template compilation changes - Remove lodash/template EJS syntax

### Medium Impact
1. data/error defaults - data and error now default to undefined instead of null
2. Component name normalization - May affect KeepAlive and Vue DevTools
3. Shallow Data Reactivity - data returns shallowRef instead of ref

### Low Impact
1. Unhead v2 - Removed props are uncommon
2. Inline styles granularity - Only affects global CSS

## Migration Commands

# Full auto migration
npx codemod@0.18.7 nuxt/4/migration-recipe

# Individual migrations
npx codemod@latest nuxt/4/file-structure
npx codemod@latest nuxt/4/default-data-error-value
npx codemod@latest nuxt/4/deprecated-dedupe-value
npx codemod@latest nuxt/4/shallow-function-reactivity
npx codemod@latest nuxt/4/absolute-watch-path
npx codemod@latest nuxt/4/template-compilation-changes

## Nuxt 5 Preview (from Nuxt 4.2+)

Enable with future.compatibilityVersion: 5

Nuxt 5 Features:
1. Vite Environment API - Migrate from extendViteConfig() to configEnvironment()
2. Non-async callHook - callHook may return void instead of Promise (20-40x faster)
3. Client-Only Comment Placeholders - Uses <!--placeholder--> instead of <div> as SSR placeholders

## Project Status

Project web/package.json uses Nuxt ^4.3.1 - need to check if directory structure migration (app/) is complete.

## References
- https://nuxt.com/blog/v4
- https://nuxt.com/docs/getting-started/upgrade
