<script setup lang="ts">
/**
 * EmptyState - 空状态展示组件
 *
 * 功能：
 * - 显示空状态时的插图、标题、描述
 * - 支持自定义操作按钮 (action, secondaryAction)
 * - 提供多种预设插图 (plate, heart, search)
 * - 支持插槽自定义插图和操作区
 *
 * 使用方式：
 * <EmptyState
 *   title="暂无数据"
 *   description="请先添加内容"
 *   :action="{ label: '添加', to: '/add' }"
 * />
 */
import type { Action, IllustrationVariant } from '~/types/component-props'

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  action?: Action
  secondaryAction?: Action
  icon?: string
  illustration?: IllustrationVariant
  customIllustration?: boolean
}>(), {
  illustration: 'plate',
})

const { t } = useI18n()
const localePath = useLocalePath()

const defaultTitle = computed(() => t('empty.state'))
const defaultDescription = computed(() => t('empty.noData'))
</script>

<template>
  <div class="text-center py-8 md:py-12 px-4">
    <!-- Illustration slot -->
    <div v-if="$slots.illustration" class="mb-6">
      <slot name="illustration" />
    </div>
    <!-- Default illustrations -->
    <div v-else-if="illustration === 'plate'" class="mb-6">
      <EmptyPlateIllustration />
    </div>
    <div v-else-if="illustration === 'heart'" class="mb-6">
      <FavoritesHeartIllustration />
    </div>
    <div v-else-if="illustration === 'search'" class="relative inline-block mb-6">
      <div class="inline-flex items-center justify-center w-20 h-20 bg-orange-100 dark:bg-orange-900/40 rounded-full">
        <svg class="w-10 h-10 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
      </div>
    </div>

    <!-- Content -->
    <div class="mb-8">
      <!-- Icon (optional emoji override) -->
      <div v-if="icon" class="mb-4">
        <span class="text-5xl">{{ icon }}</span>
      </div>

      <h3 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-stone-100 mb-3">
        {{ title || defaultTitle }}
      </h3>
      <p v-if="description || !title" class="text-gray-500 dark:text-stone-400 max-w-md mx-auto">
        {{ description || defaultDescription }}
      </p>
    </div>

    <!-- Actions slot -->
    <div v-if="$slots.actions" class="flex flex-col sm:flex-row items-center justify-center gap-3">
      <slot name="actions" />
    </div>
    <!-- Default actions -->
    <div v-else-if="action || secondaryAction" class="flex flex-col sm:flex-row items-center justify-center gap-3">
      <NuxtLink
        v-if="action?.to"
        :to="localePath(action.to)"
        :class="[
          'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95',
          action.variant === 'secondary'
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            : 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-600/25'
        ]"
      >
        {{ action.label }}
      </NuxtLink>
      <button
        v-else-if="action?.onClick"
        @click="action.onClick"
        :class="[
          'inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95',
          action.variant === 'secondary'
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-stone-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            : 'bg-orange-600 text-white hover:bg-orange-700 shadow-lg shadow-orange-600/25'
        ]"
      >
        {{ action.label }}
      </button>

      <NuxtLink
        v-if="secondaryAction?.to"
        :to="localePath(secondaryAction.to)"
        class="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-stone-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:scale-105 active:scale-95"
      >
        {{ secondaryAction.label }}
      </NuxtLink>
      <button
        v-else-if="secondaryAction?.onClick"
        @click="secondaryAction.onClick"
        class="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-stone-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-all hover:scale-105 active:scale-95"
      >
        {{ secondaryAction.label }}
      </button>
    </div>
  </div>
</template>
