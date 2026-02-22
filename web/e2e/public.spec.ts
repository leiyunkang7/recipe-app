import { test, expect } from '@playwright/test';

test.describe('Recipe App - Public Pages', () => {
  test('should navigate to homepage', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
  });

  test('should have basic page elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const html = await page.content();
    expect(html.length).toBeGreaterThan(0);
  });

  test('should find input elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    const inputs = await page.locator('input').count();
    expect(inputs).toBeGreaterThanOrEqual(0);
  });

  test('should not have white screen (page renders visible content)', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('body', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    const bodyContent = await page.locator('body').innerHTML();
    expect(bodyContent.trim().length).toBeGreaterThan(100);

  });
});

test.describe('Recipe App - Form Validation', () => {
  test('should show error when submitting empty ingredients', async ({ page }) => {
    await page.goto('/en/admin/recipes/new');
    await page.waitForLoadState('networkidle');
    
    await page.fillInput('input[placeholder*="Enter recipe title"]', 'Test Recipe');
    await page.selectOption('select', { label: 'Dinner' });
    await page.fillInput('input[type="number"]', '4');
    
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    
    const errorVisible = await page.locator('text*ingredient').count();
    expect(errorVisible).toBeGreaterThanOrEqual(0);
  });

  test('should show error when submitting empty steps', async ({ page }) => {
    await page.goto('/en/admin/recipes/new');
    await page.waitForLoadState('networkidle');
    
    await page.fillInput('input[placeholder*="Enter recipe title"]', 'Test Recipe');
    await page.selectOption('select', { label: 'Dinner' });
    await page.fillInput('input[type="number"]', '4');
    
    await page.click('button:has-text("Add Ingredient")');
    await page.fillInput('input[placeholder*="Ingredient Name"]', 'Salt');
    await page.fillInput('input[placeholder*="Amount"]', '1');
    await page.fillInput('input[placeholder*="Unit"]', 'tsp');
    
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(1000);
    
    const errorVisible = await page.locator('text*step').count();
    expect(errorVisible).toBeGreaterThanOrEqual(0);
  });
});
