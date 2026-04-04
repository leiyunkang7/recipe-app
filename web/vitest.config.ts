import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { fileURLToPath } from 'url'
import { resolve } from 'path'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

// All composables to auto-import
const composableImports = [
  'useBreakpoint', 'useClickOutside', 'useCookingTimer', 'useDarkMode',
  'useEnterAnimation', 'useErrorBoundary', 'useFavorites', 'useHomePage',
  'useImageUpload', 'useIntersectionObserver', 'useNutritionStats',
  'useOfflineStatus', 'useRandomByIngredients', 'useRecipeDetail',
  'useRecipeForm', 'useRecipeGridVirtualScroll', 'useRecipeRating',
  'useRecipeSeo', 'useRecipes', 'useShareMenu', 'useSharePoster',
  'useTheme', 'useToast', 'useWakeLock',
]

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        // Mock useI18n from vue-i18n with our stub
        { from: resolve(rootDir, 'app/composables/__mocks__/vue-i18n.ts'), imports: ['useI18n'] },
        // Mock useNuxtApp
        { from: resolve(rootDir, 'app/composables/__mocks__/nuxtApp.ts'), imports: ['useNuxtApp', 'tryUseNuxtApp'] },
        // Auto-import all composables
        ...composableImports.map(name => ({
          from: resolve(rootDir, `app/composables/${name}.ts`),
          imports: [name],
        })),
      ],
      dts: false,
    }),
  ],
  resolve: {
    alias: {
      '~': resolve(rootDir, 'app'),
      '~~': rootDir,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['app/composables/**/*.test.ts', 'app/components/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules', '.nuxt', 'dist', 'e2e'],
  },
})
