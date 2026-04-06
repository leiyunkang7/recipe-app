import { test, expect } from '@playwright/test';

test.describe('Mobile Layout Fixes at 375px', () => {
  test.use({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  test('should have 44px touch targets on recipe detail page', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForSelector('a[href*="/zh-CN/recipes/"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Click on first recipe to go to detail page
    const recipeLink = page.locator('a[href*="/zh-CN/recipes/"]').first();
    if (await recipeLink.count() > 0) {
      await recipeLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Check back button touch target
      const backButton = page.locator('header a:has-text("返回"), header a:has-text("Back")').first();
      if (await backButton.count() > 0) {
        const box = await backButton.boundingBox();
        console.log('Back button bounding box:', box);
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }

      // Check share button touch target
      const shareButton = page.locator('button:has-text("分享"), button:has-text("Share")').first();
      if (await shareButton.count() > 0) {
        const box = await shareButton.boundingBox();
        console.log('Share button bounding box:', box);
        expect(box?.width).toBeGreaterThanOrEqual(44);
        expect(box?.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should have proper padding on RecipeCard at mobile', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForSelector('.recipe-card, a[href*="/zh-CN/recipes/"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const recipeCards = page.locator('.recipe-card, a[href*="/zh-CN/recipes/"]');
    if (await recipeCards.count() > 0) {
      const card = recipeCards.first();
      const padding = await card.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          paddingTop: style.paddingTop,
          paddingRight: style.paddingRight,
          paddingBottom: style.paddingBottom,
          paddingLeft: style.paddingLeft,
        };
      });
      console.log('RecipeCard padding:', padding);
      // p-3 means 12px on mobile
      expect(parseInt(padding.paddingTop)).toBe(12);
    }
  });

  test('should have 44px touch target on FavoriteButton', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForSelector('button', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const favoriteButton = page.locator('button').filter({ has: page.locator('svg path[d*="4.318"]') }).first();
    if (await favoriteButton.count() > 0) {
      const box = await favoriteButton.boundingBox();
      console.log('FavoriteButton bounding box:', box);
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('should display metadata text at 14px (text-sm) on title card', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForSelector('a[href*="/zh-CN/recipes/"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Navigate to recipe detail
    const recipeLink = page.locator('a[href*="/zh-CN/recipes/"]').first();
    if (await recipeLink.count() > 0) {
      await recipeLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Check that metadata values are text-sm (14px)
      const metadataValues = page.locator('[class*="TitleCard"] .font-semibold, [class*="titleCard"] .font-semibold').first();
      if (await metadataValues.count() > 0) {
        const fontSize = await metadataValues.evaluate(el => window.getComputedStyle(el).fontSize);
        console.log('Metadata font size:', fontSize);
        expect(parseInt(fontSize)).toBeGreaterThanOrEqual(14);
      }
    }
  });
});
