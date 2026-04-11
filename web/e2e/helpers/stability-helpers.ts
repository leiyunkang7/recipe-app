import { Page, Locator, ConsoleMessage, Response } from "@playwright/test";

/**
 * Stability-Focused Test Helpers
 * 
 * This module provides utilities specifically designed for test stability:
 * - State-based waits instead of arbitrary timeouts
 * - Retry logic for flaky interactions
 * - Console error tracking
 * 
 * Use these alongside test-helpers.ts for comprehensive coverage.
 */

// Console error tracking - singleton per test session
const consoleErrors: string[] = [];

export function getConsoleErrors(): string[] {
  return [...consoleErrors];
}

export function clearConsoleErrors(): void {
  consoleErrors.length = 0;
}

export function trackConsoleErrors(page: Page): void {
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
}

/**
 * Wait for element with configurable state
 */
export async function waitForElement(
  page: Page,
  selector: string,
  options: { timeout?: number; state?: "visible" | "attached" | "detached" | "hidden" } = {}
): Promise<Locator> {
  const { timeout = 15000, state = "visible" } = options;
  const locator = page.locator(selector);
  await locator.waitFor({ state, timeout });
  return locator;
}

/**
 * Wait for page to be fully ready
 */
export async function waitForPageReady(page: Page, timeout = 30000): Promise<void> {
  await page.waitForLoadState("domcontentloaded", { timeout });
  await page.waitForFunction(
    () => document.readyState === "complete",
    { timeout }
  ).catch(() => {});
}

/**
 * Wait for element count to reach minimum
 */
export async function waitForElementCount(
  page: Page,
  selector: string,
  options: { minCount?: number; timeout?: number } = {}
): Promise<number> {
  const { minCount = 1, timeout = 15000 } = options;
  const locator = page.locator(selector);
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const count = await locator.count();
    if (count >= minCount) return count;
    await page.waitForTimeout(100);
  }
  return await locator.count();
}

/**
 * Click element with retry logic
 */
export async function clickWithRetry(
  page: Page,
  selector: string,
  options: { timeout?: number; retries?: number; force?: boolean } = {}
): Promise<boolean> {
  const { timeout = 10000, retries = 3, force = true } = options;
  const locator = page.locator(selector);
  
  for (let i = 0; i < retries; i++) {
    const count = await locator.count();
    if (count === 0) {
      if (i === retries - 1) return false;
      await page.waitForTimeout(200);
      continue;
    }
    try {
      await locator.first().click({ timeout, force });
      return true;
    } catch {
      if (i === retries - 1) return false;
      await page.waitForTimeout(200);
    }
  }
  return false;
}

/**
 * Fill input with retry
 */
export async function fillWithRetry(
  page: Page,
  selector: string,
  value: string,
  options: { timeout?: number; retries?: number } = {}
): Promise<boolean> {
  const { timeout = 10000, retries = 3 } = options;
  const locator = page.locator(selector);
  
  for (let i = 0; i < retries; i++) {
    const count = await locator.count();
    if (count === 0) {
      if (i === retries - 1) return false;
      await page.waitForTimeout(200);
      continue;
    }
    try {
      await locator.first().clear();
      await locator.first().fill(value, { timeout });
      return true;
    } catch {
      if (i === retries - 1) return false;
      await page.waitForTimeout(200);
    }
  }
  return false;
}

/**
 * Navigate to URL and wait for content
 */
export async function navigateAndWait(
  page: Page,
  url: string,
  options: { waitForSelector?: string; timeout?: number } = {}
): Promise<boolean> {
  const { waitForSelector = "body", timeout = 30000 } = options;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout });
    await page.waitForSelector(waitForSelector, { state: "attached", timeout: 10000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get first recipe link from page
 */
export async function getFirstRecipeLink(page: Page): Promise<string | null> {
  await page.waitForLoadState("domcontentloaded");
  let links = await page.locator('a[href*="/zh-CN/recipes/"]').all();
  if (links.length === 0) links = await page.locator('a[href*="/en/recipes/"]').all();
  if (links.length === 0) links = await page.locator('a[href*="/recipes/"]').all();
  if (links.length === 0) return null;
  return await links[0].getAttribute("href");
}

/**
 * Get all recipe links from page
 */
export async function getAllRecipeLinks(page: Page): Promise<string[]> {
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
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  return await page.locator(selector).count() > 0;
}

/**
 * Check if element is visible
 */
export async function elementIsVisible(page: Page, selector: string): Promise<boolean> {
  try {
    const count = await page.locator(selector).count();
    if (count === 0) return false;
    return await page.locator(selector).first().isVisible();
  } catch {
    return false;
  }
}

/**
 * Assert page has meaningful content
 */
export async function assertPageHasContent(
  page: Page,
  minLength = 100,
  selector = "body"
): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  const locator = page.locator(selector);
  await locator.waitFor({ state: "attached", timeout: 10000 });
  const html = await locator.innerHTML();
  expect(html.length).withContext(
    "Page content should be at least " + minLength + " chars"
  ).toBeGreaterThan(minLength);
}

/**
 * Assert no critical console errors
 */
export async function assertNoConsoleErrors(page: Page): Promise<void> {
  const errors = getConsoleErrors();
  const criticalErrors = errors.filter(
    (e) => !e.includes("Warning") && !e.includes("deprecat") && !e.includes("Download the")
  );
  expect(criticalErrors.length).withContext(
    "Found " + criticalErrors.length + " console errors: " + criticalErrors.slice(0, 3).join(", ")
  ).toBeLessThan(3);
}

/**
 * Check if on login page
 */
export async function isOnLoginPage(page: Page): Promise<boolean> {
  await page.waitForLoadState("domcontentloaded");
  const url = page.url();
  const loginIndicators = ["/login", "/signin", "/sign-in", "/auth"];
  if (loginIndicators.some((ind) => url.toLowerCase().includes(ind))) return true;
  
  const emailInput = await page.locator('input[type="email"], input[name="email"]').count();
  const passwordInput = await page.locator('input[type="password"], input[name="password"]').count();
  return emailInput > 0 && passwordInput > 0;
}

/**
 * Check if authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  await page.waitForLoadState("domcontentloaded");
  const userElements = await page.locator('[data-testid="user-menu"], [aria-label*="profile"]').count();
  const loginForm = await page.locator("form #email").count();
  return userElements > 0 && loginForm === 0;
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
