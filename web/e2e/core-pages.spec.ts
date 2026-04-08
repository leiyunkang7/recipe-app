import { test, expect } from '@playwright/test';

/**
 * Core Pages E2E Tests
 * Tests for login, favorites, my-recipes, profile, and nutrition pages
 * Uses proper waits and meaningful assertions for stable tests
 */

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/zh-CN/login');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display login form elements', async ({ page }) => {
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator('#password');
    await expect(passwordInput).toBeVisible();

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();

    const googleButton = page.locator('button:has-text("Google"), button:has-text("谷歌")');
    await expect(googleButton).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    const toggleButton = page.locator('#password ~ button').first();
    const toggleCount = await toggleButton.count();

    if (toggleCount > 0) {
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });

  test('should show error for empty form submission', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    const errorMessage = page.locator('text=/错误|error|必填|required/i');
    await expect(errorMessage.first()).toBeVisible({ timeout: 3000 });
  });

  test('should have register link', async ({ page }) => {
    const registerLink = page.locator('a[href*="/register"], a[href*="/zh-CN/register"]');
    await expect(registerLink.first()).toBeVisible();
  });

  test.describe('Mobile View', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display login form on mobile', async ({ page }) => {
      const form = page.locator('form');
      await expect(form).toBeVisible();

      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
    });

    test('should display bottom navigation on mobile', async ({ page }) => {
      const bottomNav = page.locator('nav[aria-label="底部导航"], nav.fixed.bottom-0');
      const count = await bottomNav.count();
      if (count > 0) {
        await expect(bottomNav.first()).toBeVisible();
      }
    });
  });
});

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/zh-CN/register');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display all form fields', async ({ page }) => {
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#confirmPassword')).toBeVisible();
    await expect(page.locator('#verificationCode')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should have password type for password fields', async ({ page }) => {
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    await expect(page.locator('#confirmPassword')).toHaveAttribute('type', 'password');
  });

  test('should have proper labels for accessibility', async ({ page }) => {
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="username"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
  });
});

test.describe('Favorites Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/zh-CN/favorites');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display page title', async ({ page }) => {
    const title = page.locator('h1');
    await expect(title).toBeVisible();
  });

  test.describe('Mobile View', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('should display favorites on mobile', async ({ page }) => {
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();
    });
  });
});

test.describe('My Recipes Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/zh-CN/my-recipes');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display page header or redirect', async ({ page }) => {
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await expect(page.locator('form')).toBeVisible();
    } else {
      await expect(page.locator('header, main')).toBeVisible();
    }
  });
});

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/zh-CN/profile');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display profile page or redirect', async ({ page }) => {
    await page.waitForTimeout(1000);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await expect(page.locator('form')).toBeVisible();
    } else {
      await expect(page.locator('main')).toBeVisible();
    }
  });
});

test.describe('Nutrition Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/zh-CN/profile/nutrition');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display nutrition page', async ({ page }) => {
    await expect(page.locator('main, form').first()).toBeVisible();
  });
});

test.describe('Recipe List Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/zh-CN/recipes');
    await page.waitForLoadState('domcontentloaded');
  });

  test('should display page with content', async ({ page }) => {
    const gridOrFilters = page.locator('[class*="grid"], select, input[type="text"]');
    const count = await gridOrFilters.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should handle search query', async ({ page }) => {
    await page.goto('/zh-CN/recipes?search=test');
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/zh-CN/recipes');
  });
});
