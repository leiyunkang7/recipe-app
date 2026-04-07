<script setup lang="ts">
import type { BreadcrumbItem } from '~/types'

const props = withDefaults(defineProps<{
  items: BreadcrumbItem[]
  maxItems?: number
}>(), {
  maxItems: 3,
})

const { t } = useI18n()
const localePath = useLocalePath()

const breadcrumbJsonLd = computed(() => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: props.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.type === 'link' ? `${useBaseUrl()}${item.href}` : undefined,
    })),
  }
})

const displayedItems = computed(() => {
  if (props.items.length <= props.maxItems) {
    return props.items
  }

  const first = props.items[0]
  const last = props.items[props.items.length - 1]
  const middle = props.items.slice(1, -1)

  if (middle.length > 1) {
    return [
      first,
      { type: 'ellipsis' as const, label: '...' },
      last,
    ]
  }

  return props.items
})

const isLastItem = (index: number) => index === displayedItems.value.length - 1

const isLinkItem = (item: BreadcrumbItem): boolean => item.type === 'link'

const getItemPath = (item: BreadcrumbItem) => {
  if (item.type !== 'link') return '#'
  return localePath(item.href)
}
</script>

<template>
  <nav aria-label="Breadcrumb" class="breadcrumbs">
    <ol class="hidden sm:flex items-center gap-2 text-sm">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="flex items-center"
      >
        <svg
          v-if="index > 0"
          class="w-4 h-4 mx-2 text-gray-400 dark:text-gray-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>

        <NuxtLink
          v-if="isLinkItem(item) && !isLastItem(index)"
          :to="getItemPath(item)"
          class="text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
        >
          {{ item.label }}
        </NuxtLink>

        <span
          v-else
          class="text-gray-800 dark:text-gray-200 font-medium"
          :aria-current="isLastItem(index) ? 'page' : undefined"
        >
          {{ item.label }}
        </span>
      </li>
    </ol>

    <div class="sm:hidden flex items-center text-sm">
      <NuxtLink
        :to="localePath('/')"
        class="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>{{ t('breadcrumb.home') }}</span>
      </NuxtLink>

      <svg
        class="w-4 h-4 mx-1 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>

      <span
        class="text-gray-800 dark:text-gray-200 font-medium truncate max-w-[150px]"
        :aria-current="items.length > 1 ? 'page' : undefined"
      >
        {{ items.length > 1 ? items[items.length - 1].label : items[0].label }}
      </span>
    </div>

    <component :is="'script'" type="application/ld+json">
      {{ JSON.stringify(breadcrumbJsonLd) }}
    </component>
  </nav>
</template>

<style scoped>
.breadcrumbs {
  @apply py-2;
}
</style>
