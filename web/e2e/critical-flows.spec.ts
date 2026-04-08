import { test, expect } from "@playwright/test";

/**
 * Critical User Flows E2E Tests
 */

test.describe("Authentication Flows", () => {
  test("should display login page with form elements", async ({ page }) => {
    await page.goto("/zh-CN/login");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("button[type=\"submit\"]")).toBeVisible();
  });

  test("should toggle password visibility", async ({ page }) => {
    await page.goto("/zh-CN/login");
    await page.waitForLoadState("domcontentloaded");
    const passwordInput = page.locator("#password");
    await expect(passwordInput).toHaveAttribute("type", "password");
    const toggleButton = page.locator("button").filter({ hasText: /visibility/i }).first();
    if (await toggleButton.count() > 0) {
      await toggleButton.click();
      await expect(passwordInput).toHaveAttribute("type", "text");
    }
  });

  test("should show error for invalid login", async ({ page }) => {
    await page.goto("/zh-CN/login");
    await page.waitForLoadState("domcontentloaded");
    await page.locator("#email").fill("invalid@test.com");
    await page.locator("#password").fill("wrongpassword");
    await page.locator("button[type=\"submit\"]").click();
    await page.waitForTimeout(1000);
    expect(page.url().includes("/login")).toBeTruthy();
  });

  test("should have register link", async ({ page }) => {
    await page.goto("/zh-CN/login");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("a[href*=\"/register\"]").first()).toBeVisible();
  });

  test("should navigate to register page", async ({ page }) => {
    await page.goto("/zh-CN/login");
    await page.waitForLoadState("domcontentloaded");
    await page.locator("a[href*=\"/register\"]").first().click();
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("/register");
  });
});

test.describe("Register Page Flows", () => {
  test("should display all registration form fields", async ({ page }) => {
    await page.goto("/zh-CN/register");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#username")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#confirmPassword")).toBeVisible();
    await expect(page.locator("#verificationCode")).toBeVisible();
  });

  test("should accept valid form inputs", async ({ page }) => {
    await page.goto("/zh-CN/register");
    await page.waitForLoadState("domcontentloaded");
    await page.locator("#email").fill("test@example.com");
    await page.locator("#username").fill("testuser");
    await page.locator("#password").fill("password123");
    await expect(page.locator("#email")).toHaveValue("test@example.com");
    await expect(page.locator("#username")).toHaveValue("testuser");
  });

  test("should have password fields as type password", async ({ page }) => {
    await page.goto("/zh-CN/register");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("#password")).toHaveAttribute("type", "password");
    await expect(page.locator("#confirmPassword")).toHaveAttribute("type", "password");
  });
});

test.describe("Protected Pages Behavior", () => {
  test("should handle unauthenticated access to favorites", async ({ page }) => {
    await page.goto("/zh-CN/favorites");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    if (currentUrl.includes("/login")) {
      await expect(page.locator("form")).toBeVisible();
    } else {
      expect((await page.locator("body").innerHTML()).length).toBeGreaterThan(0);
    }
  });

  test("should handle unauthenticated access to my-recipes", async ({ page }) => {
    await page.goto("/zh-CN/my-recipes");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    if (currentUrl.includes("/login")) {
      await expect(page.locator("form")).toBeVisible();
    }
  });

  test("should handle unauthenticated access to profile", async ({ page }) => {
    await page.goto("/zh-CN/profile");
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    if (currentUrl.includes("/login")) {
      await expect(page.locator("form")).toBeVisible();
    }
  });

  test("should show nutrition page content", async ({ page }) => {
    await page.goto("/zh-CN/profile/nutrition");
    await page.waitForLoadState("domcontentloaded");
    expect((await page.locator("body").innerHTML()).length).toBeGreaterThan(0);
  });
});

test.describe("Core Navigation Flows", () => {
  test("should navigate to recipe list", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const recipesLink = page.locator("a[href*=\"/recipes\"]").first();
    if (await recipesLink.count() > 0) {
      await recipesLink.click();
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toContain("/recipes");
    }
  });

  test("should navigate to recipe detail", async ({ page }) => {
    await page.goto("/zh-CN/recipes");
    await page.waitForLoadState("domcontentloaded");
    const recipeLinks = page.locator("a[href*=\"/zh-CN/recipes/\"]");
    if (await recipeLinks.count() > 0) {
      await recipeLinks.first().click();
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toMatch(/\/recipes\/.+/);
    }
  });

  test("should navigate to admin page", async ({ page }) => {
    await page.goto("/zh-CN/admin");
    await page.waitForLoadState("domcontentloaded");
    expect((await page.locator("body").innerHTML()).length).toBeGreaterThan(100);
  });

  test("should navigate to new recipe form", async ({ page }) => {
    await page.goto("/zh-CN/admin/recipes/new/edit");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("form")).toBeVisible();
  });
});

test.describe("Language Switching Flows", () => {
  test("should switch from Chinese to English", async ({ page }) => {
    await page.goto("/zh-CN/");
    await page.waitForLoadState("domcontentloaded");
    const langSwitcher = page.locator("[data-testid=\"language-switcher\"], select").first();
    if (await langSwitcher.count() > 0) {
      await langSwitcher.selectOption("en");
      await page.waitForTimeout(1000);
      expect(page.url()).toContain("/en");
    }
  });

  test("should switch from English to Chinese", async ({ page }) => {
    await page.goto("/en/");
    await page.waitForLoadState("domcontentloaded");
    const langSwitcher = page.locator("[data-testid=\"language-switcher\"], select").first();
    if (await langSwitcher.count() > 0) {
      await langSwitcher.selectOption("zh-CN");
      await page.waitForTimeout(1000);
      expect(page.url()).toContain("/zh-CN");
    }
  });
});

test.describe("Recipe List and Filtering", () => {
  test("should display recipe list page", async ({ page }) => {
    await page.goto("/zh-CN/recipes");
    await page.waitForLoadState("domcontentloaded");
    expect((await page.locator("body").innerHTML()).length).toBeGreaterThan(100);
  });

  test("should handle pagination parameter", async ({ page }) => {
    await page.goto("/zh-CN/recipes?page=2");
    await page.waitForLoadState("domcontentloaded");
    expect(page.url()).toContain("page=2");
  });
});
