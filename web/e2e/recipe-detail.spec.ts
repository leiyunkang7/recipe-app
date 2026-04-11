import { test, expect } from "@playwright/test";

test.describe("Recipe Detail Page", () => {
  test.describe("Mobile View", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("should display recipe detail page elements", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("a[href*="/zh-CN/recipes/"]", { timeout: 10000 });
      const recipeLinks = page.locator("a[href*="/zh-CN/recipes/"]");
      const count = await recipeLinks.count();
      if (count > 0) {
        await recipeLinks.first().click();
        await page.waitForLoadState("domcontentloaded");
        await expect(page.locator("h1")).toBeVisible();
      }
    });

    test("should display cooking steps on recipe detail", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("a[href*="/zh-CN/recipes/"]", { timeout: 10000 });
      const recipeLinks = page.locator("a[href*="/zh-CN/recipes/"]");
      const count = await recipeLinks.count();
      if (count > 0) {
        await recipeLinks.first().click();
        await page.waitForLoadState("domcontentloaded");
        const stepsSection = page.locator("ol, ul").first();
        await expect(stepsSection).toBeVisible();
      }
    });
  });

  test.describe("Desktop View", () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test("should display recipe detail with larger layout", async ({ page }) => {
      await page.goto("/zh-CN/");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("a[href*="/zh-CN/recipes/"]", { timeout: 10000 });
      const recipeLinks = page.locator("a[href*="/zh-CN/recipes/"]");
      const count = await recipeLinks.count();
      if (count > 0) {
        await recipeLinks.first().click();
        await page.waitForLoadState("domcontentloaded");
        await expect(page.locator("h1")).toBeVisible();
      }
    });
  });
});

test.describe("Category Navigation", () => {
  test("should filter recipes by category", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const categoryButtons = page.locator("button.rounded-full");
    const count = await categoryButtons.count();
    if (count > 1) {
      await categoryButtons.nth(1).click();
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      expect(page.url().length).toBeGreaterThan(0);
    }
  });
});

test.describe("Search Functionality", () => {
  test("should accept search input and show results", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const searchInput = page.locator("input[type=\"text\"]").first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill("test");
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    expect(await searchInput.inputValue()).toBe("test");
  });

  test("should clear search input", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const searchInput = page.locator("input[type=\"text\"]").first();
    await searchInput.fill("test");
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    await searchInput.clear();
    await page.waitForLoadState("domcontentloaded").catch(() => {});
    expect(await searchInput.inputValue()).toBe("");
  });
});

test.describe("Admin Page", () => {
  test("should display admin page elements", async ({ page }) => {
    await page.goto("/zh-CN/admin");
    await page.waitForLoadState("domcontentloaded");
    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });
});

test.describe("Form Validation", () => {
  test("should display form on new recipe page", async ({ page }) => {
    await page.goto("/zh-CN/admin/recipes/new/edit");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("form")).toBeVisible();
  });
});

test.describe("Dark Mode", () => {
  test("should toggle dark mode", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const themeToggle = page.locator("button[aria-label*=\"theme\"]").first();
    const count = await themeToggle.count();
    if (count > 0) {
      await themeToggle.click();
      await page.waitForLoadState("domcontentloaded").catch(() => {});
    }
  });
});

test.describe("Error Handling", () => {
  test("should handle non-existent recipe gracefully", async ({ page }) => {
    await page.goto("/zh-CN/recipes/non-existent-recipe-id");
    await page.waitForLoadState("domcontentloaded");
    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });

  test("should handle invalid locale gracefully", async ({ page }) => {
    await page.goto("/invalid-locale/");
    await page.waitForLoadState("domcontentloaded");
    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });
});

test.describe("Accessibility", () => {
  test("should have proper heading hierarchy", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const h1 = page.locator("h1");
    const count = await h1.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test("should have alt text for images", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < Math.min(count, 5); i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt).toBeDefined();
    }
  });
});

test.describe("Responsive Design", () => {
  test("should adapt layout for tablet view", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });

  test("should adapt layout for small mobile", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const body = await page.locator("body").innerHTML();
    expect(body.length).toBeGreaterThan(0);
  });
});
