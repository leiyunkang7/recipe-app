<script setup lang="ts">
interface Props {
  icon: 'timer' | 'people' | 'prep' | 'cook'
  label: string
  value: string | number
  iconClass?: string
  bgClass?: string
  size?: 'sm' | 'lg'
}

withDefaults(defineProps<Props>(), {
  iconClass: '',
  bgClass: '',
  size: 'sm'
})

const iconComponent = {
  timer: TimerIcon,
  people: PeopleIcon,
  prep: PrepIcon,
  cook: CookIcon
}
</script>

<template>
  <div
    class="text-center rounded-xl"
    :class="[
      size === 'sm' ? 'p-1.5 sm:p-2' : 'p-3',
      bgClass || 'bg-orange-50 dark:bg-orange-900/30'
    ]"
  >
    <p
      class="mb-0.5 flex justify-center"
      :class="[iconClass || 'text-orange-500', size === 'sm' ? 'text-base sm:text-lg' : 'text-lg']"
    >
      <component :is="iconComponent[icon]" :class="size === 'sm' ? 'w-6 h-6' : 'w-7 h-7'" />
    </p>
    <p class="text-xs sm:text-sm text-gray-600 dark:text-stone-400">{{ label }}</p>
    <p class="font-semibold text-gray-900 dark:text-stone-100" :class="size === 'sm' ? 'text-sm' : ''">
      {{ value }}
    </p>
  </div>
</template>
