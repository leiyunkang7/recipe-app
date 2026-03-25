<script setup lang="ts">
const { locale, locales, setLocale } = useI18n()

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

const currentLocale = computed({
  get: () => locale.value,
  set: (value) => setLocale(value)
})
</script>

<template>
  <div class="relative">
    <select
      v-model="currentLocale"
      data-testid="language-switcher"
      aria-label="Select language"
      class="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 cursor-pointer hover:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all text-sm min-h-[44px]"
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
      <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </div>
  </div>
</template>
