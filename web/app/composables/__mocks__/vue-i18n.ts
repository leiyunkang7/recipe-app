// Mock for vue-i18n useI18n composable
// This provides a simple stub for testing without needing the full vue-i18n setup

export const useI18n = () => ({
  t: (key: string) => key,
  locale: { value: 'zh' },
})
