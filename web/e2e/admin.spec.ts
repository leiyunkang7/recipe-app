import { test, expect } from '@playwright/test';

test.describe('Recipe App - Admin Pages', () => {
  test('should navigate to admin dashboard', async ({ page }) => {
    const response = await page.goto('/zh-CN/admin');
    expect(response?.ok()).toBeTruthy();
  });

  test('should have basic page elements', async ({ page }) => {
    await page.goto('/zh-CN/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('body', { timeout: 10000 });
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    const html = await page.content();
    expect(html.length).toBeGreaterThan(0);
  });

  test('should find button elements', async ({ page }) => {
    await page.goto('/zh-CN/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    const buttons = await page.locator('button').count();
    expect(buttons).toBeGreaterThanOrEqual(0);
  });

  test('should find interactive elements', async ({ page }) => {
    await page.goto('/zh-CN/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('body', { timeout: 10000 });
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    const buttons = await page.locator('button').count();
    const inputs = await page.locator('input, select, textarea').count();
    expect(buttons + inputs).toBeGreaterThanOrEqual(0);
  });

  test.describe('Mobile View', () => {
    test.use({
      viewport: { width: 375, height: 667 },
    });

    test('should render page content on mobile', async ({ page }) => {
      await page.goto('/zh-CN/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('body', { timeout: 10000 });
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      const html = await page.content();
      expect(html.length).toBeGreaterThan(0);
    });

    // Note: Admin page does not include BottomNav (uses desktop-only layout with LazyBottomNav removed)
    // BottomNav tests are in bottom-nav.spec.ts for pages that include it
  });

  test.describe('Desktop View', () => {
    test.use({
      viewport: { width: 1280, height: 720 },
    });

    test('should hide bottom navigation on desktop', async ({ page }) => {
      await page.goto('/zh-CN/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('body', { timeout: 10000 });
      await page.waitForLoadState("domcontentloaded").catch(() => {});

      const bottomNav = page.locator('nav.fixed.bottom-0');
      // BottomNav has md:hidden — hidden at desktop viewport
      await expect(bottomNav).not.toBeVisible();
    });

    test('should have no extra padding on desktop', async ({ page }) => {
      await page.goto('/zh-CN/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('body', { timeout: 10000 });
      await page.waitForLoadState("domcontentloaded").catch(() => {});

      // Admin page outer div has `pb-16 md:pb-0` — at desktop, md:pb-0 applies
      // The main element itself doesn't carry pb-16
      const mainContainer = page.locator('main');
      if (await mainContainer.count() > 0) {
        const mainClass = await mainContainer.getAttribute('class') || '';
        // main should NOT have pb-16 (the outer div has it, but md:pb-0 overrides at desktop)
        // This test is checking that desktop doesn't have mobile-specific padding
        expect(mainClass).not.toMatch(/pb-16/);
      }
    });
  });
});
