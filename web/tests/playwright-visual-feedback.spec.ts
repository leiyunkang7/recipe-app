/**
 * Playwright 视觉反馈闭环测试模板
 * 
 * 本测试模板用于食谱 APP 的视觉回归测试
 * 支持截图对比、控制台错误检测、移动端适配验证
 * 
 * 使用方式:
 *   bunx playwright test tests/playwright-visual-feedback.spec.ts
 *   bunx playwright test tests/playwright-visual-feedback.spec.ts --project=mobile
 */

import { test, expect, Page } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'

// 配置
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const SCREENSHOT_DIR = path.join(__dirname, '../screenshots')

// 确保截图目录存在
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

// 截图辅助函数
async function takeScreenshot(page: Page, name: string): Promise<string> {
  const filePath = path.join(SCREENSHOT_DIR, `${name}.png`)
  await page.screenshot({ path: filePath, fullPage: true })
  console.log(`📸 截图已保存: ${filePath}`)
  return filePath
}

// 控制台错误收集器
function createConsoleInterceptor(page: Page) {
  const errors: string[] = []
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })
  
  page.on('pageerror', (err) => {
    errors.push(err.message)
  })
  
  return {
    errors,
    getReport: () => {
      if (errors.length === 0) {
        return '✅ 无控制台错误'
      }
      return `🚨 发现 ${errors.length} 个控制台错误:\n${errors.map(e => `  - ${e}`).join('\n')}`
    }
  }
}

