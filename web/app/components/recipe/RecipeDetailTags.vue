<script setup lang="ts">
const props = defineProps<{
  tags: string[]
  isMobile?: boolean
}>()

const { t } = useI18n()

// Pre-computed responsive classes into a single object for better organization
const classes = computed(() => {
  const baseWrapper = 'bg-white dark:bg-stone-800'
  const baseHeading = 'font-bold text-gray-900 dark:text-stone-100 flex items-center gap-2'
  const baseTag = 'bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium'

  if (props.isMobile) {
    return {
      wrapper: `${baseWrapper} rounded-2xl shadow-sm p-4`,
      heading: `${baseHeading} text-lg mb-3`,
      tag: `${baseTag} px-3 py-1.5`,
    }
  }
  return {
    wrapper: `${baseWrapper} rounded-xl shadow-md dark:shadow-stone-900/30 p-6`,
    heading: `${baseHeading} text-2xl mb-4`,
    tag: `${baseTag} px-3 py-2`,
  }
})
</script>

<template>
  <div :class="classes.wrapper">
    <h2 :class="classes.heading">
      <TagIcon class="w-5 h-5" /> {{ t('recipe.tags') }}
    </h2>
    <div class="flex flex-wrap gap-2">
      <span
        v-for="tag in tags"
        :key="tag"
        :class="classes.tag"
      >
        {{ tag }}
      </span>
    </div>
  </div>
</template>
