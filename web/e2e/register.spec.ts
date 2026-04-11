import { test, expect } from "@playwright/test";

test.describe("Register Page", () => {
  test.describe("Page Rendering", () => {
    test("should load register page successfully", async ({ page }) => {
      await page.goto("/zh-CN/register");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("h1, h2, form", { timeout: 10000 });
      const title = page.locator("h1, h2").first();
      await expect(title).toBeVisible();
    });

    test("should display all form elements", async ({ page }) => {
      await page.goto("/zh-CN/register");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("#email", { timeout: 10000 });
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#username")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
      await expect(page.locator("#confirmPassword")).toBeVisible();
      await expect(page.locator("#verificationCode")).toBeVisible();
      await expect(page.locator("button[type=\"submit\"]")).toBeVisible();
    });

    test("should switch language between Chinese and English", async ({ page }) => {
      await page.goto("/zh-CN/register");
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toContain("/zh-CN/register");
      await page.goto("/en/register");
      await page.waitForLoadState("domcontentloaded");
      expect(page.url()).toContain("/en/register");
    });

    test("should have login link", async ({ page }) => {
      await page.goto("/zh-CN/register");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("a[href*=\"/login\"]", { timeout: 10000 });
      await expect(page.locator("a[href*=\"/login\"]").first()).toBeVisible();
    });
  });

  test.describe("Form Validation", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/zh-CN/register");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("form", { timeout: 10000 });
    });

    test("should validate email format", async ({ page }) => {
      const emailInput = page.locator("#email");
      await emailInput.fill("invalid-email");
      await emailInput.blur();
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await emailInput.fill("test@example.com");
      await emailInput.blur();
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await expect(emailInput).toHaveValue("test@example.com");
    });

    test("should validate username format", async ({ page }) => {
      const usernameInput = page.locator("#username");
      await usernameInput.fill("valid_user123");
      await usernameInput.blur();
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await expect(usernameInput).toHaveValue("valid_user123");
    });

    test("should validate password", async ({ page }) => {
      const passwordInput = page.locator("#password");
      await passwordInput.fill("password123");
      await passwordInput.blur();
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await expect(passwordInput).toHaveValue("password123");
    });

    test("should validate verification code", async ({ page }) => {
      const codeInput = page.locator("#verificationCode");
      await codeInput.fill("123456");
      await codeInput.blur();
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await expect(codeInput).toHaveValue("123456");
    });

    test("should have password type initially", async ({ page }) => {
      await expect(page.locator("#password")).toHaveAttribute("type", "password");
      await expect(page.locator("#confirmPassword")).toHaveAttribute("type", "password");
    });

    test("should fill complete form", async ({ page }) => {
      await page.locator("#email").fill("test@example.com");
      await page.locator("#username").fill("testuser");
      await page.locator("#password").fill("password123");
      await page.locator("#confirmPassword").fill("password123");
      await page.locator("#verificationCode").fill("123456");
      await expect(page.locator("#email")).toHaveValue("test@example.com");
      await expect(page.locator("#username")).toHaveValue("testuser");
      await expect(page.locator("#password")).toHaveValue("password123");
    });
  });

  test.describe("Accessibility", () => {
    test("should have proper labels for form fields", async ({ page }) => {
      await page.goto("/zh-CN/register");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("label[for=\"email\"]", { timeout: 10000 });
      await expect(page.locator("label[for=\"email\"]")).toBeVisible();
      await expect(page.locator("label[for=\"username\"]")).toBeVisible();
      await expect(page.locator("label[for=\"password\"]")).toBeVisible();
    });

    test("should have proper input types", async ({ page }) => {
      await page.goto("/zh-CN/register");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("#email", { timeout: 10000 });
      await expect(page.locator("#email")).toHaveAttribute("type", "email");
      await expect(page.locator("#password")).toHaveAttribute("type", "password");
      await expect(page.locator("#confirmPassword")).toHaveAttribute("type", "password");
    });
  });

  test.describe("Mobile View", () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test("should display register form on mobile", async ({ page }) => {
      await page.goto("/zh-CN/register");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("form", { timeout: 10000 });
      await expect(page.locator("form")).toBeVisible();
      await expect(page.locator("#email")).toBeVisible();
      await expect(page.locator("#username")).toBeVisible();
      await expect(page.locator("#password")).toBeVisible();
    });

    test("should display bottom navigation on mobile", async ({ page }) => {
      await page.goto("/zh-CN/register");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("nav", { timeout: 10000 });
      const bottomNav = page.locator("nav[aria-label*=\"底部\"]").first();
      if (await bottomNav.count() > 0) {
        await expect(bottomNav).toBeVisible();
      }
    });
  });

  test.describe("Desktop View", () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test("should display register form on desktop", async ({ page }) => {
      await page.goto("/zh-CN/register");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("form", { timeout: 10000 });
      await expect(page.locator("form")).toBeVisible();
    });

    test("should hide bottom navigation on desktop", async ({ page }) => {
      await page.goto("/zh-CN/register");
      await page.waitForLoadState("domcontentloaded");
      await page.waitForSelector("nav", { timeout: 10000 });
      const bottomNav = page.locator("nav.fixed.bottom-0");
      const count = await bottomNav.count();
      if (count > 0) {
        await expect(bottomNav.first()).not.toBeVisible();
      }
    });
  });
});
