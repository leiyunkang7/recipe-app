import { test, expect } from '@playwright/test';

test.describe('Category and Cuisine Dropdown i18n', () => {
  test.describe('Homepage Category Dropdown', () => {
    test('should show only English categories on English page', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const categorySelect = page.getByTestId('category-select');
      const options = await categorySelect.locator('option').allTextContents();

      const hasChinese = options.some(opt => /[\u4e00-\u9fa5]/.test(opt));
      expect(hasChinese).toBe(false);
    });

    test('should show only Chinese categories on Chinese page', async ({ page }) => {
      await page.goto('/zh-CN');
      await page.waitForLoadState('networkidle');

      const categorySelect = page.getByTestId('category-select');
      const options = await categorySelect.locator('option').allTextContents();

      const hasEnglishCategory = options.some(opt => 
        /Breakfast|Lunch|Dinner|Dessert|Snack|Beverage|Other/i.test(opt)
      );
      expect(hasEnglishCategory).toBe(false);

      const categories = options.filter(opt => !/全部分类|All Categories/i.test(opt) && opt.trim() !== '');
      expect(categories.length).toBe(7);
    });

    test('should update categories when switching language', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const enCategorySelect = page.getByTestId('category-select');
      const enOptions = await enCategorySelect.locator('option').allTextContents();
      const enCategories = enOptions.filter(opt => opt !== 'All Categories' && opt.trim() !== '');

      const langSwitcher = page.getByTestId('language-switcher');
      await langSwitcher.selectOption('zh-CN');
      await page.waitForURL('**/zh-CN**');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const zhCategorySelect = page.getByTestId('category-select');
      const zhOptions = await zhCategorySelect.locator('option').allTextContents();
      const zhCategories = zhOptions.filter(opt => !/全部分类|All Categories/i.test(opt) && opt.trim() !== '');

      expect(enCategories.length).toBeGreaterThan(0);
      expect(zhCategories.length).toBeGreaterThan(0);
      expect(enCategories).not.toEqual(zhCategories);
    });

    test('should not have duplicate categories', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const categorySelect = page.getByTestId('category-select');
      const options = await categorySelect.locator('option').allTextContents();
      const categories = options.filter(opt => opt !== 'All Categories' && opt.trim() !== '');

      const uniqueCategories = [...new Set(categories.map(c => c.trim().toLowerCase()))];
      expect(categories.length).toBe(uniqueCategories.length);
      expect(categories.length).toBe(7);
    });

    test('should have exactly 7 category options (no extra untranslated data)', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      const categorySelect = page.getByTestId('category-select');
      const options = await categorySelect.locator('option').allTextContents();
      const categories = options.filter(opt => opt !== 'All Categories' && opt.trim() !== '');

      expect(categories.length).toBe(7);
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
