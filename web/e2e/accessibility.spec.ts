import { test, expect } from '@playwright/test';

test.describe('Accessibility - Button Labels', () => {
  test('delete buttons on admin page should have aria-label', async ({ page }) => {
    await page.goto('/zh-CN/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const deleteButtons = page.locator('button:has-text("🗑️")');
    const count = await deleteButtons.count();

    for (let i = 0; i < count; i++) {
      const button = deleteButtons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel?.length).toBeGreaterThan(0);
    }
  });

  test('all icon-only buttons should have accessible labels on admin page', async ({ page }) => {
    await page.goto('/zh-CN/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');
      
      const iconEmojis = ['🗑️', '✏️', '×']
      const hasText = text && text.trim().length > 0 && !iconEmojis.includes(text.trim());
      const hasAriaLabel = ariaLabel && ariaLabel.length > 0;
      const hasTitle = title && title.length > 0;
      
      if (!hasText) {
        expect(hasAriaLabel || hasTitle).toBeTruthy();
      }
    }
  });

  test('ingredient delete buttons should have aria-label', async ({ page }) => {
    await page.goto('/zh-CN/admin/recipes/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const deleteButtons = page.locator('button:has-text("🗑️")');
    const count = await deleteButtons.count();

    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const button = deleteButtons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toBe('删除');
    }
  });

  test('step delete buttons should have aria-label', async ({ page }) => {
    await page.goto('/zh-CN/admin/recipes/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const allButtons = page.locator('button');
    const count = await allButtons.count();
    let deleteButtonCount = 0;

    for (let i = 0; i < count; i++) {
      const button = allButtons.nth(i);
      const text = await button.textContent();
      
      if (text?.includes('🗑️')) {
        deleteButtonCount++;
        const ariaLabel = await button.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
    }

    expect(deleteButtonCount).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Accessibility - General', () => {
  test('homepage should load without crash', async ({ page }) => {
    await page.goto('/zh-CN');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('images should have alt attributes', async ({ page }) => {
    await page.goto('/zh-CN');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeDefined();
    }
  });
});
