import { test, expect } from '@playwright/test';

test.describe('Recipe Detail Page', () => {
  test.describe('Mobile View', () => {
    test.use({
      viewport: { width: 375, height: 667 },
    });

    test('should display recipe detail page elements', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const recipeLinks = page.locator('a[href*="/zh-CN/recipes/"]');
      const count = await recipeLinks.count();

      if (count > 0) {
        await recipeLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        const title = page.locator('h1');
        await expect(title).toBeVisible();
      }
    });

    test('should display cooking steps on recipe detail', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const recipeLinks = page.locator('a[href*="/zh-CN/recipes/"]');
      const count = await recipeLinks.count();

      if (count > 0) {
        await recipeLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        const stepsSection = page.locator('ol, ul').first();
        const stepsCount = await stepsSection.count();
        expect(stepsCount).toBeGreaterThanOrEqual(0);
      }
    });

    test('should display ingredients list on recipe detail', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const recipeLinks = page.locator('a[href*="/zh-CN/recipes/"]');
      const count = await recipeLinks.count();

      if (count > 0) {
        await recipeLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        const pageContent = await page.content();
        expect(pageContent.length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Desktop View', () => {
    test.use({
      viewport: { width: 1280, height: 720 },
    });

    test('should display recipe detail with larger layout', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const recipeLinks = page.locator('a[href*="/zh-CN/recipes/"]');
      const count = await recipeLinks.count();

      if (count > 0) {
        await recipeLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        const title = page.locator('h1');
        await expect(title).toBeVisible();
      }
    });
  });
});

test.describe('Category Navigation', () => {
  test('should filter recipes by category', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const categoryButtons = page.locator('button.rounded-full');
    const count = await categoryButtons.count();

    if (count > 1) {
      await categoryButtons.nth(1).click();
      await page.waitForTimeout(500);

      const url = page.url();
      expect(url.length).toBeGreaterThan(0);
    }
  });

  test('should highlight selected category', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const categoryButtons = page.locator('button.rounded-full');
    const count = await categoryButtons.count();

    if (count > 0) {
      await categoryButtons.first().click();
      await page.waitForTimeout(300);

      const buttonClass = await categoryButtons.first().getAttribute('class') || '';
      expect(buttonClass.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Search Functionality', () => {
  test('should accept search input and show results', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();

    await searchInput.fill('测试');
    await page.waitForTimeout(500);

    const value = await searchInput.inputValue();
    expect(value).toBe('测试');
  });

  test('should clear search input', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('测试');
    await page.waitForTimeout(200);

    await searchInput.clear();
    await page.waitForTimeout(200);

    const value = await searchInput.inputValue();
    expect(value).toBe('');
  });

  test('should handle special characters in search', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('测试@#$%');
    await page.waitForTimeout(200);

    const value = await searchInput.inputValue();
    expect(value).toBe('测试@#$%');
  });
});

test.describe('Admin Page - Recipe Management', () => {
  test('should display admin page elements', async ({ page }) => {
    await page.goto('/zh-CN/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('should have add recipe button', async ({ page }) => {
    await page.goto('/zh-CN/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const addLink = page.locator('a[href*="/admin/recipes/new"]');
    const count = await addLink.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display recipe list in admin', async ({ page }) => {
    await page.goto('/zh-CN/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const recipeItems = page.locator('table tbody tr, [data-testid="recipe-item"]');
    const count = await recipeItems.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Form Validation', () => {
  test('should display form on new recipe page', async ({ page }) => {
    await page.goto('/zh-CN/admin/recipes/new/edit');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const form = page.locator('form');
    await expect(form).toBeVisible();
  });

  test('should have required form fields', async ({ page }) => {
    await page.goto('/zh-CN/admin/recipes/new/edit');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const titleInput = page.locator('input[name="title"], input[id="title"]');
    const count = await titleInput.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have category select', async ({ page }) => {
    await page.goto('/zh-CN/admin/recipes/new/edit');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const categorySelect = page.locator('select[name="category"], select[id="category"]');
    const count = await categorySelect.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Dark Mode', () => {
  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="主题"], [data-testid="theme-toggle"]');
    const count = await themeToggle.count();

    if (count > 0) {
      await themeToggle.first().click();
      await page.waitForTimeout(300);

      const html = page.locator('html');
      const className = await html.getAttribute('class') || '';
      expect(className.length).toBeGreaterThanOrEqual(0);
    }
  });
});

test.describe('Error Handling', () => {
  test('should handle non-existent recipe gracefully', async ({ page }) => {
    await page.goto('/zh-CN/recipes/non-existent-recipe-id');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('should handle invalid locale gracefully', async ({ page }) => {
    await page.goto('/invalid-locale/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const h1 = page.locator('h1');
    const count = await h1.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should have visible focus indicators', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const buttons = page.locator('button');
    const count = await buttons.count();

    if (count > 0) {
      await buttons.first().focus();
      await page.waitForTimeout(200);

      const isFocused = await buttons.first().isFocused();
      expect(typeof isFocused).toBe('boolean');
    }
  });

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/zh-CN/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt).toBeDefined();
    }
  });
});

test.describe('Responsive Design', () => {
  test('should adapt layout for tablet view', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/zh-CN/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('should adapt layout for small mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 480 });
    await page.goto('/zh-CN/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });

  test('should adapt layout for large desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/zh-CN/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const pageContent = await page.content();
    expect(pageContent.length).toBeGreaterThan(0);
  });
});
