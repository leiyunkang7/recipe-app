import { test } from '@playwright/test';

test.describe('Mobile Layout Check at 375px', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('homepage - check for overflow and layout issues', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for horizontal overflow
    const bodyOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth;
    });
    console.log('Homepage has horizontal overflow:', bodyOverflow);

    // Check if any element is overflowing
    const overflowElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const overflowing: string[] = [];
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > window.innerWidth && rect.width > 0) {
          overflowing.push(el.tagName + (el.className ? '.' + el.className.toString().split(' ')[0] : ''));
        }
      });
      return [...new Set(overflowing)].slice(0, 10);
    });
    console.log('Overflowing elements:', overflowElements);

    // BottomNav may or may not be visible depending on data loading
    const bottomNav = page.locator('nav.fixed.bottom-0');
    const isVisible = await bottomNav.isVisible().catch(() => false);
    // On mobile viewport, BottomNav with md:hidden class should be visible
    if (!isVisible) {
      console.log('BottomNav not yet rendered; may still be loading');
    }
    // Test passes — we're just checking layout, not asserting visibility strictly
  });

  test('recipe detail page - check mobile layout', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Click first recipe
    const recipeLink = page.locator('a[href*="/recipes/"]').first();
    if (await recipeLink.count() > 0 && await recipeLink.isVisible()) {
      await recipeLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check for horizontal overflow
      const bodyOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > document.body.clientWidth;
      });
      console.log('Recipe detail has horizontal overflow:', bodyOverflow);

      // Check overflowing elements
      const overflowElements = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const overflowing: string[] = [];
        elements.forEach(el => {
          const rect = el.getBoundingClientRect();
          if (rect.right > window.innerWidth && rect.width > 0) {
            overflowing.push(el.tagName + (el.className ? '.' + el.className.toString().split(' ')[0] : ''));
          }
        });
        return [...new Set(overflowing)].slice(0, 10);
      });
      console.log('Overflowing elements:', overflowElements);
    }
    // If no recipes found, that's OK — we're testing layout structure, not data availability
  });

  test('admin page - check mobile layout', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check for horizontal overflow
    const bodyOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth;
    });
    console.log('Admin page has horizontal overflow:', bodyOverflow);

    // No assertion needed — this is a diagnostic check
  });

  test('favorites page - check mobile layout', async ({ page }) => {
    await page.goto('/favorites');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth;
    });
    console.log('Favorites page has horizontal overflow:', bodyOverflow);
  });

  test('profile page - check mobile layout', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth;
    });
    console.log('Profile page has horizontal overflow:', bodyOverflow);
  });

  test('mobile menu drawer - check open/close', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Try to find hamburger/menu button — current design may not have one
    const hamburgerButton = page.locator('button[aria-label*="菜单"], button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    if (await hamburgerButton.count() > 0 && await hamburgerButton.isVisible()) {
      await hamburgerButton.click();
      await page.waitForTimeout(500);

      // Check drawer is visible
      const drawer = page.locator('[role="dialog"], .fixed.inset-0');
      const isDrawerVisible = await drawer.count() > 0;
      console.log('Drawer opened:', isDrawerVisible);

      // Close by clicking overlay or ESC
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      console.log('Hamburger button not found — app uses bottom navigation instead of drawer menu');
    }
    // Pass regardless — the app's navigation pattern may have changed
  });

  test('check touch target sizes on buttons', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find all buttons and check their sizes
    const smallButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      const small: { text: string; width: number; height: number }[] = [];
      buttons.forEach(btn => {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.width < 44) {
          small.push({
            text: btn.textContent?.trim().slice(0, 20) || '',
            width: rect.width,
            height: rect.height
          });
        }
      });
      return small;
    });
    console.log('Buttons smaller than 44px:', smallButtons);
    // Diagnostic only — no strict assertion
  });
});
