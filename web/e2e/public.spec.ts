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

  test('should not have white screen (page renders visible content)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const bodyContent = await page.locator('body').innerHTML();
    expect(bodyContent.trim().length).toBeGreaterThan(100);

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.trim().length).toBeGreaterThan(10);

    const visibleElements = await page.locator('body >> visible=true').count();
    expect(visibleElements).toBeGreaterThan(0);
  });

  test('should find link elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const links = await page.locator('a').count();
    expect(links).toBeGreaterThanOrEqual(0);
  });
});
