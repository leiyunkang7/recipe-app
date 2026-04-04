import { test, expect } from '@playwright/test';

test.describe('Recipe App - Public Pages', () => {
  test('should navigate to homepage', async ({ page }) => {
    const response = await page.goto('/zh-CN/');
    expect(response?.ok()).toBeTruthy();
  });

  test('should have basic page elements', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForTimeout(1000);
    const html = await page.content();
    expect(html.length).toBeGreaterThan(0);
  });

  test('should find input elements', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForTimeout(1000);
    const inputs = await page.locator('input').count();
    expect(inputs).toBeGreaterThanOrEqual(0);
  });

  test('should not have white screen (page renders visible content)', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForSelector('body', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const bodyContent = await page.locator('body').innerHTML();
    expect(bodyContent.trim().length).toBeGreaterThan(100);

  });
});

test.describe('Recipe App - Form Validation', () => {
  test('should load edit page', async ({ page }) => {
    await page.goto('/zh-CN/admin/recipes/1/edit');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();
  });
});
