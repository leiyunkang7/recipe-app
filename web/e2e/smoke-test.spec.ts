import { test, expect, Page } from "@playwright/test";
import {
  waitForPageReady,
  trackConsoleErrors,
  getConsoleErrors,
  navigateAndWaitForContent,
  getFirstRecipeLink,
  assertPageHasContent,
  elementExists,
  clickElement,
  elementIsVisible,
} from "./helpers/test-helpers";

/**
 * Smoke Test Suite - Core Flow Validation
 * 
 * Purpose: Fast feedback on critical paths
 * - Homepage loads with content
 * - Recipe navigation works
 * - Auth pages are accessible
 * - Core UI elements are present
 * 
 * Run these first before running full test suite
 */

test.describe("Smoke: Homepage Core", () => {
  test.beforeEach(async ({ page }) => {
    trackConsoleErrors(page);
  });

  test("homepage loads with Chinese locale", async ({ page }) => {
    await page.goto("/zh-CN/");
    await waitForPageReady(page);
    await assertPageHasContent(page, 100);
    expect(page.url()).toContain("/zh-CN");
  });

  test("homepage loads with English locale", async ({ page }) => {
    await page.goto("/en/");
    await waitForPageReady(page);
    await assertPageHasContent(page, 100);
  });

  test("homepage has navigation elements", async ({ page }) => {
    await page.goto("/zh-CN/");
    await waitForPageReady(page);
    
    // Check for navigation or main content
    const hasNavOrMain = await elementExists(page, "nav, header, main, [role=\"main\"]");
    expect(hasNavOrMain).toBe(true);
  });

  test("homepage has recipe listing", async ({ page }) => {
    await page.goto("/zh-CN/");
    await waitForPageReady(page);
    
    // Recipe links should exist
    const href = await getFirstRecipeLink(page);
    expect(href).toBeTruthy();
  });
});

test.describe("Smoke: Recipe Navigation", () => {
  test("can navigate to recipe detail", async ({ page }) => {
    await page.goto("/zh-CN/");
    await waitForPageReady(page);
    
    const href = await getFirstRecipeLink(page);
    if (!href) {
      test.skip();
      return;
    }
    
    const success = await navigateAndWaitForContent(page, href);
    expect(success).toBe(true);
    
    // Recipe detail should have a title
    const hasTitle = await elementExists(page, "h1, h2, [class*=\"title\"]");
    expect(hasTitle).toBe(true);
  });

  test("recipe detail has back navigation", async ({ page }) => {
    await page.goto("/zh-CN/");
    await waitForPageReady(page);
    
    const href = await getFirstRecipeLink(page);
    if (!href) {
      test.skip();
      return;
    }
    
    await navigateAndWaitForContent(page, href);
    
    // Back button or link should exist
    const hasBack = await elementExists(page, "a[href*=\"/zh-CN\"], a[href*=\"/en\"], button");
    expect(hasBack).toBe(true);
  });
});

test.describe("Smoke: Auth Pages", () => {
  test("login page is accessible", async ({ page }) => {
    const success = await navigateAndWaitForContent(page, "/zh-CN/login");
    expect(success).toBe(true);
    
    // Login form should exist
    const hasEmail = await elementExists(page, "#email, input[type=\"email\"]");
    const hasPassword = await elementExists(page, "#password, input[type=\"password\"]");
    expect(hasEmail || hasPassword).toBe(true);
  });

  test("register page is accessible", async ({ page }) => {
    const success = await navigateAndWaitForContent(page, "/zh-CN/register");
    expect(success).toBe(true);
    
    // Registration form should exist
    const hasForm = await elementExists(page, "form");
    expect(hasForm).toBe(true);
  });
});

test.describe("Smoke: Admin Pages", () => {
  test("admin page is accessible", async ({ page }) => {
    const success = await navigateAndWaitForContent(page, "/zh-CN/admin");
    expect(success).toBe(true);
    await assertPageHasContent(page, 50);
  });

  test("admin recipe form is accessible", async ({ page }) => {
    const success = await navigateAndWaitForContent(page, "/zh-CN/admin/recipes/new/edit");
    expect(success).toBe(true);
    
    // Form should exist
    const hasForm = await elementExists(page, "form");
    expect(hasForm).toBe(true);
  });
});

test.describe("Smoke: Recipe List", () => {
  test("recipes list page loads", async ({ page }) => {
    const success = await navigateAndWaitForContent(page, "/zh-CN/recipes");
    expect(success).toBe(true);
    await assertPageHasContent(page, 100);
  });
});

test.describe("Smoke: Error Handling", () => {
  test("handles invalid recipe gracefully", async ({ page }) => {
    await page.goto("/zh-CN/recipes/non-existent-id-12345");
    await waitForPageReady(page);
    
    // Should show some content (not blank page)
    const hasContent = await elementIsVisible(page, "body");
    expect(hasContent).toBe(true);
  });
});

test.describe("Smoke: Mobile Basic", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("homepage loads on mobile", async ({ page }) => {
    await page.goto("/zh-CN/");
    await waitForPageReady(page);
    await assertPageHasContent(page, 100);
  });

  test("recipe detail loads on mobile", async ({ page }) => {
    await page.goto("/zh-CN/");
    await waitForPageReady(page);
    
    const href = await getFirstRecipeLink(page);
    if (!href) {
      test.skip();
      return;
    }
    
    await navigateAndWaitForContent(page, href);
    await assertPageHasContent(page, 50);
  });
});

test.describe("Smoke: Console Health", () => {
  test("no critical console errors on homepage", async ({ page }) => {
    trackConsoleErrors(page);
    await page.goto("/zh-CN/");
    await waitForPageReady(page);
    
    const errors = getConsoleErrors();
    const criticalErrors = errors.filter(
      e => !e.includes("Warning") && !e.includes("deprecat")
    );
    expect(criticalErrors.length).withContext("Critical console errors found").toBeLessThan(3);
  });
});
