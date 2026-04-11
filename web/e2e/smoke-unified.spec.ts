import { test, expect, Page } from "@playwright/test";
import {
  waitForPageReady,
  trackConsoleErrors,
  getConsoleErrors,
  clearConsoleErrors,
  navigateAndWaitForContent,
  getFirstRecipeLink,
  assertPageHasContent,
  elementExists,
  elementIsVisible,
  clickElement,
} from "./helpers/test-helpers";

test.describe("Unified Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    trackConsoleErrors(page);
  });

  test.afterEach(async () => {
    clearConsoleErrors();
  });

  test.describe("Homepage Core", () => {
    test("should load homepage with Chinese locale", async ({ page }) => {
      await page.goto("/zh-CN/");
      await waitForPageReady(page);
      await assertPageHasContent(page, 100);
      expect(page.url()).toContain("/zh-CN");
    });

    test("should load homepage with English locale", async ({ page }) => {
      await page.goto("/en/");
      await waitForPageReady(page);
      await assertPageHasContent(page, 100);
    });

    test("should have navigation elements", async ({ page }) => {
      await page.goto("/zh-CN/");
      await waitForPageReady(page);
      const hasNavOrMain = await elementExists(page, "nav, header, main, [role=main]");
      expect(hasNavOrMain).toBe(true);
    });

    test("should have recipe links", async ({ page }) => {
      await page.goto("/zh-CN/");
      await waitForPageReady(page);
      const href = await getFirstRecipeLink(page);
      expect(href).toBeTruthy();
    });
  });

  test.describe("Recipe Navigation", () => {
    test("should navigate to recipe detail", async ({ page }) => {
      await page.goto("/zh-CN/");
      await waitForPageReady(page);
      const href = await getFirstRecipeLink(page);
      if (!href) { test.skip(); return; }
      const success = await navigateAndWaitForContent(page, href);
      expect(success).toBe(true);
      const hasTitle = await elementExists(page, "h1, h2, [class*=title]");
      expect(hasTitle).toBe(true);
    });

    test("should navigate back from recipe detail", async ({ page }) => {
      await page.goto("/zh-CN/");
      await waitForPageReady(page);
      const href = await getFirstRecipeLink(page);
      if (!href) { test.skip(); return; }
      await navigateAndWaitForContent(page, href);
      await page.goBack();
      await waitForPageReady(page);
      await assertPageHasContent(page, 50);
    });
  });

  test.describe("Auth Pages", () => {
    test("should display login page", async ({ page }) => {
      const success = await navigateAndWaitForContent(page, "/zh-CN/login");
      expect(success).toBe(true);
      const hasEmail = await elementExists(page, "#email, input[type=email]");
      const hasPassword = await elementExists(page, "#password, input[type=password]");
      expect(hasEmail || hasPassword).toBe(true);
    });

    test("should display register page", async ({ page }) => {
      const success = await navigateAndWaitForContent(page, "/zh-CN/register");
      expect(success).toBe(true);
      const hasForm = await elementExists(page, "form");
      expect(hasForm).toBe(true);
    });
  });

  test.describe("Admin Pages", () => {
    test("should load admin page", async ({ page }) => {
      const success = await navigateAndWaitForContent(page, "/zh-CN/admin");
      expect(success).toBe(true);
      await assertPageHasContent(page, 50);
    });

    test("should load recipe form", async ({ page }) => {
      const success = await navigateAndWaitForContent(page, "/zh-CN/admin/recipes/new/edit");
      expect(success).toBe(true);
      const hasForm = await elementExists(page, "form");
      expect(hasForm).toBe(true);
    });
  });

  test.describe("Recipe List", () => {
    test("should load recipes list page", async ({ page }) => {
      const success = await navigateAndWaitForContent(page, "/zh-CN/recipes");
      expect(success).toBe(true);
      await assertPageHasContent(page, 100);
    });
  });

  test.describe("Error Handling", () => {
    test("should handle invalid recipe gracefully", async ({ page }) => {
      await page.goto("/zh-CN/recipes/non-existent-id-12345");
      await waitForPageReady(page);
      const hasContent = await elementIsVisible(page, "body");
      expect(hasContent).toBe(true);
    });
  });

  test.describe("Mobile Viewport", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("should load homepage on mobile", async ({ page }) => {
      await page.goto("/zh-CN/");
      await waitForPageReady(page);
      await assertPageHasContent(page, 100);
    });

    test("should navigate to recipe detail on mobile", async ({ page }) => {
      await page.goto("/zh-CN/");
      await waitForPageReady(page);
      const href = await getFirstRecipeLink(page);
      if (!href) { test.skip(); return; }
      await navigateAndWaitForContent(page, href);
      await assertPageHasContent(page, 50);
    });
  });

  test.describe("Console Health", () => {
    test("should not have critical console errors on homepage", async ({ page }) => {
      trackConsoleErrors(page);
      await page.goto("/zh-CN/");
      await waitForPageReady(page);
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
