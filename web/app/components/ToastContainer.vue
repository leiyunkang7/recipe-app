<script setup lang="ts">
/**
 * ToastContainer - Toast 消息通知容器组件
 *
 * 功能：
 * - 全局 Toast 消息展示
 * - 支持多种类型 (info, success, error, warning)
 * - 动画过渡效果
 * - 自动消失
 * - 手动关闭按钮
 * - Teleport 到 body
 *
 * 使用方式：
 * <ToastContainer />
 * 通过 useToast() composable 添加消息
 */
const { toasts, dismiss } = useToast()

// Static mappings - readonly to prevent accidental mutations and signal intent
const iconMap = readonly({
  info: 'ℹ️',
  success: '✅',
  error: '❌',
  warning: '⚠️',
})

const bgClassMap = readonly({
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
})
</script>

<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          v-memo="[toast.id, toast.type, toast.message]"
          class="flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg"
          :class="bgClassMap[toast.type]"
        >
          <span class="text-lg">{{ iconMap[toast.type] }}</span>
          <span class="flex-1 text-sm font-medium">{{ toast.message }}</span>
          <button
            @click="dismiss(toast.id)"
            class="text-lg opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}
</style>
