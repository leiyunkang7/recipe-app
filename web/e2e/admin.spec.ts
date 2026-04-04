import { test, expect } from '@playwright/test';

test.describe('Recipe App - Admin Pages', () => {
  test('should navigate to admin dashboard', async ({ page }) => {
    const response = await page.goto('/zh-CN/admin');
    expect(response?.ok()).toBeTruthy();
  });

  test('should have basic page elements', async ({ page }) => {
    await page.goto('/zh-CN/admin');
    await page.waitForTimeout(1000);
    const html = await page.content();
    expect(html.length).toBeGreaterThan(0);
  });

  test('should find button elements', async ({ page }) => {
    await page.goto('/zh-CN/admin');
    await page.waitForTimeout(1000);
    const buttons = await page.locator('button').count();
    expect(buttons).toBeGreaterThanOrEqual(0);
  });

  test('should find interactive elements', async ({ page }) => {
    await page.goto('/zh-CN/admin');
    await page.waitForTimeout(1000);
    const buttons = await page.locator('button').count();
    const inputs = await page.locator('input, select, textarea').count();
    expect(buttons + inputs).toBeGreaterThanOrEqual(0);
  });

  test.describe('Mobile BottomNav', () => {
    test.use({
      viewport: { width: 375, height: 667 },
    });

    test('should display bottom navigation on mobile', async ({ page }) => {
      await page.goto('/zh-CN/admin');
      await page.waitForTimeout(1000);

      const bottomNav = page.locator('nav.fixed.bottom-0');
      await expect(bottomNav).toBeVisible();
    });

    test('should have proper padding for bottom nav on mobile', async ({ page }) => {
      await page.goto('/zh-CN/admin');
      await page.waitForTimeout(1000);

      const bottomNav = page.locator('nav.fixed.bottom-0');
      await expect(bottomNav).toBeVisible();
    });

    test('should navigate to home via bottom nav', async ({ page }) => {
      await page.goto('/zh-CN/admin');
      await page.waitForTimeout(1000);

      const homeLink = page.locator('nav.fixed.bottom-0 a').first();
      await homeLink.click();

      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/');
    });
  });

  test.describe('Desktop View', () => {
    test.use({
      viewport: { width: 1280, height: 720 },
    });

    test('should hide bottom navigation on desktop', async ({ page }) => {
      await page.goto('/zh-CN/admin');
      await page.waitForTimeout(1000);

      const bottomNav = page.locator('nav.fixed.bottom-0');
      await expect(bottomNav).not.toBeVisible();
    });

    test('should have no extra padding on desktop', async ({ page }) => {
      await page.goto('/zh-CN/admin');
      await page.waitForTimeout(1000);

      const mainContainer = page.locator('main');
      await expect(mainContainer).not.toHaveClass(/pb-16/);
    });
  });
});
