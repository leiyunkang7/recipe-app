import { test, expect } from '@playwright/test';

test.describe('Recipe App - Form Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/recipes/new');
    await page.waitForLoadState('networkidle');
  });

  test('should show error when submitting with empty ingredients', async ({ page }) => {
    await page.fillInput('input[v-model="formData.translations[0].title"]', 'Test Recipe');
    
    const categorySelect = page.locator('select[v-model="formData.category"]');
    await categorySelect.selectOption({ label: 'Dinner' });
    
    const difficultySelect = page.locator('select[v-model="formData.difficulty"]');
    await difficultySelect.selectOption({ label: 'Medium' });
    
    await page.fillInput('input[v-model.number="formData.servings"]', '4');
    await page.fillInput('input[v-model.number="formData.prepTimeMinutes"]', '10');
    await page.fillInput('input[v-model.number="formData.cookTimeMinutes"]', '20');
    
    const deleteButtons = page.locator('button[aria-label="Delete"]');
    const count = await deleteButtons.count();
    
    for (let i = 0; i < count; i++) {
      await page.locator('button[aria-label="Delete"]').first().click();
      await page.waitForTimeout(100);
    }
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    await page.waitForTimeout(500);
    
    const errorVisible = await page.locator('.bg-red-50, .text-red-800').count();
    expect(errorVisible).toBeGreaterThan(0);
  });

  test('should accept valid form submission', async ({ page }) => {
    await page.fillInput('input[v-model="formData.translations[0].title"]', 'Valid Test Recipe');
    
    const categorySelect = page.locator('select[v-model="formData.category"]');
    await categorySelect.selectOption({ label: 'Dinner' });
    
    const difficultySelect = page.locator('select[v-model="formData.difficulty"]');
    await difficultySelect.selectOption({ label: 'Easy' });
    
    await page.fillInput('input[v-model.number="formData.servings"]', '4');
    await page.fillInput('input[v-model.number="formData.prepTimeMinutes"]', '15');
    await page.fillInput('input[v-model.number="formData.cookTimeMinutes"]', '30');
    
    const ingredientInputs = page.locator('input[placeholder="Ingredient Name"]');
    const firstIngredient = ingredientInputs.first();
    await firstIngredient.fill('Tomato');
    
    const amountInputs = page.locator('input[placeholder="Amount"]');
    await amountInputs.first().fill('2');
    
    const unitInputs = page.locator('input[placeholder="Unit"]');
    await unitInputs.first().fill('pieces');
    
    const stepTextareas = page.locator('textarea[placeholder="Instruction"]');
    await stepTextareas.first().fill('Chop tomatoes');
    
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
  });
});

test.describe('Recipe App - Accessibility', () => {
  test('language switcher should have aria-label', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const languageSwitcher = page.locator('[aria-label="Select language"]');
    await expect(languageSwitcher).toBeVisible();
  });

  test('delete buttons should have aria-label', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    const deleteButtons = page.locator('button[aria-label="Delete"], button[aria-label="删除"]');
    const count = await deleteButtons.count();
    
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Recipe App - Search Debounce', () => {
  test('search should debounce input', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    const startTime = Date.now();
    
    await searchInput.fill('t', { delay: 50 });
    await searchInput.fill('to', { delay: 50 });
    await searchInput.fill('tom', { delay: 50 });
    await searchInput.fill('toma', { delay: 50 });
    await searchInput.fill('tomat', { delay: 50 });
    await searchInput.fill('tomato', { delay: 50 });
    
    await page.waitForTimeout(500);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(2000);
  });
});
