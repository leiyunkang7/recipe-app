<script setup lang="ts">
const { locale, locales } = useI18n()
const localeRoute = useLocaleRoute()
const router = useRouter()
const route = useRoute()

interface LocaleOption {
  label: string
  code: string
}

const localeOptions = computed(() =>
  locales.value.map((l): LocaleOption => ({
    label: l.name ?? l.code,
    code: l.code
  }))
)

const currentLocale = computed(() => locale.value)

const switchLocale = async (code: string) => {
  const localizedRoute = localeRoute(route, code)
  await router.push(localizedRoute.fullPath)
}
</script>

<template>
  <div class="relative">
    <label for="language-select" class="sr-only">Select language</label>
    <select
      id="language-select"
      :value="currentLocale"
      @change="switchLocale(($event.target as HTMLSelectElement).value)"
      data-testid="language-switcher"
      class="appearance-none bg-white dark:bg-stone-800 border border-gray-300 dark:border-stone-600 text-gray-900 dark:text-stone-100 rounded-lg px-4 py-2 pr-8 cursor-pointer hover:border-orange-500 dark:hover:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm min-h-[44px]"
    >
      <option
        v-for="loc in localeOptions"
        :key="loc.code"
        :value="loc.code"
      >
        {{ loc.label }}
      </option>
    </select>
    <div class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
      <svg class="w-4 h-4 text-gray-500 dark:text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </div>
  </div>
</template>