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
import { ref, watch, onMounted } from 'vue'

const isDark = ref(false)
const isClient = ref(false)

// 主题预设
const themes = [
  { id: 'light', label: '浅色', icon: '☀️' },
  { id: 'dark', label: '深色', icon: '🌙' },
  { id: 'system', label: '跟随系统', icon: '💻' }
]

const currentTheme = ref('system')

// 初始化主题
onMounted(() => {
  isClient.value = true
  const saved = localStorage.getItem('theme')
  if (saved) {
    currentTheme.value = saved
  }
  applyTheme()
})

// 监听主题变化
watch(currentTheme, (newTheme) => {
  if (!isClient.value) return
  localStorage.setItem('theme', newTheme)
  applyTheme()
})

// 检查是否为暗色模式
function checkSystemDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

// 应用主题
function applyTheme() {
  if (typeof document === 'undefined') return
  
  const html = document.documentElement
  
  if (currentTheme.value === 'system') {
    // 跟随系统
    isDark.value = checkSystemDark()
    html.classList.toggle('dark', isDark.value)
  } else {
    // 手动设置
    isDark.value = currentTheme.value === 'dark'
    html.classList.toggle('dark', isDark.value)
  }
}

// 切换主题 - 使用数组索引简化
const THEME_ORDER = ['light', 'dark', 'system'] as const
function toggleTheme() {
  const currentIndex = THEME_ORDER.indexOf(currentTheme.value as typeof THEME_ORDER[number])
  currentTheme.value = THEME_ORDER[(currentIndex + 1) % THEME_ORDER.length]
}

// 缓存当前主题对象，避免模板中重复调用 themes.find()
// themes 数组较小(3项)，find 成本低，但缓存可以消除重复调用并使代码更清晰
const currentThemeObject = computed(() => themes.find(t => t.id === currentTheme.value))

// 获取当前显示的图标 - 使用 computed 缓存结果
const currentIcon = computed(() => {
  if (!isClient.value) return '💻'

  if (currentTheme.value === 'system') {
    return checkSystemDark() ? '🌙' : '☀️'
  }
  return currentTheme.value === 'dark' ? '🌙' : '☀️'
})
</script>

<template>
  <button
    class="theme-toggle"
    @click="toggleTheme"
    :title="`当前: ${currentThemeObject?.label}`"
  >
    <span class="theme-icon">{{ currentIcon }}</span>
    <span class="theme-label">{{ currentThemeObject?.label }}</span>
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
