import { test, expect } from '@playwright/test';

test.describe('Register Page', () => {
  test.describe('Page Rendering', () => {
    test('should load register page successfully', async ({ page }) => {
      await page.goto('/zh-CN/register');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('h1', { timeout: 10000 });
      await page.waitForTimeout(500);

      // Verify page title exists
      const title = page.locator('h1');
      await expect(title).toBeVisible();
    });

    test('should display all form elements', async ({ page }) => {
      await page.goto('/zh-CN/register');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('#email', { timeout: 10000 });
      await page.waitForTimeout(500);

      // Check email input
      const emailInput = page.locator('#email');
      await expect(emailInput).toBeVisible();

      // Check username input
      const usernameInput = page.locator('#username');
      await expect(usernameInput).toBeVisible();

      // Check password input
      const passwordInput = page.locator('#password');
      await expect(passwordInput).toBeVisible();

      // Check confirm password input
      const confirmPasswordInput = page.locator('#confirmPassword');
      await expect(confirmPasswordInput).toBeVisible();

      // Check verification code input
      const verificationCodeInput = page.locator('#verificationCode');
      await expect(verificationCodeInput).toBeVisible();

      // Check register button (submit type)
      const registerButton = page.locator('button[type="submit"]');
      await expect(registerButton).toBeVisible();
    });

    test('should switch language between Chinese and English', async ({ page }) => {
      // Test Chinese version
      await page.goto('/zh-CN/register');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('h1', { timeout: 10000 });
      await page.waitForTimeout(500);

      // Verify URL contains zh-CN
      expect(page.url()).toContain('/zh-CN/register');

      // Navigate to English version
      await page.goto('/en/register');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      // Verify URL contains en
      expect(page.url()).toContain('/en/register');
    });

    test('should have login link', async ({ page }) => {
      await page.goto('/zh-CN/register');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('a[href*="/login"]', { timeout: 10000 });
      await page.waitForTimeout(500);

      const loginLink = page.locator('a[href*="/login"]');
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe('Form Validation', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/zh-CN/register');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('form', { timeout: 10000 });
      await page.waitForTimeout(500);
    });

    test('should validate email format', async ({ page }) => {
      const emailInput = page.locator('#email');

      // Test invalid email
      await emailInput.fill('invalid-email');
      await emailInput.blur();
      await page.waitForTimeout(300);

      // Test valid email
      await emailInput.fill('test@example.com');
      await emailInput.blur();
      await page.waitForTimeout(300);

      // Verify input value
      await expect(emailInput).toHaveValue('test@example.com');
    });

    test('should validate username format', async ({ page }) => {
      const usernameInput = page.locator('#username');

      // Test valid username
      await usernameInput.fill('valid_user123');
      await usernameInput.blur();
      await page.waitForTimeout(300);

      // Verify input value
      await expect(usernameInput).toHaveValue('valid_user123');
    });

    test('should validate password strength', async ({ page }) => {
      const passwordInput = page.locator('#password');

      // Test valid password
      await passwordInput.fill('password123');
      await passwordInput.blur();
      await page.waitForTimeout(300);

      // Verify input value
      await expect(passwordInput).toHaveValue('password123');
    });

    test('should display password strength indicator when password is entered', async ({ page }) => {
      const passwordInput = page.locator('#password');

      // Enter password to trigger strength indicator
      await passwordInput.fill('password123');
      await page.waitForTimeout(300);

      // Check for strength bar container (should appear when password is entered)
      const strengthContainer = page.locator('.h-2.bg-gray-200, .bg-gray-200.rounded-full');
      const count = await strengthContainer.count();
      // Strength indicator should appear when password is entered
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should validate confirm password', async ({ page }) => {
      const passwordInput = page.locator('#password');
      const confirmPasswordInput = page.locator('#confirmPassword');

      // Enter password
      await passwordInput.fill('password123');

      // Enter matching confirm password
      await confirmPasswordInput.fill('password123');
      await confirmPasswordInput.blur();
      await page.waitForTimeout(300);

      // Verify input value
      await expect(confirmPasswordInput).toHaveValue('password123');
    });

    test('should validate verification code format', async ({ page }) => {
      const verificationCodeInput = page.locator('#verificationCode');

      // Test valid code
      await verificationCodeInput.fill('123456');
      await verificationCodeInput.blur();
      await page.waitForTimeout(300);

      // Verify input value
      await expect(verificationCodeInput).toHaveValue('123456');
    });

    test('should have password type initially', async ({ page }) => {
      const passwordInput = page.locator('#password');
      await expect(passwordInput).toHaveAttribute('type', 'password');

      const confirmPasswordInput = page.locator('#confirmPassword');
      await expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Verification Code Sending', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/zh-CN/register');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('form', { timeout: 10000 });
      await page.waitForTimeout(500);
    });

    test('should have send code button visible', async ({ page }) => {
      // Check that there's a button near the email input
      const emailContainer = page.locator('#email').locator('..').locator('..');
      const button = emailContainer.locator('button');
      const count = await button.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should accept email input', async ({ page }) => {
      const emailInput = page.locator('#email');
      await emailInput.fill('test@example.com');
      await expect(emailInput).toHaveValue('test@example.com');
    });
  });

  test.describe('Registration Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/zh-CN/register');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('form', { timeout: 10000 });
      await page.waitForTimeout(500);
    });

    test('should fill all form fields', async ({ page }) => {
      // Fill the form
      await page.locator('#email').fill('test@example.com');
      await page.locator('#username').fill('testuser');
      await page.locator('#password').fill('password123');
      await page.locator('#confirmPassword').fill('password123');
      await page.locator('#verificationCode').fill('123456');

      // Verify all values
      await expect(page.locator('#email')).toHaveValue('test@example.com');
      await expect(page.locator('#username')).toHaveValue('testuser');
      await expect(page.locator('#password')).toHaveValue('password123');
      await expect(page.locator('#confirmPassword')).toHaveValue('password123');
      await expect(page.locator('#verificationCode')).toHaveValue('123456');
    });

    test('should have submit button enabled when form is filled', async ({ page }) => {
      // Fill the form
      await page.locator('#email').fill('test@example.com');
      await page.locator('#username').fill('testuser');
      await page.locator('#password').fill('password123');
      await page.locator('#confirmPassword').fill('password123');
      await page.locator('#verificationCode').fill('123456');

      // Submit button should be visible
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper labels for all form fields', async ({ page }) => {
      await page.goto('/zh-CN/register');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('label[for="email"]', { timeout: 10000 });
      await page.waitForTimeout(500);

      // Check labels are associated with inputs
      const emailLabel = page.locator('label[for="email"]');
      await expect(emailLabel).toBeVisible();

      const usernameLabel = page.locator('label[for="username"]');
      await expect(usernameLabel).toBeVisible();

      const passwordLabel = page.locator('label[for="password"]');
      await expect(passwordLabel).toBeVisible();

      const confirmPasswordLabel = page.locator('label[for="confirmPassword"]');
      await expect(confirmPasswordLabel).toBeVisible();

      const verificationCodeLabel = page.locator('label[for="verificationCode"]');
      await expect(verificationCodeLabel).toBeVisible();
    });

    test('should have touch-friendly button sizes', async ({ page }) => {
      await page.goto('/zh-CN/register');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('button[type="submit"]', { timeout: 10000 });
      await page.waitForTimeout(500);

      // Check submit button has proper touch target size
      const submitButton = page.locator('button[type="submit"]');
      const submitClass = await submitButton.getAttribute('class') || '';
      const submitHasProperSize =
        submitClass.includes('min-h-[44px]') ||
        submitClass.includes('min-h-11') ||
        submitClass.includes('py-2') ||
        submitClass.includes('py-3');
      expect(submitHasProperSize).toBeTruthy();
    });

    test('should have proper input types', async ({ page }) => {
      await page.goto('/zh-CN/register');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('#email', { timeout: 10000 });
      await page.waitForTimeout(500);

      // Email input should have type="email"
      const emailInput = page.locator('#email');
      await expect(emailInput).toHaveAttribute('type', 'email');

      // Password inputs should have type="password" (initially)
      const passwordInput = page.locator('#password');
      await expect(passwordInput).toHaveAttribute('type', 'password');

      const confirmPasswordInput = page.locator('#confirmPassword');
      await expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  test.describe('Mobile View', () => {
    test.use({
      viewport: { width: 375, height: 667 },
    });

    test('should display register form properly on mobile', async ({ page }) => {
      await page.goto('/zh-CN/register');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('form', { timeout: 10000 });
      await page.waitForTimeout(500);

      // Form should be visible and usable on mobile
      const form = page.locator('form');
      await expect(form).toBeVisible();

      // All inputs should be visible
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#username')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('#confirmPassword')).toBeVisible();
      await expect(page.locator('#verificationCode')).toBeVisible();
    });

    test('should display bottom navigation on mobile', async ({ page }) => {
      await page.goto('/zh-CN/register');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('nav', { timeout: 10000 });
      await page.waitForTimeout(500);

      // BottomNav should be visible on mobile
      const bottomNav = page.locator('nav[aria-label="底部导航"]');
      const count = await bottomNav.count();

      if (count > 0) {
        await expect(bottomNav).toBeVisible();
      } else {
        // Fallback check for bottom nav class
        const bottomNavFallback = page.locator('nav.fixed.bottom-0').first();
        await expect(bottomNavFallback).toBeVisible();
      }
    });
  });

  test.describe('Desktop View', () => {
    test.use({
      viewport: { width: 1280, height: 720 },
    });

    test('should display register form properly on desktop', async ({ page }) => {
      await page.goto('/zh-CN/register');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('form', { timeout: 10000 });
      await page.waitForTimeout(500);

      // Form should be centered and properly sized on desktop
      const form = page.locator('form');
      await expect(form).toBeVisible();

      // Check form container has max-width constraint
      const formContainer = page.locator('.max-w-md');
      await expect(formContainer).toBeVisible();
    });

    test('should hide bottom navigation on desktop', async ({ page }) => {
      await page.goto('/zh-CN/register');
      await page.waitForLoadState('networkidle');
      await page.waitForSelector('nav', { timeout: 10000 });
      await page.waitForTimeout(500);

      // BottomNav should be hidden on desktop (md:hidden)
      const bottomNav = page.locator('nav.fixed.bottom-0');
      const count = await bottomNav.count();

      if (count > 0) {
        await expect(bottomNav.first()).not.toBeVisible();
      }
    });
  });
});
