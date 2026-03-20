import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['app/composables/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['node_modules', '.nuxt', 'dist', 'e2e'],
  },
})
