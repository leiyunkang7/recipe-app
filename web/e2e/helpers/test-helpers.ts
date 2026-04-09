import { test as base, Page, Locator, ConsoleMessage } from "@playwright/test";

/**
 * Enhanced Test Helpers for Playwright E2E Tests
 * Provides stability utilities, retry logic, and common test patterns
 */

// Track console errors for debugging
const consoleErrors: string[] = [];
export function getConsoleErrors(): string[] {
  return [...consoleErrors];
}
export function clearConsoleErrors(): void {
  consoleErrors.length = 0;
}

/**
 * Setup console error tracking for a page
 */
export function trackConsoleErrors(page: Page): void {
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
}

/**
 * Wait for element with retry logic for stability
 */
export async function waitForElementStable(
  page: Page,
  selector: string,
  options: { timeout?: number; retries?: number } = {}
): Promise<Locator> {
  const { timeout = 15000, retries = 3 } = options;
  const locator = page.locator(selector);

  for (let i = 0; i < retries; i++) {
    try {
      await locator.waitFor({ state: "visible", timeout });
      return locator;
    } catch {
      if (i === retries - 1) throw new Error(`Element ${selector} not visible after ${retries} attempts`);
      await page.waitForTimeout(500);
    }
  }
  return locator;
}

/**
 * Click with retry for flaky elements
 */
export async function clickWithRetry(
  page: Page,
  selector: string,
  options: { timeout?: number; retries?: number; force?: boolean } = {}
): Promise<void> {
  const { timeout = 10000, retries = 3, force = true } = options;

  for (let i = 0; i < retries; i++) {
    try {
      await page.locator(selector).click({ timeout, force });
      return;
    } catch (e) {
      if (i === retries - 1) throw new Error(`Failed to click ${selector} after ${retries} attempts`);
      await page.waitForTimeout(300);
    }
  }
}

/**
 * Fill input with retry
 */
export async function fillWithRetry(
  page: Page,
  selector: string,
  value: string,
  options: { timeout?: number; retries?: number } = {}
): Promise<void> {
  const { timeout = 10000, retries = 3 } = options;

  for (let i = 0; i < retries; i++) {
    try {
      const input = page.locator(selector);
      await input.clear();
      await input.fill(value, { timeout });
      return;
    } catch {
      if (i === retries - 1) throw new Error(`Failed to fill ${selector} after ${retries} attempts`);
      await page.waitForTimeout(300);
    }
  }
}

/**
 * Navigate and wait for content
 */
export async function navigateAndWait(
  page: Page,
  url: string,
  options: { waitForSelector?: string; timeout?: number } = {}
): Promise<void> {
  const { waitForSelector = "body", timeout = 30000 } = options;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout });
  await page.waitForSelector(waitForSelector, { state: "attached", timeout });
}

/**
 * Get recipe links from current page
 */
export async function getRecipeLinks(page: Page): Promise<string[]> {
  await page.waitForLoadState("domcontentloaded");
  const links = await page.locator('a[href*="/zh-CN/recipes/"]').all();
  const hrefs: string[] = [];
  for (const link of links) {
    const href = await link.getAttribute("href");
    if (href) hrefs.push(href);
  }
  return hrefs;
}

/**
 * Get recipe links regardless of locale
 */
export async function getAnyRecipeLinks(page: Page): Promise<string[]> {
  await page.waitForLoadState("domcontentloaded");
  const links = await page.locator('a[href*="/recipes/"]').all();
  const hrefs: string[] = [];
  for (const link of links) {
    const href = await link.getAttribute("href");
    if (href) hrefs.push(href);
  }
  return hrefs;
}

/**
 * Wait for element to be attached to DOM but not necessarily visible
 */
export async function waitForElementAttached(
  page: Page,
  selector: string,
  options: { timeout?: number } = {}
): Promise<Locator> {
  const { timeout = 15000 } = options;
  const locator = page.locator(selector);
  await locator.waitFor({ state: "attached", timeout });
  return locator;
}

/**
 * Check if we're on a login page
 */
export async function isOnLoginPage(page: Page): Promise<boolean> {
  await page.waitForLoadState("domcontentloaded");
  const url = page.url();
  const loginIndicators = [
    "/login",
    "/signin",
    "/sign-in",
    "/auth",
    "/account/login",
  ];
  const hasLoginUrl = loginIndicators.some(indicator => url.toLowerCase().includes(indicator));
  if (hasLoginUrl) return true;

  // Check for login form elements
  const emailInput = await page.locator('input[type="email"], input[name="email"], input[id="email"]').count();
  const passwordInput = await page.locator('input[type="password"], input[name="password"]').count();
  const loginButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').count();

  return emailInput > 0 && passwordInput > 0 && loginButton > 0;
}

