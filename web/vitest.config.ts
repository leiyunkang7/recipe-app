import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import { fileURLToPath } from 'url'
import { resolve } from 'path'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      imports: [
        'vue',
        'vue-router',
        // Explicitly add composables as if they were auto-imported
        { from: resolve(rootDir, 'app/composables/useFavorites'), imports: ['useFavorites'] },
        { from: 'vue-i18n', imports: ['useI18n'] },
        // useNuxtApp is from #app/nuxt
        { from: '#app/nuxt', imports: ['useNuxtApp'] },
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
