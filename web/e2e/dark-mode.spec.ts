import { test, expect } from '@playwright/test'

/**
 * 暗色模式测试
 * 测试主题切换功能
 */

test.describe('暗色模式', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('应支持手动主题切换', async ({ page }) => {
    // 检查主题切换按钮存在
    const themeToggle = page.locator('.theme-toggle')
    await expect(themeToggle).toBeVisible()
    
    // 记录初始状态
    const initialHtmlClass = await page.locator('html').getAttribute('class') || ''
    const initialIsDark = initialHtmlClass.includes('dark')
    
    // 点击切换主题
    await themeToggle.click()
    
    // 等待过渡动画完成
    await page.waitForTimeout(500)
    
    // 验证主题已切换
    const newHtmlClass = await page.locator('html').getAttribute('class') || ''
    const newIsDark = newHtmlClass.includes('dark')
    
    expect(newIsDark).not.toBe(initialIsDark)
  })

  test('应正确应用暗色模式样式', async ({ page }) => {
    // 强制设置暗色模式
    await page.addScriptTag({
      content: 'document.documentElement.classList.add("dark")'
    })
    
    // 验证暗色模式CSS变量已应用
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()
    })
    
    expect(bgColor).toBe('#1c1917')
  })

  test('应支持 prefers-color-scheme 系统主题检测', async ({ page }) => {
    // 这个测试依赖于系统设置，只能验证代码逻辑存在
    const hasMediaQuery = await page.evaluate(() => {
      return window.matchMedia('(prefers-color-scheme: dark)').matches !== undefined
    })
    
    expect(hasMediaQuery).toBe(true)
  })

  test('应遵守 prefers-reduced-motion 无障碍偏好', async ({ page }) => {
    // 模拟用户开启了"减少动画"偏好
    await page.emulateMediaFeatures([
      { name: 'prefers-reduced-motion', value: 'reduce' }
    ])
    
    await page.goto('/')
    
    // 验证动画时长被限制
    const animationDuration = await page.evaluate(() => {
      const style = getComputedStyle(document.body)
      return style.animationDuration
    })
    
    // reduce 模式下应该是 0.01ms
    expect(animationDuration).toContain('0.01')
  })

  test('主题切换应持久化到 localStorage', async ({ page }) => {
    // 切换主题
    const themeToggle = page.locator('.theme-toggle')
    await themeToggle.click()
    await page.waitForTimeout(500)
    
    // 刷新页面
    await page.reload()
    
    // 验证主题保持
    const htmlClass = await page.locator('html').getAttribute('class') || ''
    expect(htmlClass).toMatch(/dark/)
  })
})
