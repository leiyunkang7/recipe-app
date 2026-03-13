<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const isDark = ref(false)

// 主题预设
const themes = [
  { id: 'light', label: '浅色', icon: '☀️' },
  { id: 'dark', label: '深色', icon: '🌙' },
  { id: 'system', label: '跟随系统', icon: '💻' }
]

const currentTheme = ref('system')

// 初始化主题
onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved) {
    currentTheme.value = saved
  }
  applyTheme()
})

// 监听主题变化
watch(currentTheme, (newTheme) => {
  localStorage.setItem('theme', newTheme)
  applyTheme()
})

// 应用主题
function applyTheme() {
  const html = document.documentElement
  
  if (currentTheme.value === 'system') {
    // 跟随系统
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    html.classList.toggle('dark', isDark.value)
  } else {
    // 手动设置
    isDark.value = currentTheme.value === 'dark'
    html.classList.toggle('dark', isDark.value)
  }
}

// 切换主题
function toggleTheme() {
  if (currentTheme.value === 'light') {
    currentTheme.value = 'dark'
  } else if (currentTheme.value === 'dark') {
    currentTheme.value = 'system'
  } else {
    currentTheme.value = 'light'
  }
}

// 获取当前显示的图标
function getCurrentIcon() {
  if (currentTheme.value === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? '🌙' : '☀️'
  }
  return currentTheme.value === 'dark' ? '🌙' : '☀️'
}
</script>

<template>
  <button
    class="theme-toggle"
    @click="toggleTheme"
    :title="`当前: ${themes.find(t => t.id === currentTheme)?.label}`"
  >
    <span class="theme-icon">{{ getCurrentIcon() }}</span>
    <span class="theme-label">{{ themes.find(t => t.id === currentTheme)?.label }}</span>
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
    padding: 8px;
    border-radius: 50%;
  }
}
</style>
