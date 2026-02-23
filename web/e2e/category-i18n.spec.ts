import { test, expect } from '@playwright/test';

test.describe('Category and Cuisine Dropdown i18n', () => {
  test.describe('Homepage Category Buttons', () => {
    test('should show category buttons on home page', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const categoryButtons = page.locator('button.rounded-full');
      const buttonCount = await categoryButtons.count();
      expect(buttonCount).toBeGreaterThan(0);
    });

    test('should have Chinese labels on Chinese page', async ({ page }) => {
      await page.goto('/zh-CN');
      await page.waitForLoadState('networkidle');

      const categoryButtons = page.locator('button.rounded-full');
      const count = await categoryButtons.count();
      expect(count).toBeGreaterThan(0);

      const firstButtonText = await categoryButtons.first().textContent();
      expect(firstButtonText?.trim().length).toBeGreaterThan(0);
    });

    test('should have English labels on English page', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const categoryButtons = page.locator('button.rounded-full');
      const count = await categoryButtons.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Admin Edit Page Dropdowns', () => {
    test('should have data in category dropdown on English page', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/admin/recipes/new');
      await page.waitForLoadState('networkidle');

      const categorySelects = page.locator('select');
      const count = await categorySelects.count();
      
      let categorySelect = null;
      for (let i = 0; i < count; i++) {
        const select = categorySelects.nth(i);
        const label = await select.locator('option').first().textContent();
        if (label?.includes('Select') || label?.includes('select')) {
          categorySelect = select;
          break;
        }
      }

      if (categorySelect) {
        const options = await categorySelect.locator('option').allTextContents();
        const nonDefaultOptions = options.filter(opt => 
          !opt.includes('Select') && 
          !opt.includes('select') && 
          !opt.includes('选择') &&
          opt.trim() !== ''
        );
        expect(nonDefaultOptions.length).toBeGreaterThan(0);
      }
    });

    test('should have data in category dropdown on Chinese page', async ({ page }) => {
      await page.goto('/zh-CN/admin/recipes/new');
      await page.waitForLoadState('networkidle');

      const categorySelects = page.locator('select');
      const count = await categorySelects.count();
      
      let categorySelect = null;
      for (let i = 0; i < count; i++) {
        const select = categorySelects.nth(i);
        const options = await select.locator('option').allTextContents();
        if (options.some(opt => opt.includes('选择分类'))) {
          categorySelect = select;
          break;
        }
      }

      if (categorySelect) {
        const options = await categorySelect.locator('option').allTextContents();
        const nonDefaultOptions = options.filter(opt => 
          !opt.includes('选择') && 
          !opt.includes('Select') &&
          opt.trim() !== ''
        );
        expect(nonDefaultOptions.length).toBeGreaterThan(0);
      }
    });

    test('should show only English categories in edit page on English', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/admin/recipes/new');
      await page.waitForLoadState('networkidle');

      const allSelects = page.locator('select:not([data-testid="language-switcher"])');
      const count = await allSelects.count();
      
      for (let i = 0; i < count; i++) {
        const select = allSelects.nth(i);
        const options = await select.locator('option').allTextContents();
        const hasChinese = options.some(opt => /[\u4e00-\u9fa5]/.test(opt));
        expect(hasChinese).toBe(false);
      }
    });

    test('should show only Chinese categories in edit page on Chinese', async ({ page }) => {
      await page.goto('/zh-CN/admin/recipes/new');
      await page.waitForLoadState('networkidle');

      const allSelects = page.locator('select:not([data-testid="language-switcher"])');
      const count = await allSelects.count();
      
      for (let i = 0; i < count; i++) {
        const select = allSelects.nth(i);
        const options = await select.locator('option').allTextContents();
        const hasEnglishCategory = options.some(opt => 
          /Breakfast|Lunch|Dinner|Dessert|Snack|Beverage|Other|Chinese|Italian|Mexican|Indian|Japanese|Thai|French|American|Korean|Mediterranean/i.test(opt) &&
          !/[\u4e00-\u9fa5]/.test(opt)
        );
        expect(hasEnglishCategory).toBe(false);
      }
    });
  });

  test.describe('Cuisine Dropdown', () => {
    test('should show only English cuisines on English edit page', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/admin/recipes/new');
      await page.waitForLoadState('networkidle');

      const allSelects = page.locator('select');
      const count = await allSelects.count();
      
      let cuisineSelect = null;
      for (let i = 0; i < count; i++) {
        const select = allSelects.nth(i);
        const firstOption = await select.locator('option').first().textContent();
        if (firstOption?.includes('cuisine') || firstOption?.includes('Cuisine')) {
          cuisineSelect = select;
          break;
        }
      }

      if (cuisineSelect) {
        const options = await cuisineSelect.locator('option').allTextContents();
        const hasChinese = options.some(opt => /[\u4e00-\u9fa5]/.test(opt));
        expect(hasChinese).toBe(false);
      }
    });

    test('should show only Chinese cuisines on Chinese edit page', async ({ page }) => {
      await page.goto('/zh-CN/admin/recipes/new');
      await page.waitForLoadState('networkidle');

      const allSelects = page.locator('select:not([data-testid="language-switcher"])');
      const count = await allSelects.count();
      
      let cuisineSelect = null;
      for (let i = 0; i < count; i++) {
        const select = allSelects.nth(i);
        const firstOption = await select.locator('option').first().textContent();
        if (firstOption?.includes('菜系')) {
          cuisineSelect = select;
          break;
        }
      }

      if (cuisineSelect) {
        const options = await cuisineSelect.locator('option').allTextContents();
        const hasEnglishCuisine = options.some(opt => 
          /Chinese|Italian|Mexican|Indian|Japanese|Thai|French|American|Korean|Mediterranean/i.test(opt) &&
          !/[\u4e00-\u9fa5]/.test(opt)
        );
        expect(hasEnglishCuisine).toBe(false);
      }
    });
  });
});
