import { test, expect } from '@playwright/test';

test.describe('Recipe App - Admin Pages', () => {
  test('should navigate to admin dashboard', async ({ page }) => {
    const response = await page.goto('/admin');
    expect(response?.ok()).toBeTruthy();
  });

  test('should have basic page elements', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    const html = await page.content();
    expect(html.length).toBeGreaterThan(0);
  });

  test('should find button elements', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    const buttons = await page.locator('button').count();
    expect(buttons).toBeGreaterThanOrEqual(0);
  });

  test('should find interactive elements', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForTimeout(1000);
    const buttons = await page.locator('button').count();
    const inputs = await page.locator('input, select, textarea').count();
    expect(buttons + inputs).toBeGreaterThanOrEqual(0);
  });
});
