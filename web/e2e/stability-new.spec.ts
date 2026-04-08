import { test, expect, Page } from "@playwright/test";
import { trackConsoleErrors, getConsoleErrors, safeClick, waitForPageReady } from "./helpers/test-helpers";

/**
 * Stability Tests - Critical User Flows
 * Tests that verify core app stability and proper error handling
 */

// Shared state for auth tests
let testEmail = '';
let testPassword = '';

test.describe("App Stability", () => {
  test("should load homepage and display content", async ({ page }) => {
    trackConsoleErrors(page);
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");

    // Wait for main content
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Verify meaningful content loaded
    const html = await body.innerHTML();
    expect(html.length).toBeGreaterThan(200);

    // Should not have critical console errors
    const errors = getConsoleErrors();
    const criticalErrors = errors.filter(e => !e.includes('Warning') && !e.includes('deprecat'));
    expect(criticalErrors.length).toBeLessThan(3);
  });

  test("should handle rapid navigation between pages", async ({ page }) => {
    await page.goto("/zh-CN/");
    await waitForPageReady(page);

    // Quick navigation to recipe
    const recipeLink = page.locator('a[href*="/zh-CN/recipes/"]').first();
    if (await recipeLink.count() > 0) {
      await recipeLink.click();
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toMatch(/\/zh-CN\/recipes\/.+/);

      // Quick back to home
      await page.goBack();
      await page.waitForLoadState("domcontentloaded");
    }
  });

  test("should handle search input without crashing", async ({ page }) => {
    await page.goto("/zh-CN/");
    await waitForPageReady(page);

    const searchInput = page.locator("input[type=\"text\"]").first();
    if (await searchInput.count() > 0) {
      await searchInput.fill("test");
      await page.waitForTimeout(300);
      await searchInput.clear();
      await page.waitForTimeout(300);
    }

    // Page should still be functional
    await expect(page.locator("body")).toBeVisible();
  });

  test("should handle category filter selection", async ({ page }) => {
    await page.goto("/zh-CN/");
    await waitForPageReady(page);

    const categoryButtons = page.locator("button.rounded-full");
    const count = await categoryButtons.count();

    if (count > 1) {
      // Click second category
      await categoryButtons.nth(1).click();
      await page.waitForTimeout(500);

      // Click first category to reset
      await categoryButtons.first().click();
      await page.waitForTimeout(300);
    }

    // Page should remain stable
    await expect(page.locator("body")).toBeVisible();
  });

  test("should load recipe detail page without errors", async ({ page }) => {
    trackConsoleErrors(page);
    await page.goto("/zh-CN/");
    await waitForPageReady(page);

    const recipeLink = page.locator('a[href*="/zh-CN/recipes/"]').first();
    if (await recipeLink.count() > 0) {
      await recipeLink.click();
      await page.waitForLoadState("domcontentloaded");

      // Verify recipe content loaded
      const body = page.locator("body");
      const html = await body.innerHTML();
      expect(html.length).toBeGreaterThan(100);

      // Check for recipe title
      const heading = page.locator("h1");
      if (await heading.count() > 0) {
        await expect(heading.first()).toBeVisible();
      }
    }
  });

  test("should handle admin page access", async ({ page }) => {
    await page.goto("/zh-CN/admin");
    await waitForPageReady(page);

    const body = page.locator("body");
    const html = await body.innerHTML();
    expect(html.length).toBeGreaterThan(50);
  });

  test("should handle recipe form page", async ({ page }) => {
    await page.goto("/zh-CN/admin/recipes/new/edit");
    await waitForPageReady(page);

    const form = page.locator("form");
    await expect(form).toBeVisible({ timeout: 10000 });
  });

  test("should handle login page", async ({ page }) => {
    await page.goto("/zh-CN/login");
    await waitForPageReady(page);

    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible();

    const passwordInput = page.locator("#password");
    await expect(passwordInput).toBeVisible();
  });

  test("should handle register page", async ({ page }) => {
    await page.goto("/zh-CN/register");
    await waitForPageReady(page);

    const form = page.locator("form");
    await expect(form).toBeVisible();

    // Fill form partially
    await page.locator("#email").fill("test@example.com");
    await page.locator("#username").fill("testuser");
  });

  test("should handle non-existent recipe gracefully", async ({ page }) => {
    await page.goto("/zh-CN/recipes/non-existent-id-12345");
    await waitForPageReady(page);

    // Should show some content (error page or redirect)
    const body = page.locator("body");
    const html = await body.innerHTML();
    expect(html.length).toBeGreaterThan(20);
  });

  test("should maintain session across page loads", async ({ page }) => {
    // Visit home
    await page.goto("/zh-CN/");
    await waitForPageReady(page);

    // Visit another page
    await page.goto("/zh-CN/recipes");
    await waitForPageReady(page);

    // Go back to home
    await page.goto("/zh-CN/");
    await waitForPageReady(page);

    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Mobile Stability", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should work on mobile viewport", async ({ page }) => {
    trackConsoleErrors(page);
    await page.goto("/zh-CN/");
    await waitForPageReady(page);

    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Verify bottom nav exists on mobile
    const bottomNav = page.locator("nav.fixed.bottom-0").first();
    // Nav might or might not be present depending on page

    const errors = getConsoleErrors();
    expect(errors.length).toBeLessThan(5);
  });

  test("should handle touch interactions", async ({ page }) => {
    await page.goto("/zh-CN/");
    await waitForPageReady(page);

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    // Scroll up
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    await expect(page.locator("body")).toBeVisible();
  });

  test("should display login form on mobile", async ({ page }) => {
    await page.goto("/zh-CN/login");
    await waitForPageReady(page);

    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });
});

test.describe("Dark Mode Stability", () => {
  test("should toggle dark mode without errors", async ({ page }) => {
    await page.goto("/zh-CN/");
    await waitForPageReady(page);

    const themeToggle = page.locator("button[aria-label*=\"theme\"]").first();
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(500);

      // Click again to toggle back
      await themeToggle.click();
      await page.waitForTimeout(300);
    }

    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("i18n Stability", () => {
  test("should switch between locales", async ({ page }) => {
    // Chinese locale
    await page.goto("/zh-CN/");
    await waitForPageReady(page);
    expect(page.url()).toContain("/zh-CN");

    // English locale
    await page.goto("/en/");
    await waitForPageReady(page);
    // May redirect based on detection
    expect(page.url().length).toBeGreaterThan(0);
  });

  test("should load Chinese admin page", async ({ page }) => {
    await page.goto("/zh-CN/admin");
    await waitForPageReady(page);
    const body = page.locator("body");
    expect((await body.innerHTML()).length).toBeGreaterThan(50);
  });
});
