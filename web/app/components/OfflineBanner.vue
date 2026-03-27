<script setup lang="ts">
/**
 * OfflineBanner - 离线状态提示横幅组件
 *
 * 功能：
 * - 检测网络离线状态
 * - 固定在页面顶部显示
 * - 提示用户当前处于离线模式
 *
 * 使用方式：
 * <OfflineBanner />
 */
const { isOffline } = useOfflineStatus()
</script>

<template>
  <div v-if="isOffline" class="fixed top-0 left-0 right-0 bg-yellow-500 text-black px-4 py-2 text-center text-sm z-50">
    📡 当前处于离线状态，显示的是缓存数据
  </div>
</template>
