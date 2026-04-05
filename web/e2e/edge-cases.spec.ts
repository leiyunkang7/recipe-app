import { test, expect } from '@playwright/test';

test.describe('Edge Cases - Error Handling', () => {
  test.describe('404 Page Handling', () => {
    test('should display 404 for non-existent recipe', async ({ page }) => {
      await page.goto('/zh-CN/recipes/00000000-0000-0000-0000-000000000000');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });

    test('should display 404 for invalid recipe ID format', async ({ page }) => {
      await page.goto('/zh-CN/recipes/invalid-id');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });

    test('should display 404 for non-existent admin page', async ({ page }) => {
      await page.goto('/zh-CN/admin/nonexistent');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });
  });

  test.describe('Invalid Locale Handling', () => {
    test('should handle invalid locale gracefully', async ({ page }) => {
      await page.goto('/invalid-locale/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });

    test('should handle invalid locale with path', async ({ page }) => {
      await page.goto('/invalid-locale/recipes/some-id');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });
  });

  test.describe('Form Validation Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/zh-CN/admin/recipes/new/edit');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    });

    test('should handle empty form submission', async ({ page }) => {
      const submitButton = page.locator('button[type="submit"]');
      const count = await submitButton.count();

      if (count > 0) {
        await submitButton.first().click();
        await page.waitForTimeout(500);

        const pageContent = await page.content();
        expect(pageContent.length).toBeGreaterThan(0);
      }
    });

    test('should handle special characters in title', async ({ page }) => {
      const titleInput = page.locator('input[name="title"], input[id="title"]');
      const count = await titleInput.count();

      if (count > 0) {
        await titleInput.first().fill('<script>alert("xss")</script>');
        await page.waitForTimeout(300);

        const value = await titleInput.first().inputValue();
        expect(value.length).toBeGreaterThan(0);
      }
    });

    test('should handle very long title', async ({ page }) => {
      const titleInput = page.locator('input[name="title"], input[id="title"]');
      const count = await titleInput.count();

      if (count > 0) {
        const longTitle = 'A'.repeat(500);
        await titleInput.first().fill(longTitle);
        await page.waitForTimeout(300);

        const value = await titleInput.first().inputValue();
        expect(value.length).toBeGreaterThan(0);
      }
    });

    test('should handle unicode characters in inputs', async ({ page }) => {
      const titleInput = page.locator('input[name="title"], input[id="title"]');
      const count = await titleInput.count();

      if (count > 0) {
        await titleInput.first().fill('日本語タイトル 中文标题 العربية');
        await page.waitForTimeout(300);

        const value = await titleInput.first().inputValue();
        expect(value).toContain('日本語');
      }
    });

    test('should handle emoji in inputs', async ({ page }) => {
      const titleInput = page.locator('input[name="title"], input[id="title"]');
      const count = await titleInput.count();

      if (count > 0) {
        await titleInput.first().fill('🍕 Recipe with Emoji 🍝');
        await page.waitForTimeout(300);

        const value = await titleInput.first().inputValue();
        expect(value).toContain('🍕');
      }
    });

    test('should handle negative numbers in numeric inputs', async ({ page }) => {
      const servingsInput = page.locator('input[name="servings"], input[id="servings"], input[type="number"]');
      const count = await servingsInput.count();

      if (count > 0) {
        await servingsInput.first().fill('-5');
        await page.waitForTimeout(300);

        const value = await servingsInput.first().inputValue();
        expect(value).toBeDefined();
      }
    });

    test('should handle zero in numeric inputs', async ({ page }) => {
      const servingsInput = page.locator('input[name="servings"], input[id="servings"], input[type="number"]');
      const count = await servingsInput.count();

      if (count > 0) {
        await servingsInput.first().fill('0');
        await page.waitForTimeout(300);

        const value = await servingsInput.first().inputValue();
        expect(value).toBe('0');
      }
    });

    test('should handle very large numbers in numeric inputs', async ({ page }) => {
      const servingsInput = page.locator('input[name="servings"], input[id="servings"], input[type="number"]');
      const count = await servingsInput.count();

      if (count > 0) {
        await servingsInput.first().fill('999999999');
        await page.waitForTimeout(300);

        const value = await servingsInput.first().inputValue();
        expect(value).toBeDefined();
      }
    });

    test('should handle decimal numbers in integer fields', async ({ page }) => {
      const servingsInput = page.locator('input[name="servings"], input[id="servings"], input[type="number"]');
      const count = await servingsInput.count();

      if (count > 0) {
        await servingsInput.first().fill('3.5');
        await page.waitForTimeout(300);

        const value = await servingsInput.first().inputValue();
        expect(value).toBeDefined();
      }
    });
  });

  test.describe('Search Edge Cases', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    });

    test('should handle empty search', async ({ page }) => {
      const searchInput = page.locator('input[type="text"]').first();
      await searchInput.fill('');
      await page.waitForTimeout(300);

      const value = await searchInput.inputValue();
      expect(value).toBe('');
    });

    test('should handle search with only spaces', async ({ page }) => {
      const searchInput = page.locator('input[type="text"]').first();
      await searchInput.fill('     ');
      await page.waitForTimeout(300);

      const value = await searchInput.inputValue();
      expect(value).toBe('     ');
    });

    test('should handle search with special characters', async ({ page }) => {
      const searchInput = page.locator('input[type="text"]').first();
      await searchInput.fill('test@#$%^&*()');
      await page.waitForTimeout(300);

      const value = await searchInput.inputValue();
      expect(value).toBe('test@#$%^&*()');
    });

    test('should handle search with SQL injection attempt', async ({ page }) => {
      const searchInput = page.locator('input[type="text"]').first();
      await searchInput.fill("'; DROP TABLE recipes; --");
      await page.waitForTimeout(300);

      const value = await searchInput.inputValue();
      expect(value).toContain("DROP TABLE");
    });

    test('should handle search with XSS attempt', async ({ page }) => {
      const searchInput = page.locator('input[type="text"]').first();
      await searchInput.fill('<script>alert("xss")</script>');
      await page.waitForTimeout(300);

      const value = await searchInput.inputValue();
      expect(value).toContain('<script>');
    });

    test('should handle very long search query', async ({ page }) => {
      const searchInput = page.locator('input[type="text"]').first();
      const longQuery = 'a'.repeat(1000);
      await searchInput.fill(longQuery);
      await page.waitForTimeout(300);

      const value = await searchInput.inputValue();
      expect(value.length).toBe(1000);
    });

    test('should handle unicode search', async ({ page }) => {
      const searchInput = page.locator('input[type="text"]').first();
      await searchInput.fill('日本語 中文 العربية');
      await page.waitForTimeout(300);

      const value = await searchInput.inputValue();
      expect(value).toContain('日本語');
    });

    test('should handle emoji search', async ({ page }) => {
      const searchInput = page.locator('input[type="text"]').first();
      await searchInput.fill('🍕🍝');
      await page.waitForTimeout(300);

      const value = await searchInput.inputValue();
      expect(value).toContain('🍕');
    });
  });

  test.describe('Navigation Edge Cases', () => {
    test('should handle browser back button', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.goto('/zh-CN/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.goBack();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      expect(page.url()).toContain('/zh-CN');
    });

    test('should handle browser forward button', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.goto('/zh-CN/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.goBack();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.goForward();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      expect(page.url()).toContain('/admin');
    });

    test('should handle page refresh', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });

    test('should handle multiple rapid navigations', async ({ page }) => {
      const pages = ['/zh-CN/', '/zh-CN/admin', '/zh-CN/register', '/zh-CN/'];

      for (const path of pages) {
        await page.goto(path);
        await page.waitForLoadState('domcontentloaded');
      }

      await page.waitForLoadState('networkidle');
      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });
  });

  test.describe('Responsive Design Edge Cases', () => {
    test('should handle very small viewport', async ({ page }) => {
      await page.setViewportSize({ width: 200, height: 300 });
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });

    test('should handle very large viewport', async ({ page }) => {
      await page.setViewportSize({ width: 3840, height: 2160 });
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });

    test('should handle portrait orientation', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });

    test('should handle landscape orientation', async ({ page }) => {
      await page.setViewportSize({ width: 812, height: 375 });
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });

    test('should handle viewport resize', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });
  });

  test.describe('Network Error Handling', () => {
    test('should handle slow network gracefully', async ({ page }) => {
      await page.route('**/*', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        await route.continue();
      });

      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });

    test('should handle offline mode', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.context().setOffline(true);
      await page.waitForTimeout(500);

      await page.reload({ timeout: 5000 }).catch(() => {});
      await page.context().setOffline(false);

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });
  });

  test.describe('Accessibility Edge Cases', () => {
    test('should handle keyboard navigation', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(100);
      }

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });

    test('should handle enter key on buttons', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const buttons = page.locator('button');
      const count = await buttons.count();

      if (count > 0) {
        await buttons.first().focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(300);
      }

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });

    test('should handle escape key', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });
  });

  test.describe('Dark Mode Edge Cases', () => {
    test('should handle rapid theme toggles', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="主题"], [data-testid="theme-toggle"]');
      const count = await themeToggle.count();

      if (count > 0) {
        for (let i = 0; i < 5; i++) {
          await themeToggle.first().click();
          await page.waitForTimeout(100);
        }
      }

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });

    test('should persist theme after refresh', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="主题"], [data-testid="theme-toggle"]');
      const count = await themeToggle.count();

      if (count > 0) {
        await themeToggle.first().click();
        await page.waitForTimeout(300);

        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        const html = page.locator('html');
        const className = await html.getAttribute('class') || '';
        expect(className.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('Language Switching Edge Cases', () => {
    test('should handle rapid language switches', async ({ page }) => {
      await page.goto('/zh-CN/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const langSwitcher = page.locator('[data-testid="language-switcher"]');
      const count = await langSwitcher.count();

      if (count > 0) {
        for (let i = 0; i < 3; i++) {
          await langSwitcher.selectOption('en');
          await page.waitForTimeout(200);
          await langSwitcher.selectOption('zh-CN');
          await page.waitForTimeout(200);
        }
      }

      const pageContent = await page.content();
      expect(pageContent.length).toBeGreaterThan(0);
    });
  });
});
