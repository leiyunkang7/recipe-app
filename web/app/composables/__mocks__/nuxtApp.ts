// Mock for #app/nuxt (Nuxt virtual module)
// This is used by vitest when running component tests

// Mock runtime config
export const useRuntimeConfig = () => ({
  public: {
    siteUrl: 'http://localhost:3000',
  },
})

// Mock i18n
export const useI18n = () => ({
  locale: { value: 'zh-CN' },
})

export const useNuxtApp = () => ({
  $fetch: async (_url: string, _options?: unknown) => {
    return { data: { data: [] }, error: null }
  },
})

export const tryUseNuxtApp = useNuxtApp
