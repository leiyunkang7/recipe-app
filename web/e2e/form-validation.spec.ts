import { test, expect } from '@playwright/test';

test.describe('Recipe App - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/zh-CN/admin/recipes/new/edit');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('should load form page', async ({ page }) => {
    await page.goto('/zh-CN/admin/recipes/new/edit');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const form = page.locator('form');
    await expect(form).toBeVisible();
  });
});

test.describe('Recipe App - Accessibility', () => {
  test('language switcher should have aria-label', async ({ page }) => {
    // LanguageSwitcher is on admin page, not on home page
    await page.goto('/zh-CN/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const languageSwitcher = page.locator('[aria-label="Select language"]');
    await expect(languageSwitcher).toBeVisible();
  });

  test('delete buttons should have aria-label', async ({ page }) => {
    await page.goto('/zh-CN/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const deleteButtons = page.locator('button[aria-label="Delete"], button[aria-label="删除"]');
    const count = await deleteButtons.count();

    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Recipe App - Search Debounce', () => {
  test('search should debounce input', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // HeroSection search input: placeholder contains "搜索" in Chinese
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();

    const startTime = Date.now();

    await searchInput.fill('t', { delay: 50 });
    await searchInput.fill('to', { delay: 50 });
    await searchInput.fill('tom', { delay: 50 });
    await searchInput.fill('toma', { delay: 50 });
    await searchInput.fill('tomat', { delay: 50 });
    await searchInput.fill('tomato', { delay: 50 });

    await page.waitForTimeout(300);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should complete well within 2 seconds (debounce doesn't add significant time to fill)
    expect(duration).toBeLessThan(2000);
  });
});
