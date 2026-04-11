/**
 * plugin/theme.client.ts - 主题客户端插件
 *
 * 作用：在 Vue hydration 之前确保 theme 已同步
 * 配合 nuxt.config.ts 中的 inline script 实现 flash-free
 */

import { initThemeFromPlugin, setupSystemThemeListener } from '~/app/composables/useTheme'

export default defineNuxtPlugin(() => {
  // 使用 composable 导出的函数初始化 theme
  initThemeFromPlugin()
  
  // 设置系统主题变化监听器
  setupSystemThemeListener()
})
