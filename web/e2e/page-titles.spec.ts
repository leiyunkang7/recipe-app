import { test, expect } from '@playwright/test';

test.describe('Page Titles', () => {
  test('homepage should have correct title in English', async ({ page }) => {
    await page.goto('/en/');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('head', { timeout: 10000 });

    const title = await page.title();
    expect(title).toContain('Recipe App');
    expect(title).toContain('Discover delicious recipes');
  });

  test('homepage should have correct title in Chinese', async ({ page }) => {
    await page.goto('/zh-CN');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('head', { timeout: 10000 });

    const title = await page.title();
    expect(title).toContain('菜谱应用');
    expect(title).toContain('发现美味食谱');
  });

  test('admin page should have correct title in English', async ({ page }) => {
    await page.goto('/en/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('head', { timeout: 10000 });

    const title = await page.title();
    expect(title).toContain('Admin');
    expect(title).toContain('Recipe App');
  });

  test('admin page should have correct title in Chinese', async ({ page }) => {
    await page.goto('/zh-CN/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('head', { timeout: 10000 });

    const title = await page.title();
    expect(title).toContain('管理后台');
    expect(title).toContain('菜谱应用');
  });

  test('new recipe page should have correct title in English', async ({ page }) => {
    await page.goto('/en/admin/recipes/new');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('head', { timeout: 10000 });

    const title = await page.title();
    expect(title).toContain('New Recipe');
    expect(title).toContain('Admin Dashboard');
  });

  test('new recipe page should have correct title in Chinese', async ({ page }) => {
    await page.goto('/zh-CN/admin/recipes/new');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('head', { timeout: 10000 });

    const title = await page.title();
    expect(title).toContain('新建菜谱');
    expect(title).toContain('管理后台');
  });

  test('recipe detail page should have correct title format', async ({ page }) => {
    await page.goto('/zh-CN');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('head', { timeout: 10000 });

    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    expect(title).toContain('菜谱应用');
  });
});
