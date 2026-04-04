import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mock/**',
        'coverage/**',
        'web/**',
        '.nuxt/**',
        'database/src/schema/**',
        '**/*.js',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
    include: ['**/__tests__/**/*.test.ts'],
    exclude: ['node_modules', 'dist', 'web', '.nuxt'],
  },
  resolve: {
    alias: {
      '@recipe-app/shared-types': resolve(__dirname, './shared/types/src'),
      '@recipe-app/recipe-service': resolve(__dirname, './services/recipe/src'),
      '@recipe-app/image-service': resolve(__dirname, './services/image/src'),
      '@recipe-app/search-service': resolve(__dirname, './services/search/src'),
    },
  },
});
