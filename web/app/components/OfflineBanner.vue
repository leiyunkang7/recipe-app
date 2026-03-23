<template>
  <div v-if="isOffline" class="fixed top-0 left-0 right-0 bg-yellow-500 text-black px-4 py-2 text-center text-sm z-50">
    📡 当前处于离线状态，显示的是缓存数据
  </div>
</template>

<script setup lang="ts">
const { isOffline } = useOfflineStatus()
</script>
