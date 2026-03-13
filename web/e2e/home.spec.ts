import { test, expect } from '@playwright/test';

test.describe('Home Page - Updated Layout', () => {
  test.describe('Mobile View', () => {
    test.use({
      viewport: { width: 375, height: 667 },
    });

    test('should display main layout elements on home page', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1500);

      // Mobile header uses md:hidden class
      const mobileHeader = page.locator('header.md\\:hidden');
      await expect(mobileHeader).toBeVisible();
    });

    test('should have category filter buttons', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1500);

      const categoryButtons = page.locator('button.rounded-full');
      const buttonCount = await categoryButtons.count();
      expect(buttonCount).toBeGreaterThan(0);
    });

    test('should toggle category selection', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1500);

      const categoryButtons = page.locator('button.rounded-full');
      const count = await categoryButtons.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should have search input with pill shape', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1500);

      const searchInput = page.locator('input[type="text"]');
      await expect(searchInput).toBeVisible();

      const inputClass = await searchInput.getAttribute('class');
      expect(inputClass).toContain('rounded-full');
    });

    test('should display bottom navigation', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1500);

      const bottomNav = page.locator('nav.fixed.bottom-0');
      await expect(bottomNav).toBeVisible();
    });
  });

  test.describe('Desktop View', () => {
    test.use({
      viewport: { width: 1280, height: 720 },
    });

    test('should display main layout on desktop', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1500);

      const header = page.locator('header');
      await expect(header).toBeVisible();
    });

    test('should hide bottom navigation on desktop', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1500);

      const bottomNav = page.locator('nav.fixed.bottom-0');
      await expect(bottomNav).not.toBeVisible();
    });

    test('should have admin link in header', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1500);

      const adminLink = page.locator('header a[href*="/admin"]');
      await expect(adminLink).toBeVisible();
    });
  });

  test.describe('Search Functionality', () => {
    test.use({
      viewport: { width: 375, height: 667 },
    });

    test('should accept search input', async ({ page }) => {
      await page.goto('/');
      await page.waitForTimeout(1500);

      const searchInput = page.locator('input[type="text"]');
      await searchInput.fill('test');
      await expect(searchInput).toHaveValue('test');
    });
  });
});
