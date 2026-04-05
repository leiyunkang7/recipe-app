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

// Icon SVG components
const TimerIcon = () => h('svg', { class: 'w-full h-full', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('circle', { cx: '12', cy: '12', r: '10' }),
  h('path', { d: 'M12 6v6l4 2' })
])

const PeopleIcon = () => h('svg', { class: 'w-full h-full', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { d: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' }),
  h('circle', { cx: '9', cy: '7', r: '4' }),
  h('path', { d: 'M23 21v-2a4 4 0 0 0-3-3.87' }),
  h('path', { d: 'M16 3.13a4 4 0 0 1 0 7.75' })
])

const PrepIcon = () => h('svg', { class: 'w-full h-full', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { d: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z' }),
  h('line', { x1: '3', y1: '6', x2: '21', y2: '6' }),
  h('path', { d: 'M16 10a4 4 0 0 1-8 0' })
])

const CookIcon = () => h('svg', { class: 'w-full h-full', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2' }, [
  h('path', { d: 'M12 2a8 8 0 0 0-8 8v12h16V10a8 8 0 0 0-8-8z' }),
  h('line', { x1: '4', y1: '10', x2: '20', y2: '10' })
])

// Move iconComponent outside setup to avoid creating new object for each component instance
const iconComponent = {
  timer: TimerIcon,
  people: PeopleIcon,
  prep: PrepIcon,
  cook: CookIcon
} as const
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
    <p class="text-sm sm:text-sm text-gray-600 dark:text-stone-400">{{ label }}</p>
    <p class="font-semibold text-gray-900 dark:text-stone-100" :class="size === 'sm' ? 'text-sm' : ''">
      {{ value }}
    </p>
  </div>
</template>
