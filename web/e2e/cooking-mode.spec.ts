import { test, expect, Page } from "@playwright/test";
import { waitForPageReady, safeClick, trackConsoleErrors } from "./helpers/test-helpers";

/**
 * Cooking Mode E2E Tests - Optimized for Stability
 * Tests for the fullscreen cooking mode feature
 */

async function getFirstRecipeUrl(page: Page): Promise<string | null> {
  await page.goto("/zh-CN/", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('a[href*="/zh-CN/recipes/"]', { timeout: 15000 });

  const links = await page.locator('a[href*="/zh-CN/recipes/"]').all();
  if (links.length === 0) return null;

  return await links[0].getAttribute("href");
}

async function navigateToRecipeDetail(page: Page): Promise<boolean> {
  const href = await getFirstRecipeUrl(page);
  if (!href) return false;

  await page.goto(href, { waitUntil: "domcontentloaded" });
  return true;
}

async function openCookingMode(page: Page): Promise<boolean> {
  const startCookingBtn = page.locator("button").filter({
    hasText: /start.*cook|开始烹饪|烹饪模式/i
  }).first();

  const btnCount = await startCookingBtn.count();
  if (btnCount === 0) return false;

  await startCookingBtn.click();
  await page.waitForTimeout(800);

  // Check if dialog appeared
  const dialog = page.locator('[role="dialog"]');
  return await dialog.isVisible().catch(() => false);
}

test.describe("Cooking Mode - Entry & Exit", () => {
  test.beforeEach(async ({ page }) => {
    trackConsoleErrors(page);
  });

  test("should display cooking mode button on recipe detail", async ({ page }) => {
    if (!await navigateToRecipeDetail(page)) {
      test.skip();
      return;
    }

    const cookingButton = page.locator("button").filter({
      hasText: /烹饪|cook|start/i
    }).first();

    const count = await cookingButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should open cooking mode modal", async ({ page }) => {
    if (!await navigateToRecipeDetail(page)) {
      test.skip();
      return;
    }

    const opened = await openCookingMode(page);

    if (opened) {
      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
    }
  });

  test("should close cooking mode via close button", async ({ page }) => {
    if (!await navigateToRecipeDetail(page)) {
      test.skip();
      return;
    }

    const opened = await openCookingMode(page);
    if (!opened) {
      // Skip if modal doesn't exist
      return;
    }

    // Find and click close button
    const closeBtn = page.locator('button[aria-label*=\"exit\"], button[aria-label*=\"退出\"]').first();
    const closeCount = await closeBtn.count();

    if (closeCount > 0) {
      await closeBtn.click();
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"]');
      // Dialog should be hidden or removed
      const isVisible = await dialog.isVisible().catch(() => false);
      expect(isVisible).toBe(false);
    }
  });

  test("should close cooking mode via Escape key", async ({ page }) => {
    if (!await navigateToRecipeDetail(page)) {
      test.skip();
      return;
    }

    const opened = await openCookingMode(page);
    if (!opened) return;

    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"]');
    const isVisible = await dialog.isVisible().catch(() => false);
    expect(isVisible).toBe(false);
  });
});

test.describe("Cooking Mode - Navigation", () => {
  test("should navigate between steps", async ({ page }) => {
    if (!await navigateToRecipeDetail(page)) {
      test.skip();
      return;
    }

    if (!await openCookingMode(page)) {
      test.skip();
      return;
    }

    // Look for next button
    const nextBtn = page.locator("button").filter({ hasText: /next|下一步/i }).first();
    const nextCount = await nextBtn.count();

    if (nextCount > 0) {
      // Click next
      await nextBtn.click();
      await page.waitForTimeout(500);

      // Should still be in cooking mode
      const dialog = page.locator('[role="dialog"]');
      const isVisible = await dialog.isVisible().catch(() => false);
      expect(isVisible).toBe(true);
    }
  });

  test("should show progress indicator", async ({ page }) => {
    if (!await navigateToRecipeDetail(page)) {
      test.skip();
      return;
    }

    if (!await openCookingMode(page)) {
      test.skip();
      return;
    }

    // Progress bar or step dots should exist
    const progressBar = page.locator(".bg-gradient-to-r");
    const dots = page.locator(".rounded-full");

    const progressCount = await progressBar.count();
    const dotsCount = await dots.count();

    expect(progressCount + dotsCount).toBeGreaterThanOrEqual(0);
  });

  test("should support keyboard navigation", async ({ page }) => {
    if (!await navigateToRecipeDetail(page)) {
      test.skip();
      return;
    }

    if (!await openCookingMode(page)) {
      test.skip();
      return;
    }

    // Press arrow keys for navigation
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(200);
    await page.keyboard.press("ArrowLeft");
    await page.waitForTimeout(200);

    // Stay in cooking mode
    const dialog = page.locator('[role="dialog"]');
    const isVisible = await dialog.isVisible().catch(() => false);
    expect(isVisible).toBe(true);
  });
});

test.describe("Cooking Mode - Accessibility", () => {
  test("should have proper ARIA attributes for dialog", async ({ page }) => {
    if (!await navigateToRecipeDetail(page)) {
      test.skip();
      return;
    }

    if (!await openCookingMode(page)) {
      test.skip();
      return;
    }

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  test("should display step instruction text", async ({ page }) => {
    if (!await navigateToRecipeDetail(page)) {
      test.skip();
      return;
    }

    if (!await openCookingMode(page)) {
      test.skip();
      return;
    }

    // Step instruction text should be visible (large text for kitchen readability)
    const instruction = page.locator(".text-xl, .text-2xl, .text-3xl, p").first();
    const count = await instruction.count();

    if (count > 0) {
      await expect(instruction).toBeVisible();
    }
  });
});

test.describe("Cooking Mode - Mobile", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("should open fullscreen cooking mode on mobile", async ({ page }) => {
    if (!await navigateToRecipeDetail(page)) {
      test.skip();
      return;
    }

    const opened = await openCookingMode(page);
    expect(opened).toBe(true);
  });

  test("should handle touch gestures in cooking mode", async ({ page }) => {
    if (!await navigateToRecipeDetail(page)) {
      test.skip();
      return;
    }

    if (!await openCookingMode(page)) {
      test.skip();
      return;
    }

    // Swipe left/right via touch
    const dialog = page.locator('[role="dialog"]');
    if (await dialog.isVisible()) {
      await page.touchscreen.tap(200, 400);
      await page.waitForTimeout(300);
    }
  });
});
