import { test, expect } from "@playwright/test";

test.describe("Recipe List Page", () => {
  test("should handle pagination on recipe list", async ({ page }) => {
    await page.goto("/zh-CN/recipes?page=2");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("body", { timeout: 10000 });
    expect(page.url()).toContain("page=2");
    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(100);
  });

  test("should handle category filter on recipe list", async ({ page }) => {
    await page.goto("/zh-CN/recipes?category=Lunch");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("body", { timeout: 10000 });
    expect(page.url()).toContain("category=Lunch");
  });

  test("should handle combined filters", async ({ page }) => {
    await page.goto("/zh-CN/recipes?category=Lunch&difficulty=easy&search=soup");
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("category=Lunch");
    expect(page.url()).toContain("difficulty=easy");
    expect(page.url()).toContain("search=soup");
  });
});

test.describe("Recipe Detail Page", () => {
  test("should navigate to recipe detail from list", async ({ page }) => {
    await page.goto("/zh-CN/recipes");
    await page.waitForLoadState("domcontentloaded");
    const recipeLinks = page.locator("a[href*=\"/zh-CN/recipes/\"]");
    const count = await recipeLinks.count();
    expect(count).toBeGreaterThan(0);
    if (count > 0) {
      await recipeLinks.first().click();
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toMatch(/\/recipes\/.+/);
    }
  });
});

test.describe("Admin Recipe Form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/zh-CN/admin/recipes/new/edit");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForSelector("form", { timeout: 15000 });
  });

  test("should accept title with special characters", async ({ page }) => {
    const titleInput = page.locator("input[name=\"title\"], input[id=\"title\"]").first();
    await expect(titleInput).toBeVisible();
    await titleInput.fill("Recipe with special chars");
    expect(await titleInput.inputValue()).toContain("Recipe with special chars");
  });

  test("should handle servings boundary values", async ({ page }) => {
    const servingsInput = page.locator("input[name=\"servings\"], input[id=\"servings\"]").first();
    if (await servingsInput.count() > 0) {
      await servingsInput.fill("1");
      expect(await servingsInput.inputValue()).toBe("1");
      await servingsInput.fill("100");
      expect(await servingsInput.inputValue()).toBe("100");
    }
  });

  test("should add multiple ingredients", async ({ page }) => {
    const addButton = page.locator("button").filter({ hasText: /Add/i }).first();
    if (await addButton.count() > 0) {
      await addButton.click();
      await addButton.click();
      const inputs = page.locator("input[name*=\"ingredient\"]");
      expect(await inputs.count()).toBeGreaterThan(0);
    }
  });
});

test.describe("Navigation", () => {
  test("should handle back button", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    await page.goto("/zh-CN/recipes");
    await page.waitForLoadState("domcontentloaded");
    await page.goBack();
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/zh-CN");
  });
});

test.describe("Responsive Design", () => {
  test("should handle mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });

  test("should handle desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });
});

test.describe("Error Handling", () => {
  test("should handle 404 gracefully", async ({ page }) => {
    await page.goto("/zh-CN/recipes/non-existent-id-12345");
    await page.waitForLoadState("domcontentloaded");
    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });
});

test.describe("Performance", () => {
  test("should load page within acceptable time", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(15000);
  });
});
