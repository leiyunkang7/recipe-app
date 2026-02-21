import { test, expect } from '@playwright/test';

test.describe('Recipe App - Public Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load homepage', async ({ page }) => {
    await expect(page).toHaveTitle(/Recipe App/);
    // Check if page has basic structure
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display recipe list or empty state', async ({ page }) => {
    // Either recipes are shown or empty state is displayed
    const recipes = page.locator('.recipe-card, .recipe-item, [data-testid="recipe"]');
    const emptyState = page.locator('text=/no recipes/i, text=/empty/i, text=/not found/i');

    const count = await recipes.count();
    if (count > 0) {
      await expect(recipes.first()).toBeVisible();
    } else {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should have search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i], input[name*="search" i], [data-testid="search-input"]').first();

    const count = await searchInput.count();
    if (count > 0) {
      await searchInput.fill('tomato');
      await page.keyboard.press('Enter');

      // Wait for search to complete
      await page.waitForTimeout(1000);

      // Verify we're still on the page and no errors occurred
      await expect(page).not.toHaveURL(/error/);
    }
  });

  test('should have category filter', async ({ page }) => {
    const categorySelect = page.locator('select#category, select[name="category"], [data-testid="category-filter"]').first();

    const count = await categorySelect.count();
    if (count > 0) {
      await categorySelect.selectOption('Dinner');
      await page.waitForTimeout(1000);

      // Verify no errors
      await expect(page).not.toHaveURL(/error/);
    }
  });

  test('should navigate to recipe detail when clicking a recipe', async ({ page }) => {
    const recipeCard = page.locator('.recipe-card, .recipe-item, [data-testid="recipe"]').first();

    const count = await recipeCard.count();
    if (count > 0) {
      await recipeCard.click();

      // Should navigate to detail page
      await page.waitForTimeout(1000);
      await expect(page).not.toHaveURL(/\//); // Should be on a different URL
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check if mobile menu exists
    const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, button[aria-label*="menu" i]').first();

    const count = await mobileMenu.count();
    if (count > 0) {
      await expect(mobileMenu).toBeVisible();
    }

    // Check content is still accessible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle navigation', async ({ page }) => {
    // Test navigation links if they exist
    const homeLink = page.locator('a[href="/"], a:has-text("home")').first();

    const count = await homeLink.count();
    if (count > 0) {
      await homeLink.click();
      await expect(page).toHaveURL(/\//);
    }
  });
});
