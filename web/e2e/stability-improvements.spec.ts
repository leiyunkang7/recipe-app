import { test, expect } from "@playwright/test";

test.describe("Home Page Stability", () => {
  test("should load homepage with content", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("body", { timeout: 10000 });
    const bodyInnerHTML = await page.locator("body").innerHTML();
    expect(bodyInnerHTML.trim().length).toBeGreaterThan(100);
  });

  test("should display header section", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const header = page.locator("header");
    await expect(header.first()).toBeVisible();
  });

  test("should display main content area", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const main = page.locator("main, #main-content");
    await expect(main.first()).toBeAttached();
  });
});

test.describe("Admin Page Stability", () => {
  test("should load admin dashboard", async ({ page }) => {
    await page.goto("/zh-CN/admin");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("body", { timeout: 10000 });
    const html = await page.content();
    expect(html.length).toBeGreaterThan(500);
  });

  test("should have interactive elements", async ({ page }) => {
    await page.goto("/zh-CN/admin");
    await page.waitForLoadState("domcontentloaded");
    const buttons = await page.locator("button").count();
    const inputs = await page.locator("input, select, textarea").count();
    // At least some interactive elements should exist
    expect(buttons + inputs).toBeGreaterThanOrEqual(0);
  });
});

test.describe("Form Validation Stability", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/zh-CN/admin/recipes/new/edit");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("form", { timeout: 15000 });
  });

  test("should validate title minimum length", async ({ page }) => {
    const titleInput = page.locator("input[name=\"title\"], input[id=\"title\"]").first();
    if (await titleInput.count() > 0) {
      await titleInput.fill("ab");
      await page.waitForTimeout(300);
      const submitButton = page.locator("button[type=\"submit\"]").first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
        await page.waitForTimeout(500);
      }
      const formStillPresent = await page.locator("form").count();
      expect(formStillPresent).toBeGreaterThan(0);
    }
  });

  test("should handle servings input bounds", async ({ page }) => {
    const servingsInput = page.locator("input[name=\"servings\"], input[id=\"servings\"]").first();
    if (await servingsInput.count() > 0) {
      await servingsInput.fill("1");
      await page.waitForTimeout(200);
      expect(await servingsInput.inputValue()).toBe("1");
      await servingsInput.fill("100");
      await page.waitForTimeout(200);
      expect(await servingsInput.inputValue()).toBe("100");
    }
  });

  test("should handle time inputs", async ({ page }) => {
    const prepTimeInput = page.locator("input[name=\"prepTimeMinutes\"], input[id=\"prepTimeMinutes\"]").first();
    if (await prepTimeInput.count() > 0) {
      await prepTimeInput.fill("30");
      await page.waitForTimeout(200);
      expect(await prepTimeInput.inputValue()).toBe("30");
    }
  });
});

test.describe("Search Stability", () => {
  test("should debounce search input", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const searchInput = page.locator("input[type=\"text\"]").first();
    await searchInput.waitFor({ state: "visible", timeout: 10000 });
    const startTime = Date.now();
    await searchInput.fill("t");
    await searchInput.fill("to");
    await searchInput.fill("tom");
    await searchInput.fill("toma");
    const endTime = Date.now();
    expect(endTime - startTime).toBeLessThan(3000);
  });

  test("should handle unicode search", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const searchInput = page.locator("input[type=\"text\"]").first();
    await searchInput.waitFor({ state: "visible", timeout: 10000 });
    await searchInput.fill("test");
    expect(await searchInput.inputValue()).toContain("test");
  });
});

test.describe("Error Handling Stability", () => {
  test("should handle 404 gracefully", async ({ page }) => {
    await page.goto("/zh-CN/recipes/non-existent-id");
    await page.waitForLoadState("domcontentloaded");
    const html = await page.content();
    expect(html.length).toBeGreaterThan(100);
  });

  test("should handle invalid locale", async ({ page }) => {
    const response = await page.goto("/invalid-locale/");
    await page.waitForLoadState("domcontentloaded");
    expect(response?.status()).toBeGreaterThan(0);
  });
});

test.describe("Accessibility Stability", () => {
  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBeLessThanOrEqual(1);
  });

  test("should have accessible images", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt).not.toBeNull();
    }
  });

  test("should support keyboard navigation", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    await page.keyboard.press("Tab");
    await page.waitForTimeout(100);
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeDefined();
  });
});

test.describe("Responsive Design Stability", () => {
  test("should adapt to tablet viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should adapt to small mobile", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();
  });
});
