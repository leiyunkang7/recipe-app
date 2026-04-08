<script setup lang="ts">
/**
 * NotificationBell - 通知铃铛组件
 *
 * 特性：
 * - 显示未读通知数量badge
 * - 点击展开通知面板
 * - 实时连接状态指示
 * - 自动初始化 WebSocket 和 Supabase 实时通知
 */
import { ref, onMounted, onUnmounted, watch } from "vue"
import { useNotificationStore } from "~/composables/useNotificationStore"
import NotificationPanel from "~/components/NotificationPanel.vue"

const { unreadCount, isConnected, connect, disconnect, initNotificationService } = useNotificationStore()
const isPanelOpen = ref(false)

// Get Supabase client and auth user
const { $supabase } = useNuxtApp()
const { user } = useAuth()

const togglePanel = () => {
  isPanelOpen.value = !isPanelOpen.value
}

const closePanel = () => {
  isPanelOpen.value = false
}

// Initialize notification service when user changes
watch(user, (newUser) => {
  if (newUser && $supabase) {
    initNotificationService($supabase, newUser.id)
  }
}, { immediate: true })

onMounted(() => {
  // Connect to WebSocket
  connect()

  // Initialize with current user if already logged in
  if (user.value && $supabase) {
    initNotificationService($supabase, user.value.id)
  }
})

onUnmounted(() => {
  disconnect()
})
</script>

<template>
  <div class="relative">
    <!-- 铃铛按钮 -->
    <button
      type="button"
      class="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
      :aria-label="unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications'"
      @click="togglePanel"
    >
      <!-- 铃铛图标 -->
      <svg
        class="w-5 h-5 text-gray-600 dark:text-stone-300"
        :class="{ 'text-orange-500': unreadCount > 0 }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>

      <!-- 未读数量 badge -->
      <span
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] text-xs font-bold text-white bg-orange-500 rounded-full ring-2 ring-white dark:ring-stone-900"
      >
        {{ unreadCount > 99 ? "99+" : unreadCount }}
      </span>

      <!-- 连接状态指示器 -->
      <span
        class="absolute bottom-0 right-0 w-2 h-2 rounded-full"
        :class="isConnected ? 'bg-green-500' : 'bg-gray-400'"
        :title="isConnected ? 'Connected' : 'Disconnected'"
      />
    </button>

    <!-- 通知面板 -->
    <NotificationPanel
      v-if="isPanelOpen"
      @close="closePanel"
    />
  </div>
</template>
