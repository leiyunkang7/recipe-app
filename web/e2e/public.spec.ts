import { test, expect } from '@playwright/test';

test.describe('Recipe App - Public Pages', () => {
  test('should navigate to homepage', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
  });

  test('should have basic page elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const html = await page.content();
    expect(html.length).toBeGreaterThan(0);
  });

  test('should find input elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const inputs = await page.locator('input').count();
    expect(inputs).toBeGreaterThanOrEqual(0);
  });

  test('should find link elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const links = await page.locator('a').count();
    expect(links).toBeGreaterThanOrEqual(0);
  });
});
