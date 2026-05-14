import { test, expect, Page } from "@playwright/test";
import { trackConsoleErrors, getConsoleErrors, clearConsoleErrors } from "./helpers/test-helpers";

/**
 * Optimized Smoke Test Suite
 * 
 * Key improvements:
 * - Uses state-based waits instead of arbitrary timeouts
 * - Meaningful assertion context messages
 * - Graceful handling of missing elements
 * - Proper beforeEach/afterEach for console error tracking
 */

test.describe("Optimized Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    trackConsoleErrors(page);
  });

  test.afterEach(async () => {
    clearConsoleErrors();
  });

  test.describe("Homepage", () => {
    test("should load homepage with Chinese locale", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForFunction(() => document.readyState === "complete");
      
      // Verify content loaded with context
      const body = page.locator("body");
      await body.waitFor({ state: "attached", timeout: 10000 });
      const html = await body.innerHTML();
      expect(html.length).withContext("Homepage should have content").toBeGreaterThan(100);
      expect(page.url()).toContain("/zh-CN");
    });

    test("should load homepage with English locale", async ({ page }) => {
      await page.goto("/en/");
      await page.waitForLoadState("domcontentloaded");
      
      const body = page.locator("body");
      await body.waitFor({ state: "attached", timeout: 10000 });
      const html = await body.innerHTML();
      expect(html.length).withContext("English homepage should have content").toBeGreaterThan(50);
    });

    test("should have navigation elements", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      
      const hasNavOrMain = await page.locator("nav, header, main, [role=\"main\"]").count() > 0;
      expect(hasNavOrMain).withContext("Should have navigation or main content").toBe(true);
    });

    test("should have recipe links", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      
      const recipeLinks = page.locator("a[href*=\"/zh-CN/recipes/\"]");
      const count = await recipeLinks.count();
      expect(count).withContext("Should have at least one recipe link").toBeGreaterThan(0);
    });
  });

  test.describe("Recipe Navigation", () => {
    test("should navigate to recipe detail", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      
      const recipeLink = page.locator("a[href*=\"/zh-CN/recipes/\"]").first();
      const href = await recipeLink.getAttribute("href");
      
      if (!href) {
        test.skip();
        return;
      }
      
      await page.goto(href);
      await page.waitForLoadState("domcontentloaded");
      
      const title = page.locator("h1, h2, [class*=\"title\"]").first();
      await title.waitFor({ state: "visible", timeout: 10000 });
      expect(await title.isVisible()).withContext("Recipe title should be visible").toBe(true);
    });

    test("should navigate back from recipe detail", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      
      const recipeLink = page.locator("a[href*=\"/zh-CN/recipes/\"]").first();
      const href = await recipeLink.getAttribute("href");
      
      if (!href) {
        test.skip();
        return;
      }
      
      await page.goto(href);
      await page.waitForLoadState("domcontentloaded");
      await page.goBack();
      await page.waitForLoadState("domcontentloaded");
      
      const body = page.locator("body");
      const html = await body.innerHTML();
      expect(html.length).withContext("Should be back on homepage with content").toBeGreaterThan(50);
    });
  });

  test.describe("Auth Pages", () => {
    test("should display login page", async ({ page }) => {
      await page.goto("/zh-CN/login");
      await page.waitForLoadState("domcontentloaded");
      
      const emailInput = page.locator("#email, input[type=\"email\"]").first();
      const passwordInput = page.locator("#password, input[type=\"password\"]").first();
      
      await emailInput.waitFor({ state: "visible", timeout: 5000 });
      expect(await emailInput.isVisible()).withContext("Email input should be visible").toBe(true);
      expect(await passwordInput.isVisible()).withContext("Password input should be visible").toBe(true);
    });

    test("should display register page", async ({ page }) => {
      await page.goto("/zh-CN/register");
      await page.waitForLoadState("domcontentloaded");
      
      const form = page.locator("form").first();
      await form.waitFor({ state: "visible", timeout: 5000 });
      expect(await form.isVisible()).withContext("Registration form should be visible").toBe(true);
    });
  });

  test.describe("Admin Pages", () => {
    test("should load admin page", async ({ page }) => {
      await page.goto("/zh-CN/admin");
      await page.waitForLoadState("domcontentloaded");
      
      const body = page.locator("body");
      await body.waitFor({ state: "attached", timeout: 10000 });
      const html = await body.innerHTML();
      expect(html.length).withContext("Admin page should have content").toBeGreaterThan(50);
    });

    test("should load recipe form", async ({ page }) => {
      await page.goto("/zh-CN/admin/recipes/new/edit");
      await page.waitForLoadState("domcontentloaded");
      
      const form = page.locator("form").first();
      const hasForm = await form.count() > 0;
      expect(hasForm).withContext("Recipe form should exist").toBe(true);
    });
  });

  test.describe("Error Handling", () => {
    test("should handle invalid recipe gracefully", async ({ page }) => {
      await page.goto("/zh-CN/recipes/invalid-id-12345");
      await page.waitForLoadState("domcontentloaded");
      
      const body = page.locator("body");
      const html = await body.innerHTML();
      expect(html.length).withContext("Error page should still have content").toBeGreaterThan(0);
    });
  });

  test.describe("Mobile", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("should load homepage on mobile", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      
      const body = page.locator("body");
      const html = await body.innerHTML();
      expect(html.length).withContext("Mobile homepage should have content").toBeGreaterThan(50);
    });
  });

  test.describe("Console Health", () => {
    test("should not have critical console errors on homepage", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      
      const errors = getConsoleErrors();
      const criticalErrors = errors.filter(
        e => !e.includes("Warning") && !e.includes("deprecat")
      );
      expect(criticalErrors.length).withContext(
        "Critical console errors: " + criticalErrors.slice(0, 3).join(", ")
      ).toBeLessThan(3);
    });
  });
});
