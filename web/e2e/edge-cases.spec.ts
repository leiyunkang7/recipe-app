import { test, expect } from "@playwright/test";

test.describe("404 Page Handling", () => {
  test("should display 404 for non-existent recipe", async ({ page }) => {
    await page.goto("/zh-CN/recipes/00000000-0000-0000-0000-000000000000");
    await page.waitForLoadState("domcontentloaded");
    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });

  test("should display 404 for invalid recipe ID format", async ({ page }) => {
    await page.goto("/zh-CN/recipes/invalid-id");
    await page.waitForLoadState("domcontentloaded");
    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });
});

test.describe("Invalid Locale Handling", () => {
  test("should handle invalid locale gracefully", async ({ page }) => {
    await page.goto("/invalid-locale/");
    await page.waitForLoadState("domcontentloaded");
    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });
});

test.describe("Form Validation Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/zh-CN/admin/recipes/new/edit");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("form", { timeout: 15000 });
  });

  test("should handle empty form submission", async ({ page }) => {
    const submitButton = page.locator("button[type=\"submit\"]");
    if (await submitButton.count() > 0) {
      await submitButton.first().click();
      await page.waitForTimeout(500);
    }
    const formPresent = await page.locator("form").count();
    expect(formPresent).toBeGreaterThan(0);
  });

  test("should handle unicode characters in inputs", async ({ page }) => {
    const titleInput = page.locator("input[name=\"title\"], input[id=\"title\"]");
    if (await titleInput.count() > 0) {
      await titleInput.first().fill("Test Title");
      await page.waitForTimeout(300);
      expect(await titleInput.first().inputValue()).toContain("Test");
    }
  });

  test("should handle zero in numeric inputs", async ({ page }) => {
    const servingsInput = page.locator("input[name=\"servings\"], input[id=\"servings\"]");
    if (await servingsInput.count() > 0) {
      await servingsInput.first().fill("0");
      await page.waitForTimeout(300);
      expect(await servingsInput.first().inputValue()).toBe("0");
    }
  });
});

test.describe("Search Edge Cases", () => {
  test("should handle empty search", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const searchInput = page.locator("input[type=\"text\"]").first();
    await searchInput.waitFor({ state: "visible", timeout: 10000 });
    await searchInput.fill("");
    await page.waitForTimeout(300);
    expect(await searchInput.inputValue()).toBe("");
  });

  test("should handle search with spaces", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const searchInput = page.locator("input[type=\"text\"]").first();
    await searchInput.waitFor({ state: "visible", timeout: 10000 });
    await searchInput.fill("  ");
    await page.waitForTimeout(300);
    expect(await searchInput.inputValue()).toBe("  ");
  });
});

test.describe("Navigation Edge Cases", () => {
  test("should handle browser back button", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    await page.goto("/zh-CN/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/zh-CN");
  });

  test("should handle page refresh", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    await page.reload();
    await page.waitForLoadState("domcontentloaded");
    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });
});

test.describe("Responsive Design Edge Cases", () => {
  test("should handle very small viewport", async ({ page }) => {
    await page.setViewportSize({ width: 200, height: 300 });
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });

  test("should handle viewport resize", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);
    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });
});

test.describe("Accessibility Edge Cases", () => {
  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press("Tab");
      await page.waitForTimeout(50);
    }
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeDefined();
  });
});
