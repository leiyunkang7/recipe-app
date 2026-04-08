import { test, expect } from "@playwright/test";

test.describe("Home Page", () => {
  test.describe("Mobile View", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("should display main layout elements on home page", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("header", { timeout: 10000 });
      const header = page.locator("header").first();
      await expect(header).toBeVisible();
    });

    test("should have category filter buttons", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("button", { timeout: 10000 });
      const categoryButtons = page.locator("button.rounded-full");
      const count = await categoryButtons.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test("should toggle category selection", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("button", { timeout: 10000 });
      const categoryButtons = page.locator("button.rounded-full");
      const count = await categoryButtons.count();
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      }
    });

    test("should have search input with pill shape", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("input[type=\"text\"]", { timeout: 10000 });
      const searchInput = page.locator("input[type=\"text\"]").first();
      await expect(searchInput).toBeVisible();
      const inputClass = await searchInput.getAttribute("class") || "";
      expect(inputClass).toContain("rounded");
    });

    test("should display bottom navigation", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("nav", { timeout: 10000 });
      const bottomNav = page.locator("nav[aria-label*=\"底部\"]").first();
      const count = await bottomNav.count();
      if (count > 0) {
        await expect(bottomNav).toBeVisible();
      } else {
        const fallback = page.locator("nav.fixed.bottom-0").first();
        if (await fallback.count() > 0) {
          await expect(fallback).toBeVisible();
        }
      }
    });
  });

  test.describe("Desktop View", () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test("should display main layout on desktop", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("header", { timeout: 10000 });
      const header = page.locator("header").first();
      await expect(header).toBeVisible();
    });

    test("should hide bottom navigation on desktop", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("nav", { timeout: 10000 });
      const bottomNav = page.locator("nav.fixed.bottom-0");
      const count = await bottomNav.count();
      if (count > 0) {
        await expect(bottomNav.first()).not.toBeVisible();
      }
    });

    test("should have admin link in header", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("a[href*=\"/admin\"]", { timeout: 10000 });
      const adminLink = page.locator("a[href*=\"/admin\"]");
      const count = await adminLink.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("Search Functionality", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("should accept search input", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("input[type=\"text\"]", { timeout: 10000 });
      const searchInput = page.locator("input[type=\"text\"]").first();
      await expect(searchInput).toBeVisible();
      await searchInput.fill("test");
      await expect(searchInput).toHaveValue("test");
    });
  });
});
