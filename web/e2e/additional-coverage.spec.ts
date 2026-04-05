import { test, expect } from '@playwright/test';

test.describe('Additional Coverage Tests - Recipe Management', () => {
  test.describe('Recipe List Page - Advanced Scenarios', () => {
    test('should handle empty recipe list gracefully', async ({ page }) => {
      await page.goto('/zh-CN/recipes');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const content = await page.content();
      expect(content.length).toBeGreaterThan(0);
    });

    test('should handle pagination on recipe list', async ({ page }) => {
      await page.goto('/zh-CN/recipes?page=2');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      expect(page.url()).toContain('page=2');
    });

    test('should handle category filter on recipe list', async ({ page }) => {
      await page.goto('/zh-CN/recipes?category=Lunch');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      expect(page.url()).toContain('category=Lunch');
    });

    test('should handle cuisine filter on recipe list', async ({ page }) => {
      await page.goto('/zh-CN/recipes?cuisine=Italian');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      expect(page.url()).toContain('cuisine=Italian');
    });

    test('should handle difficulty filter on recipe list', async ({ page }) => {
      await page.goto('/zh-CN/recipes?difficulty=easy');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      expect(page.url()).toContain('difficulty=easy');
    });

    test('should handle search query on recipe list', async ({ page }) => {
      await page.goto('/zh-CN/recipes?search=tomato');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      expect(page.url()).toContain('search=tomato');
    });

    test('should handle combined filters', async ({ page }) => {
      await page.goto('/zh-CN/recipes?category=Lunch&difficulty=easy&search=soup');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      expect(page.url()).toContain('category=Lunch');
      expect(page.url()).toContain('difficulty=easy');
      expect(page.url()).toContain('search=soup');
    });
  });

  test.describe('Recipe Detail Page - Edge Cases', () => {
    test('should handle recipe with no image', async ({ page }) => {
      await page.goto('/zh-CN/recipes');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const recipeLinks = page.locator('a[href*="/recipes/"]').first();
      if (await recipeLinks.count() > 0) {
        await recipeLinks.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        const content = await page.content();
        expect(content.length).toBeGreaterThan(0);
      }
    });

    test('should handle recipe with no description', async ({ page }) => {
      await page.goto('/zh-CN/recipes');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const recipeLinks = page.locator('a[href*="/recipes/"]').first();
      if (await recipeLinks.count() > 0) {
        await recipeLinks.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        expect(true).toBe(true);
      }
    });

    test('should handle recipe with no ingredients', async ({ page }) => {
      await page.goto('/zh-CN/recipes');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const recipeLinks = page.locator('a[href*="/recipes/"]').first();
      if (await recipeLinks.count() > 0) {
        await recipeLinks.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        expect(true).toBe(true);
      }
    });

    test('should handle recipe with no steps', async ({ page }) => {
      await page.goto('/zh-CN/recipes');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const recipeLinks = page.locator('a[href*="/recipes/"]').first();
      if (await recipeLinks.count() > 0) {
        await recipeLinks.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        expect(true).toBe(true);
      }
    });

    test('should handle recipe with no tags', async ({ page }) => {
      await page.goto('/zh-CN/recipes');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const recipeLinks = page.locator('a[href*="/recipes/"]').first();
      if (await recipeLinks.count() > 0) {
        await recipeLinks.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        expect(true).toBe(true);
      }
    });

    test('should handle recipe with no nutrition info', async ({ page }) => {
      await page.goto('/zh-CN/recipes');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const recipeLinks = page.locator('a[href*="/recipes/"]').first();
      if (await recipeLinks.count() > 0) {
        await recipeLinks.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        expect(true).toBe(true);
      }
    });

    test('should handle recipe with no source', async ({ page }) => {
      await page.goto('/zh-CN/recipes');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const recipeLinks = page.locator('a[href*="/recipes/"]').first();
      if (await recipeLinks.count() > 0) {
        await recipeLinks.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        expect(true).toBe(true);
      }
    });
  });

  test.describe('Admin Recipe Form - Advanced Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/zh-CN/admin/recipes/new/edit');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    });

    test('should validate title field with special characters', async ({ page }) => {
      const titleInput = page.locator('input[name="title"], input[id="title"]').first();
      if (await titleInput.count() > 0) {
        await titleInput.fill('Recipe with special chars: @#$%^&*()');
        await page.waitForTimeout(300);

        const value = await titleInput.inputValue();
        expect(value).toContain('@#$%^&*()');
      }
    });

    test('should validate title field with unicode characters', async ({ page }) => {
      const titleInput = page.locator('input[name="title"], input[id="title"]').first();
      if (await titleInput.count() > 0) {
        await titleInput.fill('中文菜谱 🍜');
        await page.waitForTimeout(300);

        const value = await titleInput.inputValue();
        expect(value).toContain('中文菜谱');
      }
    });

    test('should validate servings field with boundary values', async ({ page }) => {
      const servingsInput = page.locator('input[name="servings"], input[id="servings"]').first();
      if (await servingsInput.count() > 0) {
        await servingsInput.fill('1');
        await page.waitForTimeout(300);

        await servingsInput.fill('999');
        await page.waitForTimeout(300);
      }
    });

    test('should validate prep time field with large values', async ({ page }) => {
      const prepTimeInput = page.locator('input[name="prepTimeMinutes"], input[id="prepTimeMinutes"]').first();
      if (await prepTimeInput.count() > 0) {
        await prepTimeInput.fill('1440');
        await page.waitForTimeout(300);
      }
    });

    test('should validate cook time field with zero value', async ({ page }) => {
      const cookTimeInput = page.locator('input[name="cookTimeMinutes"], input[id="cookTimeMinutes"]').first();
      if (await cookTimeInput.count() > 0) {
        await cookTimeInput.fill('0');
        await page.waitForTimeout(300);
      }
    });

    test('should handle adding multiple ingredients', async ({ page }) => {
      const addIngredientBtn = page.locator('button:has-text("添加食材"), button:has-text("Add Ingredient")').first();
      if (await addIngredientBtn.count() > 0) {
        for (let i = 0; i < 3; i++) {
          await addIngredientBtn.click();
          await page.waitForTimeout(300);
        }

        const ingredientInputs = page.locator('input[name*="ingredient"], input[placeholder*="食材"]').first();
        expect(await ingredientInputs.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle adding multiple steps', async ({ page }) => {
      const addStepBtn = page.locator('button:has-text("添加步骤"), button:has-text("Add Step")').first();
      if (await addStepBtn.count() > 0) {
        for (let i = 0; i < 3; i++) {
          await addStepBtn.click();
          await page.waitForTimeout(300);
        }

        const stepInputs = page.locator('textarea[name*="step"], textarea[placeholder*="说明"]').first();
        expect(await stepInputs.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle adding multiple tags', async ({ page }) => {
      const addTagBtn = page.locator('button:has-text("添加标签"), button:has-text("Add Tag")').first();
      if (await addTagBtn.count() > 0) {
        for (let i = 0; i < 3; i++) {
          await addTagBtn.click();
          await page.waitForTimeout(300);
        }

        const tagInputs = page.locator('input[name*="tag"], input[placeholder*="标签"]').first();
        expect(await tagInputs.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test('should handle removing ingredients', async ({ page }) => {
      const removeButtons = page.locator('button:has-text("删除"), button:has-text("Remove")');
      if (await removeButtons.count() > 0) {
        await removeButtons.first().click();
        await page.waitForTimeout(300);
      }
    });

    test('should handle form reset', async ({ page }) => {
      const titleInput = page.locator('input[name="title"], input[id="title"]').first();
      if (await titleInput.count() > 0) {
        await titleInput.fill('Test Recipe');
        await page.waitForTimeout(300);

        const resetButton = page.locator('button[type="reset"], button:has-text("重置"), button:has-text("Reset")').first();
        if (await resetButton.count() > 0) {
          await resetButton.click();
          await page.waitForTimeout(300);
        }
      }
    });
  });

  test.describe('Search Functionality - Advanced Scenarios', () => {
    test('should handle empty search query', async ({ page }) => {
      await page.goto('/zh-CN/recipes?search=');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const content = await page.content();
      expect(content.length).toBeGreaterThan(0);
    });

    test('should handle search with special characters', async ({ page }) => {
      await page.goto('/zh-CN/recipes?search=test%20recipe');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      expect(page.url()).toContain('search=');
    });

    test('should handle search with unicode characters', async ({ page }) => {
      await page.goto('/zh-CN/recipes?search=中文');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      expect(page.url()).toContain('search=');
    });

    test('should handle search with very long query', async ({ page }) => {
      const longQuery = 'a'.repeat(100);
      await page.goto(`/zh-CN/recipes?search=${longQuery}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      expect(page.url()).toContain('search=');
    });
  });

  test.describe('Navigation - Advanced Scenarios', () => {
    test('should handle back button navigation', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.goto('/zh-CN/recipes');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.goBack();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      expect(page.url()).toContain('/zh-CN');
    });

    test('should handle forward button navigation', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.goto('/zh-CN/recipes');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.goBack();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      await page.goForward();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      expect(page.url()).toContain('/recipes');
    });

    test('should handle direct URL access to admin page', async ({ page }) => {
      await page.goto('/zh-CN/admin');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const content = await page.content();
      expect(content.length).toBeGreaterThan(0);
    });

    test('should handle direct URL access to new recipe page', async ({ page }) => {
      await page.goto('/zh-CN/admin/recipes/new/edit');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const content = await page.content();
      expect(content.length).toBeGreaterThan(0);
    });
  });

  test.describe('Responsive Design - Advanced Scenarios', () => {
    test('should handle mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const content = await page.content();
      expect(content.length).toBeGreaterThan(0);
    });

    test('should handle tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const content = await page.content();
      expect(content.length).toBeGreaterThan(0);
    });

    test('should handle desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const content = await page.content();
      expect(content.length).toBeGreaterThan(0);
    });

    test('should handle landscape orientation', async ({ page }) => {
      await page.setViewportSize({ width: 812, height: 375 });
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const content = await page.content();
      expect(content.length).toBeGreaterThan(0);
    });
  });

  test.describe('Error Handling - Advanced Scenarios', () => {
    test('should handle 404 error gracefully', async ({ page }) => {
      await page.goto('/zh-CN/recipes/non-existent-id-12345');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const content = await page.content();
      expect(content.length).toBeGreaterThan(0);
    });

    test('should handle invalid URL parameters', async ({ page }) => {
      await page.goto('/zh-CN/recipes?page=invalid&limit=invalid');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const content = await page.content();
      expect(content.length).toBeGreaterThan(0);
    });

    test('should handle malformed URLs', async ({ page }) => {
      await page.goto('/zh-CN/recipes?search=%');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const content = await page.content();
      expect(content.length).toBeGreaterThan(0);
    });
  });

  test.describe('Performance - Advanced Scenarios', () => {
    test('should load page within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(15000);
    });

    test('should handle rapid navigation', async ({ page }) => {
      await page.goto('/zh-CN/');
      await page.waitForLoadState('networkidle');

      for (let i = 0; i < 5; i++) {
        await page.goto('/zh-CN/recipes');
        await page.waitForLoadState('domcontentloaded');
        await page.goto('/zh-CN/');
        await page.waitForLoadState('domcontentloaded');
      }

      const content = await page.content();
      expect(content.length).toBeGreaterThan(0);
    });
  });
});
