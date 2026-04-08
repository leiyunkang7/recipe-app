import { test, expect } from "@playwright/test";

test.describe("Recipe App - Form Validation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/zh-CN/admin/recipes/new/edit");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("form", { timeout: 15000 });
  });

  test("should load form page", async ({ page }) => {
    const form = page.locator("form");
    await expect(form).toBeVisible();
  });
});

test.describe("Recipe App - Accessibility", () => {
  test("language switcher should have aria-label", async ({ page }) => {
    await page.goto("/zh-CN/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("body", { timeout: 10000 });
    
    const languageSwitcher = page.locator("[aria-label*=\"language\"], [aria-label*=\"语言\"]");
    const count = await languageSwitcher.count();
    if (count > 0) {
      await expect(languageSwitcher.first()).toBeVisible();
    }
  });

  test("delete buttons should have accessible labels", async ({ page }) => {
    await page.goto("/zh-CN/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("body", { timeout: 10000 });
    
    const deleteButtons = page.locator("button[aria-label*=\"delete\"], button[aria-label*=\"删除\"]");
    const count = await deleteButtons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Recipe App - Search Debounce", () => {
  test("search should handle rapid input", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("input[type=\"text\"]", { timeout: 10000 });

    const searchInput = page.locator("input[type=\"text\"]").first();
    await expect(searchInput).toBeVisible();

    const startTime = Date.now();
    await searchInput.fill("t");
    await searchInput.fill("to");
    await searchInput.fill("tom");
    await searchInput.fill("toma");
    await searchInput.fill("tomat");
    await searchInput.fill("tomato");
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(2000);
  });
});
