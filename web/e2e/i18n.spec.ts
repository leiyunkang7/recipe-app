import { test, expect } from '@playwright/test';

test.describe('i18n - Language and Routing', () => {
  test.describe('Language Switcher', () => {
    test('should switch language via language switcher', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const langSwitcher = page.locator('select').first();
      await expect(langSwitcher).toBeVisible();

      await langSwitcher.selectOption('zh-CN');
      await page.waitForURL('**/zh-CN**');

      expect(page.url()).toContain('/zh-CN');
    });

    test('should persist language choice in cookie', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const langSwitcher = page.locator('select').first();
      await langSwitcher.selectOption('zh-CN');
      await page.waitForURL('**/zh-CN**');

      const cookies = await page.context().cookies();
      const localeCookie = cookies.find(c => c.name === 'i18n_locale');
      expect(localeCookie).toBeDefined();
      expect(localeCookie?.value).toBe('zh-CN');
    });
  });

  test.describe('Browser Language Detection', () => {
    test('should redirect to Chinese when cookie is set to zh-CN', async ({ context, page }) => {
      await context.addCookies([{
        name: 'i18n_locale',
        value: 'zh-CN',
        domain: 'localhost',
        path: '/',
      }]);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      expect(page.url()).toContain('/zh-CN');
    });

    test('should stay on English when no cookie is set', async ({ page }) => {
      await page.context().clearCookies();

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      expect(page.url()).not.toContain('/zh-CN');
    });
  });

  test.describe('Route Navigation - English', () => {
    test.beforeEach(async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
    });

    test('should have admin link without language prefix on English page', async ({ page }) => {
      const adminLink = page.getByRole('link', { name: /admin/i });
      const href = await adminLink.getAttribute('href');
      expect(href).toBe('/admin');
    });

    test('should have recipe cards with correct links on English page', async ({ page }) => {
      const recipeCards = page.locator('a[href^="/recipes/"]').filter({
        hasNot: page.locator('[href*="zh-CN"]')
      });
      const count = await recipeCards.count();

      if (count > 0) {
        const firstHref = await recipeCards.first().getAttribute('href');
        expect(firstHref).toMatch(/^\/recipes\/[a-z0-9-]+$/);
        expect(firstHref).not.toContain('/zh-CN');
      }
    });
  });

  test.describe('Route Navigation - Chinese', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/zh-CN');
      await page.waitForLoadState('networkidle');
    });

    test('should have admin link with zh-CN prefix on Chinese page', async ({ page }) => {
      const adminLink = page.getByRole('link', { name: /管理|admin/i });
      const href = await adminLink.getAttribute('href');
      expect(href).toContain('/zh-CN/admin');
    });

    test('should have recipe cards with zh-CN prefix on Chinese page', async ({ page }) => {
      const recipeCards = page.locator('a[href*="/zh-CN/recipes/"]');
      const count = await recipeCards.count();

      if (count > 0) {
        const firstHref = await recipeCards.first().getAttribute('href');
        expect(firstHref).toContain('/zh-CN/recipes/');
      }
    });
  });

  test.describe('Admin Page Navigation', () => {
    test('should have correct add recipe link on English admin', async ({ page }) => {
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');

      const addLink = page.getByRole('link', { name: /\+|add|new/i });
      const href = await addLink.getAttribute('href');
      expect(href).toBe('/admin/recipes/new');
    });

    test('should have correct add recipe link on Chinese admin', async ({ page }) => {
      await page.goto('/zh-CN/admin');
      await page.waitForLoadState('networkidle');

      const addLink = page.getByRole('link', { name: /\+|添加|add/i });
      const href = await addLink.getAttribute('href');
      expect(href).toContain('/zh-CN/admin/recipes/new');
    });

    test('should have home link with correct prefix on Chinese admin', async ({ page }) => {
      await page.goto('/zh-CN/admin');
      await page.waitForLoadState('networkidle');

      const homeLink = page.getByRole('link', { name: /查看网站|view site/i });
      const href = await homeLink.getAttribute('href');
      expect(href).toContain('/zh-CN');
    });

    test('should have cancel links with correct prefix on Chinese edit page', async ({ page }) => {
      await page.goto('/zh-CN/admin/recipes/new/edit');
      await page.waitForLoadState('networkidle');

      const cancelLinks = page.getByRole('link', { name: /取消|cancel/i });
      const count = await cancelLinks.count();

      if (count > 0) {
        const firstHref = await cancelLinks.first().getAttribute('href');
        expect(firstHref).toContain('/zh-CN/admin');
      }
    });
  });

  test.describe('Link Generation', () => {
    test('English homepage should generate correct navigation links', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const allLinks = page.locator('a[href^="/"]');
      const count = await allLinks.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const href = await allLinks.nth(i).getAttribute('href') || '';
        if (href.startsWith('/recipes/') || href.startsWith('/admin')) {
          expect(href).not.toContain('/zh-CN');
        }
      }
    });

    test('Chinese homepage should generate correct navigation links', async ({ page }) => {
      await page.goto('/zh-CN');
      await page.waitForLoadState('networkidle');

      const allLinks = page.locator('a[href^="/"]');
      const count = await allLinks.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const href = await allLinks.nth(i).getAttribute('href') || '';
        if (href.startsWith('/recipes/') || href.startsWith('/admin')) {
          expect(href).toContain('/zh-CN');
        }
      }
    });
  });
});
