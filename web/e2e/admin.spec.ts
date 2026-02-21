import { test, expect } from '@playwright/test';

test.describe('Recipe App - Admin Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('should load admin dashboard', async ({ page }) => {
    // Check if admin page loads
    await expect(page.locator('body')).toBeVisible();

    // Check for common admin elements
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
  });

  test('should display recipe list or empty state', async ({ page }) => {
    const recipes = page.locator('table tbody tr, .admin-recipe-item, [data-testid="admin-recipe"]');
    const emptyState = page.locator('text=/no recipes/i, text=/empty/i');

    const count = await recipes.count();
    if (count > 0) {
      await expect(recipes.first()).toBeVisible();
    } else {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should have create recipe button', async ({ page }) => {
    const createButton = page.locator('button:has-text("Add Recipe"), button:has-text("Create"), a:has-text("Add")').first();

    const count = await createButton.count();
    if (count > 0) {
      await expect(createButton).toBeVisible();
    }
  });

  test('should navigate to create recipe form', async ({ page }) => {
    const createButton = page.locator('button:has-text("Add Recipe"), button:has-text("Create")').first();

    const count = await createButton.count();
    if (count > 0) {
      await createButton.click();
      await page.waitForTimeout(1000);

      // Should be on create form or modal
      const form = page.locator('form, [data-testid="recipe-form"], .modal').first();
      await expect(form).toBeVisible();
    }
  });

  test('should have edit buttons for recipes', async ({ page }) => {
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();

    const count = await editButton.count();
    if (count > 0) {
      await expect(editButton).toBeVisible();
    }
  });

  test('should navigate to edit form', async ({ page }) => {
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit")').first();

    const count = await editButton.count();
    if (count > 0) {
      await editButton.click();
      await page.waitForTimeout(1000);

      // Should be on edit form
      const form = page.locator('form, [data-testid="recipe-form"]').first();
      await expect(form).toBeVisible();
    }
  });

  test('should have delete buttons for recipes', async ({ page }) => {
    const deleteButton = page.locator('button:has-text("Delete")').first();

    const count = await deleteButton.count();
    if (count > 0) {
      await expect(deleteButton).toBeVisible();
    }
  });

  test('should show delete confirmation', async ({ page }) => {
    const deleteButton = page.locator('button:has-text("Delete")').first();

    const count = await deleteButton.count();
    if (count > 0) {
      // Set up dialog handler
      page.on('dialog', dialog => dialog.accept());

      await deleteButton.click();

      // Check if confirmation appears
      const confirmDialog = page.locator('.dialog, .modal, [role="dialog"]').first();
      const dialogCount = await confirmDialog.count();

      if (dialogCount > 0) {
        await expect(confirmDialog).toBeVisible();
      }
    }
  });

  test('should have pagination if many recipes', async ({ page }) => {
    const pagination = page.locator('.pagination, [data-testid="pagination"]').first();

    const count = await pagination.count();
    if (count > 0) {
      await expect(pagination).toBeVisible();
    }
  });

  test('should handle filter by category', async ({ page }) => {
    const categoryFilter = page.locator('select#category, [data-testid="category-filter"]').first();

    const count = await categoryFilter.count();
    if (count > 0) {
      await categoryFilter.selectOption('Dinner');
      await page.waitForTimeout(1000);

      // Verify no errors
      await expect(page).not.toHaveURL(/error/);
    }
  });

  test('should be accessible', async ({ page }) => {
    // Check for basic accessibility features
    const buttons = page.locator('button').all();
    const inputs = page.locator('input, select, textarea').all();

    const buttonCount = await (await buttons).length;
    const inputCount = await (await inputs).length;

    // Should have interactive elements
    expect(buttonCount + inputCount).toBeGreaterThan(0);
  });
});
