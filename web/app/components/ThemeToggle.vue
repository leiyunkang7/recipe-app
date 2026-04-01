<script setup lang="ts">
/**
 * ThemeToggle - 主题切换组件
 *
 * 功能：
 * - 三种主题模式: 浅色 / 深色 / 跟随系统
 * - 点击循环切换主题
 * - 本地存储持久化
 * - 响应式图标显示 (移动端仅显示图标)
 * - 键盘可访问
 *
 * 使用方式：
 * <ThemeToggle />
 */

import type { ThemeMode } from '~/composables/useTheme'

const { mode, isDark, setMode } = useTheme()

// Theme options
const options: readonly { value: ThemeMode; label: string; icon: string }[] = [
  { value: 'light', label: '浅色', icon: '☀️' },
  { value: 'dark', label: '深色', icon: '🌙' },
  { value: 'system', label: '跟随系统', icon: '💻' }
] as const

// Get current theme option
const currentOption = computed(() => 
  options.find(opt => opt.value === mode.value) || options[2]
)

// Get display icon based on current state
const displayIcon = computed(() => {
  if (mode.value === 'system') {
    // Check actual system preference
    if (import.meta.client && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? '🌙' : '☀️'
    }
    return '💻'
  }
  return mode.value === 'dark' ? '🌙' : '☀️'
})
</script>

<template>
  <button
    type="button"
    class="theme-toggle"
    :aria-label="`当前: ${currentOption.label}，点击切换`"
    @click="setMode(options[(options.findIndex(o => o.value === mode) + 1) % options.length].value)"
  >
    <span class="theme-icon">{{ displayIcon }}</span>
    <span class="theme-label">{{ currentOption.label }}</span>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: 1px solid var(--color-border, #e7e5e4);
  border-radius: 20px;
  background: var(--color-bg-paper, #fff);
  color: var(--color-text-primary, #1c1917);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  background: var(--color-bg, #fafaf9);
  border-color: var(--color-text-muted, #a8a29e);
}

.theme-icon {
  font-size: 16px;
}

.theme-label {
  font-weight: 500;
}

@media (max-width: 640px) {
  .theme-label {
    display: none;
  }
  
  .theme-toggle {
    padding: 10px;
    border-radius: 50%;
    min-width: 44px;
    min-height: 44px;
    justify-content: center;
  }
}
</style>
