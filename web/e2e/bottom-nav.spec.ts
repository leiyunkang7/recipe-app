import { test, expect } from '@playwright/test';

test.describe('BottomNav Component', () => {
  test.describe('Mobile View', () => {
    test.use({
      viewport: { width: 375, height: 667 },
    });

    test('should display bottom navigation on home page', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForTimeout(1000);

      const bottomNav = page.locator('nav.fixed.bottom-0');
      await expect(bottomNav).toBeVisible();
    });

    test('should display bottom navigation on admin page', async ({ page }) => {
      await page.goto('/zh-CN/admin');
      await page.waitForTimeout(1000);

      const bottomNav = page.locator('nav.fixed.bottom-0');
      await expect(bottomNav).toBeVisible();
    });

    test('should have correct navigation links', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForTimeout(1000);

      const homeLink = page.locator('nav.fixed.bottom-0 a').filter({ hasText: /首页|home/i }).first();
      const adminLink = page.locator('nav.fixed.bottom-0 a').filter({ hasText: /管理|admin/i }).first();

      await expect(homeLink).toBeVisible();
      await expect(adminLink).toBeVisible();
    });

    test('should navigate between pages via bottom nav', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForTimeout(1000);

      const adminLink = page.locator('nav.fixed.bottom-0 a').filter({ hasText: /管理|admin/i }).first();
      await adminLink.click();

      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/zh-CN/admin');
    });
  });

  test.describe('Desktop View', () => {
    test.use({
      viewport: { width: 1280, height: 720 },
    });

    test('should hide bottom navigation on desktop for home page', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForTimeout(1000);

      const bottomNav = page.locator('nav.fixed.bottom-0');
      await expect(bottomNav).not.toBeVisible();
    });

    test('should hide bottom navigation on desktop for admin page', async ({ page }) => {
      await page.goto('/zh-CN/admin');
      await page.waitForTimeout(1000);

      const bottomNav = page.locator('nav.fixed.bottom-0');
      await expect(bottomNav).not.toBeVisible();
    });
  });
});
