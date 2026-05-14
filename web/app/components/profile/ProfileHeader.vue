<script setup lang="ts">
/**
 * ProfileHeader - 用户头像和信息区域
 */
const { t } = useI18n()
</script>

<template>
  <!-- 页面标题 -->
  <div class="text-center py-2">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-stone-100">
      {{ t('profile.title') }}
    </h1>
    <p class="mt-1 text-sm text-gray-500 dark:text-stone-400">
      {{ t('profile.subtitle') }}
    </p>
  </div>
</template>