/**
 * Handle authentication redirects gracefully
 */
export async function handleAuthRedirect(
  page: Page,
  options: { timeout?: number; continueAsGuest?: boolean } = {}
): Promise<{ wasRedirected: boolean; completed: boolean }> {
  const { timeout = 10000, continueAsGuest = true } = options;

  try {
    await page.waitForURL(/login|auth|signin/i, { timeout: 2000 }).catch(() => null);

    if (await isOnLoginPage(page)) {
      if (continueAsGuest) {
        const guestLink = page.locator('a:has-text("Continue as guest"), a:has-text("Skip"), a:has-text("Browse")').first();
        if (await guestLink.count() > 0) {
          await guestLink.click({ timeout: 5000 }).catch(() => null);
          return { wasRedirected: true, completed: true };
        }
      }
      return { wasRedirected: true, completed: false };
    }
    return { wasRedirected: false, completed: true };
  } catch {
    return { wasRedirected: false, completed: true };
  }
}

/**
 * Take a screenshot with timestamp for debugging
 */
export async function screenshotWithTimestamp(
  page: Page,
  name: string,
  options: { fullPage?: boolean } = {}
): Promise<string> {
  const { fullPage = true } = options;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `${name}-${timestamp}.png`;
  await page.screenshot({ path: filename, fullPage });
  return filename;
}

/**
 * Navigate to first recipe on page
 */
export async function navigateToFirstRecipe(page: Page): Promise<string | null> {
  const hrefs = await getRecipeLinks(page);
  if (hrefs.length > 0) {
    await page.goto(hrefs[0], { waitUntil: "domcontentloaded" });
    return hrefs[0];
  }
  return null;
}

/**
 * Check page has meaningful content
 */
export async function assertPageHasContent(page: Page, minLength = 100): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  const body = page.locator("body");
  await body.waitFor({ state: "attached", timeout: 10000 });
  const html = await body.innerHTML();
  if (html.trim().length < minLength) {
    throw new Error(`Page content too short: ${html.length} chars`);
  }
}

/**
 * Safe click that handles missing elements gracefully
 */
