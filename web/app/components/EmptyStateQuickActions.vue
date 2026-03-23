<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const quickActions = [
  {
    icon: 'upload',
    label: 'empty.import',
    path: '/admin/import',
    color: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
  },
  {
    icon: 'template',
    label: 'empty.template',
    path: '/admin/templates',
    color: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300'
  },
]
</script>

<template>
  <div class="flex items-center gap-2">
    <NuxtLink
      v-for="action in quickActions"
      :key="action.label"
      :to="localePath(action.path)"
      :class="action.color"
      class="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:scale-105"
    >
      <svg v-if="action.icon === 'upload'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
      </svg>
      <svg v-else-if="action.icon === 'template'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"/>
      </svg>
      {{ t(action.label) }}
    </NuxtLink>
  </div>
</template>