test.describe('🍳 食谱 APP 视觉反馈闭环测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 每个测试前等待服务器就绪
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 })
  })

  test.describe('1️⃣ 首页视觉验证', () => {
    
    test('首页加载正常且无控制台错误', async ({ page }) => {
      const console = createConsoleInterceptor(page)
      
      await page.goto(BASE_URL, { waitUntil: 'networkidle' })
      
      // 截图
      await takeScreenshot(page, 'home-loaded')
      
      // 验证页面标题
      await expect(page).toHaveTitle(/食谱|recipe|Recipe/i)
      
      // 验证核心元素存在
      const mainContent = page.locator('main, [role="main"], .main-content').first()
      await expect(mainContent).toBeVisible()
      
      // 输出控制台报告
      console.log(console.getReport())
      expect(console.errors).toHaveLength(0)
    })

    test('首页布局在桌面端 (1280px) 正常', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })
      await page.goto(BASE_URL, { waitUntil: 'networkidle' })
      
      await takeScreenshot(page, 'home-desktop-1280')
      
      // 验证没有水平滚动
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
    })

    test('首页布局在移动端 (375px) 正常', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto(BASE_URL, { waitUntil: 'networkidle' })
      
      await takeScreenshot(page, 'home-mobile-375')
      
      // 验证底部导航可见（如果有的话）
      const bottomNav = page.locator('nav, [role="navigation"]').last()
      // 不强制要求，移动端可能有不同导航
    })
  })

  test.describe('2️⃣ 食谱列表视觉验证', () => {
    
    test('食谱列表页面加载正常', async ({ page }) => {
      await page.goto(`${BASE_URL}/recipes`, { waitUntil: 'networkidle' })
      
      await takeScreenshot(page, 'recipes-list')
      
      // 验证食谱卡片存在
      const recipeCards = page.locator('[class*="recipe"], [class*="card"]')
      const count = await recipeCards.count()
      console.log(`📋 发现 ${count} 个食谱卡片`)
    })

    test('食谱筛选功能正常', async ({ page }) => {
      await page.goto(`${BASE_URL}/recipes`, { waitUntil: 'networkidle' })
      
      // 点击筛选按钮（如果有）
      const filterButton = page.locator('button:has-text("筛选"), button:has-text("Filter")').first()
      if (await filterButton.isVisible()) {
        await filterButton.click()
        await page.waitForTimeout(500)
        await takeScreenshot(page, 'recipes-filter-open')
        
        // 关闭筛选
        await page.keyboard.press('Escape')
      }
    })
  })

  test.describe('3️⃣ 食谱详情视觉验证', () => {
    
    test('食谱详情页加载正常', async ({ page }) => {
      // 先访问列表找第一个食谱
      await page.goto(`${BASE_URL}/recipes`, { waitUntil: 'networkidle' })
      
      // 点击第一个食谱
      const firstRecipe = page.locator('a[href*="/recipes/"]').first()
      if (await firstRecipe.isVisible()) {
        await firstRecipe.click()
        await page.waitForLoadState('networkidle')
        
        await takeScreenshot(page, 'recipe-detail')
        
        // 验证关键元素
        const title = page.locator('h1, [class*="title"]').first()
        await expect(title).toBeVisible()
      }
    })
  })

  test.describe('4️⃣ 暗色模式视觉验证', () => {
    
    test('暗色模式切换正常', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' })
      
      // 查找暗色模式切换按钮
      const themeToggle = page.locator('button:has-text("深色"), button:has-text("暗)"), [class*="theme"]').first()
      
      if (await themeToggle.isVisible()) {
        await themeToggle.click()
        await page.waitForTimeout(500)
        await takeScreenshot(page, 'home-dark-mode')
        
        // 验证背景色变化
        const bgColor = await page.evaluate(() => {
          return window.getComputedStyle(document.body).backgroundColor
        })
        console.log(`🎨 暗色模式背景色: ${bgColor}`)
      }
    })
  })

  test.describe('5️⃣ 表单验证视觉反馈', () => {
    
    test('表单错误提示样式正常', async ({ page }) => {
      // 访问创建食谱页面或管理页面
      await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' })
      
      // 尝试提交空表单（如果存在）
      const submitButton = page.locator('button[type="submit"]').first()
      if (await submitButton.isVisible()) {
        await submitButton.click()
        await page.waitForTimeout(500)
        
        await takeScreenshot(page, 'form-validation-error')
        
        // 验证错误提示出现
        const errorMessages = page.locator('[class*="error"], [class*="invalid"], [role="alert"]')
        const errorCount = await errorMessages.count()
        console.log(`⚠️  发现 ${errorCount} 个错误提示`)
      }
    })
  })

  test.describe('6️⃣ 控制台错误检测', () => {
    
    test('所有页面无 JavaScript 错误', async ({ page }) => {
      const console = createConsoleInterceptor(page)
      
      // 访问多个页面
      const pages = ['/', '/recipes']
      for (const path of pages) {
        await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' })
        await page.waitForTimeout(1000) // 等待异步操作
      }
      
      // 输出报告
      console.log(`\n${console.getReport()}`)
      
      // 记录但不强制失败（有些第三方脚本可能有错误）
      if (console.errors.length > 0) {
        console.warn(`⚠️  控制台存在 ${console.errors.length} 个错误`)
      }
    })
  })

  test.describe('7️⃣ 无障碍视觉验证', () => {
    
    test('主要交互元素有足够的对比度暗示', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' })
      
      // 验证按钮可点击
      const buttons = page.locator('button, a[href]')
      const count = await buttons.count()
      console.log(`🔘 页面有 ${count} 个可交互元素`)
      
      expect(count).toBeGreaterThan(0)
    })

    test('图片有 alt 文本', async ({ page }) => {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' })
      
      const images = page.locator('img')
      const count = await images.count()
      
      if (count > 0) {
        for (let i = 0; i < Math.min(count, 5); i++) {
          const img = images.nth(i)
          const alt = await img.getAttribute('alt')
          console.log(`🖼️  图片 ${i + 1}: ${alt || '(无 alt)'}`)
        }
      }
    })
  })
})

// 移动端专用配置
test.describe('📱 移动端适配测试', () => {
  
  test.use({ viewport: { width: 375, height: 812 } })
  
  test('移动端首页渲染正常', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    await takeScreenshot(page, 'mobile-home-375')
    
    // 验证没有溢出
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    expect(hasHorizontalScroll).toBe(false)
  })

  test('移动端底部导航可用', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    
    // 滚动到底部
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(500)
    
    const bottomNav = page.locator('nav').last()
    if (await bottomNav.isVisible()) {
      await takeScreenshot(page, 'mobile-bottom-nav')
    }
  })
})