export async function safeClick(
  page: Page,
  selector: string,
  options: { timeout?: number } = {}
): Promise<boolean> {
  const { timeout = 5000 } = options;
  try {
    const locator = page.locator(selector);
    const count = await locator.count();
    if (count > 0) {
      await locator.first().click({ timeout });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Wait for page load with proper state detection
 */
export async function waitForPageReady(page: Page, timeout = 30000): Promise<void> {
  await page.waitForLoadState("domcontentloaded", { timeout });
  // Wait for any animations/transitions to settle
  await page.waitForTimeout(300);
}

/**
 * Assert URL contains expected substring
 */
export function assertUrlContains(page: Page, substring: string): void {
  expect(page.url()).toContain(substring);
}

/**
 * Check element exists without failing
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  const count = await page.locator(selector).count();
  return count > 0;
}

/**
 * Wait for network idle with timeout
 */
export async function waitForNetworkIdle(page: Page, timeout = 30000): Promise<void> {
  try {
    await page.waitForLoadState("networkidle", { timeout });
  } catch (e) {
    // Network idle might not be achievable, continue anyway
  }
}

/**
 * Scroll element into view safely
 */
export async function scrollIntoViewIfNeeded(
  page: Page,
  selector: string,
  options: { timeout?: number } = {}
): Promise<boolean> {
  const { timeout = 5000 } = options;
  try {
    const locator = page.locator(selector);
    const count = await locator.count();
    if (count > 0) {
      await locator.first().scrollIntoViewIfNeeded({ timeout });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Check if page has any console errors
 */
export async function assertNoConsoleErrors(page: Page, ignorePatterns: string[] = []): Promise<void> {
  const errors = getConsoleErrors();
  const relevantErrors = errors.filter(err =>
    !ignorePatterns.some(pattern => err.includes(pattern))
  );
  if (relevantErrors.length > 0) {
    throw new Error(`Console errors detected: ${relevantErrors.join(', ')}`);
  }
}

/**
 * Get element bounding box safely
 */
export async function getBoundingBox(
  page: Page,
  selector: string
): Promise<{ x: number; y: number; width: number; height: number } | null> {
  const locator = page.locator(selector);
  const count = await locator.count();
  if (count === 0) return null;

  try {
    return await locator.first().boundingBox();
  } catch {
    return null;
  }
}

/**
 * Check authentication state by looking for login form or user-specific elements
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  await page.waitForLoadState("domcontentloaded");
  const userElements = await page.locator('[data-testid="user-menu"], [aria-label*="profile"], a[href*="/profile"]').count();
  const loginForm = await page.locator('form #email').count();
  return userElements > 0 && loginForm === 0;
}

// Extended test with custom helpers
export const test = base.extend<{
  waitAndClick: (selector: string, options?: { timeout?: number; retries?: number }) => Promise<void>;
  waitAndFill: (selector: string, value: string, options?: { timeout?: number; retries?: number }) => Promise<void>;
  getRecipeLinks: () => Promise<string[]>;
  getAnyRecipeLinks: () => Promise<string[]>;
  navigateToFirstRecipe: () => Promise<string | null>;
  assertPageHasContent: (minLength?: number) => Promise<void>;
  safeClick: (selector: string, options?: { timeout?: number }) => Promise<boolean>;
  waitForPageReady: (timeout?: number) => Promise<void>;
  waitForNetworkIdle: (timeout?: number) => Promise<void>;
  scrollIntoViewIfNeeded: (selector: string, options?: { timeout?: number }) => Promise<boolean>;
  assertNoConsoleErrors: (ignorePatterns?: string[]) => Promise<void>;
  getBoundingBox: (selector: string) => Promise<{ x: number; y: number; width: number; height: number } | null>;
  isAuthenticated: () => Promise<boolean>;
  trackConsoleErrors: () => void;
  waitForElementAttached: (selector: string, options?: { timeout?: number }) => Promise<Locator>;
  handleAuthRedirect: (options?: { timeout?: number; continueAsGuest?: boolean }) => Promise<{ wasRedirected: boolean; completed: boolean }>;
  isOnLoginPage: () => Promise<boolean>;
  screenshotWithTimestamp: (name: string, options?: { fullPage?: boolean }) => Promise<string>;
}>({
  waitAndClick: async ({ page }, use) => {
    await use((selector, options) => clickWithRetry(page, selector, options));
  },
  waitAndFill: async ({ page }, use) => {
    await use((selector, value, options) => fillWithRetry(page, selector, value, options));
  },
  getRecipeLinks: async ({ page }, use) => {
    await use(() => getRecipeLinks(page));
  },
  navigateToFirstRecipe: async ({ page }, use) => {
    await use(() => navigateToFirstRecipe(page));
  },
  assertPageHasContent: async ({ page }, use) => {
    await use((minLength) => assertPageHasContent(page, minLength));
  },
  safeClick: async ({ page }, use) => {
    await use((selector, options) => safeClick(page, selector, options));
  },
  waitForPageReady: async ({ page }, use) => {
    await use((timeout) => waitForPageReady(page, timeout));
  },
  waitForNetworkIdle: async ({ page }, use) => {
    await use((timeout) => waitForNetworkIdle(page, timeout));
  },
  scrollIntoViewIfNeeded: async ({ page }, use) => {
    await use((selector, options) => scrollIntoViewIfNeeded(page, selector, options));
  },
  assertNoConsoleErrors: async ({ page }, use) => {
    await use((ignorePatterns) => assertNoConsoleErrors(page, ignorePatterns));
  },
  getBoundingBox: async ({ page }, use) => {
    await use((selector) => getBoundingBox(page, selector));
  },
  isAuthenticated: async ({ page }, use) => {
    await use(() => isAuthenticated(page));
  },
  getAnyRecipeLinks: async ({ page }, use) => {
    await use(() => getAnyRecipeLinks(page));
  },
  waitForElementAttached: async ({ page }, use) => {
    await use((selector, options) => waitForElementAttached(page, selector, options));
  },
  handleAuthRedirect: async ({ page }, use) => {
    await use((options) => handleAuthRedirect(page, options));
  },
  isOnLoginPage: async ({ page }, use) => {
    await use(() => isOnLoginPage(page));
  },
  screenshotWithTimestamp: async ({ page }, use) => {
    await use((name, options) => screenshotWithTimestamp(page, name, options));
  },
  trackConsoleErrors: async ({ page }, use) => {
    await use(() => trackConsoleErrors(page));
  },
});

export { expect } from "@playwright/test";
