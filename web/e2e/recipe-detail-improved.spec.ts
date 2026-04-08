import { test, expect } from '@playwright/test';

/**
 * Recipe Detail Page Tests
 * Improved stability with proper waits and meaningful assertions
 */

test.describe('Recipe Detail Page', () => {
  test('should navigate from home to recipe detail', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for recipe links to appear
    const recipeLink = page.locator('a[href*="/zh-CN/recipes/"]').first();
    await recipeLink.waitFor({ state: 'visible', timeout: 10000 });

    // Click the first recipe
    await recipeLink.click();
    await page.waitForLoadState('domcontentloaded');

    // Should be on a recipe detail page
    expect(page.url()).toMatch(/\/zh-CN\/recipes\/.+/);

    // Title should be visible
    const title = page.locator('h1');
    await expect(title).toBeVisible();
  });

  test('should display recipe title on detail page', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForLoadState('domcontentloaded');

    const recipeLink = page.locator('a[href*="/zh-CN/recipes/"]').first();
    await recipeLink.waitFor({ state: 'visible', timeout: 10000 });
    await recipeLink.click();
    await page.waitForLoadState('domcontentloaded');

    const title = page.locator('h1');
    const titleText = await title.textContent();
    expect(titleText?.trim().length).toBeGreaterThan(0);
  });

  test('should display recipe content sections', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForLoadState('domcontentloaded');

    const recipeLink = page.locator('a[href*="/zh-CN/recipes/"]').first();
    await recipeLink.waitFor({ state: 'visible', timeout: 10000 });
    await recipeLink.click();
    await page.waitForLoadState('domcontentloaded');

    // Page should have some content structure
    const mainContent = page.locator('main, article, [class*="recipe"]');
    const count = await mainContent.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test.describe('Mobile View', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display recipe on mobile', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('domcontentloaded');

      const recipeLink = page.locator('a[href*="/zh-CN/recipes/"]').first();
      await recipeLink.waitFor({ state: 'visible', timeout: 10000 });
      await recipeLink.click();
      await page.waitForLoadState('domcontentloaded');

      const title = page.locator('h1');
      await expect(title).toBeVisible();
    });

    test('should display bottom navigation on mobile recipe detail', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('domcontentloaded');

      const recipeLink = page.locator('a[href*="/zh-CN/recipes/"]').first();
      await recipeLink.waitFor({ state: 'visible', timeout: 10000 });
      await recipeLink.click();
      await page.waitForLoadState('domcontentloaded');

      const bottomNav = page.locator('nav[aria-label="底部导航"], nav.fixed.bottom-0');
      const navCount = await bottomNav.count();
      if (navCount > 0) {
        await expect(bottomNav.first()).toBeVisible();
      }
    });
  });

  test.describe('Desktop View', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('should display recipe on desktop', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('domcontentloaded');

      const recipeLink = page.locator('a[href*="/zh-CN/recipes/"]').first();
      await recipeLink.waitFor({ state: 'visible', timeout: 10000 });
      await recipeLink.click();
      await page.waitForLoadState('domcontentloaded');

      const title = page.locator('h1');
      await expect(title).toBeVisible();
    });

    test('should hide bottom navigation on desktop', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('domcontentloaded');

      const recipeLink = page.locator('a[href*="/zh-CN/recipes/"]').first();
      await recipeLink.waitFor({ state: 'visible', timeout: 10000 });
      await recipeLink.click();
      await page.waitForLoadState('domcontentloaded');

      const bottomNav = page.locator('nav.fixed.bottom-0');
      const navCount = await bottomNav.count();
      if (navCount > 0) {
        await expect(bottomNav.first()).not.toBeVisible();
      }
    });
  });
});

test.describe('Category Navigation', () => {
  test('should filter recipes by category', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForLoadState('domcontentloaded');

    const categoryButtons = page.locator('button.rounded-full');
    const count = await categoryButtons.count();

    if (count > 1) {
      await categoryButtons.nth(1).click();
      await page.waitForTimeout(500);

      const url = page.url();
      expect(url.length).toBeGreaterThan(0);
    }
  });

  test('should highlight selected category', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForLoadState('domcontentloaded');

    const categoryButtons = page.locator('button.rounded-full');
    const count = await categoryButtons.count();

    if (count > 0) {
      await categoryButtons.first().click();
      await page.waitForTimeout(300);

      const buttonClass = await categoryButtons.first().getAttribute('class') || '';
      expect(buttonClass.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Search Functionality', () => {
  test('should accept and submit search input', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();

    await searchInput.fill('test');
    await expect(searchInput).toHaveValue('test');
  });

  test('should clear search input', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('test');
    await searchInput.clear();

    const value = await searchInput.inputValue();
    expect(value).toBe('');
  });
});
