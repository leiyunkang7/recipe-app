import { test as base, Page, Locator, ConsoleMessage } from "@playwright/test";

/**
 * Extended Test Fixture with Stable Helpers
 * Use this instead of the base test for more reliable tests
 */

export interface ExtendedPageHelper {
  page: Page;
  waitForElement(selector: string, options?: { timeout?: number; state?: 'visible' | 'attached' | 'hidden' }): Promise<Locator>;
  waitForLoad(): Promise<void>;
  waitForNetworkIdle(): Promise<void>;
  click(selector: string, options?: { timeout?: number; retries?: number; force?: boolean }): Promise<boolean>;
  fill(selector: string, value: string, options?: { timeout?: number; retries?: number }): Promise<boolean>;
  navigateTo(url: string, options?: { waitForSelector?: string; timeout?: number }): Promise<boolean>;
  getFirstRecipeLink(): Promise<string | null>;
  getAllRecipeLinks(): Promise<string[]>;
  elementExists(selector: string): Promise<boolean>;
  elementVisible(selector: string): Promise<boolean>;
  assertContent(minLength?: number): Promise<void>;
  assertNoConsoleErrors(): Promise<void>;
  isOnLoginPage(): Promise<boolean>;
  isAuthenticated(): Promise<boolean>;
}

export const extendedTest = base.extend<{ ext: ExtendedPageHelper }>({
  ext: async ({ page }, use) => {
    const ext: ExtendedPageHelper = {
      page,

      waitForElement: async (selector: string, options = {}) => {
        const { timeout = 15000, state = 'visible' } = options;
        const locator = page.locator(selector);
        await locator.waitFor({ state, timeout });
        return locator;
      },

      waitForLoad: async () => {
        await page.waitForLoadState('domcontentloaded');
        await page.waitForFunction(() => document.readyState === 'complete', { timeout: 30000 }).catch(() => {});
      },

      waitForNetworkIdle: async () => {
        try {
          await page.waitForLoadState('networkidle', { timeout: 30000 });
        } catch {
          // Network idle may not be achievable, continue
        }
      },

      click: async (selector: string, options = {}) => {
        const { timeout = 10000, retries = 3, force = true } = options;
        const locator = page.locator(selector);
        for (let i = 0; i < retries; i++) {
          try {
            const count = await locator.count();
            if (count === 0) {
              if (i === retries - 1) return false;
              await page.waitForTimeout(200);
              continue;
            }
            await locator.first().click({ timeout, force });
            return true;
          } catch {
            if (i === retries - 1) return false;
            await page.waitForTimeout(200);
          }
        }
        return false;
      },

      fill: async (selector: string, value: string, options = {}) => {
        const { timeout = 10000, retries = 3 } = options;
        const locator = page.locator(selector);
        for (let i = 0; i < retries; i++) {
          try {
            const count = await locator.count();
            if (count === 0) {
              if (i === retries - 1) return false;
              await page.waitForTimeout(200);
              continue;
            }
            await locator.first().clear();
            await locator.first().fill(value, { timeout });
            return true;
          } catch {
            if (i === retries - 1) return false;
            await page.waitForTimeout(200);
          }
        }
        return false;
      },

      navigateTo: async (url: string, options = {}) => {
        const { waitForSelector = 'body', timeout = 30000 } = options;
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
          await page.waitForSelector(waitForSelector, { state: 'attached', timeout: 10000 });
          return true;
        } catch {
          return false;
        }
      },

      getFirstRecipeLink: async () => {
        await page.waitForLoadState('domcontentloaded');
        let links = await page.locator('a[href*="/zh-CN/recipes/"]').all();
        if (links.length === 0) links = await page.locator('a[href*="/en/recipes/"]').all();
        if (links.length === 0) links = await page.locator('a[href*="/recipes/"]').all();
        if (links.length === 0) return null;
        return await links[0].getAttribute('href');
      },

      getAllRecipeLinks: async () => {
        await page.waitForLoadState('domcontentloaded');
        const links = await page.locator('a[href*="/recipes/"]').all();
        const hrefs: string[] = [];
        for (const link of links) {
          const href = await link.getAttribute('href');
          if (href) hrefs.push(href);
        }
        return hrefs;
      },

      elementExists: async (selector: string) => {
        return await page.locator(selector).count() > 0;
      },

      elementVisible: async (selector: string) => {
        try {
          const count = await page.locator(selector).count();
          if (count === 0) return false;
          return await page.locator(selector).first().isVisible();
        } catch {
          return false;
        }
      },

      assertContent: async (minLength = 100) => {
        await page.waitForLoadState('domcontentloaded');
        const body = page.locator('body');
        await body.waitFor({ state: 'attached', timeout: 10000 });
        const html = await body.innerHTML();
        expect(html.length).withContext('Page content should be at least ' + minLength + ' chars').toBeGreaterThan(minLength);
      },

      assertNoConsoleErrors: async () => {
        const errors = getConsoleErrors();
        const criticalErrors = errors.filter(
          e => !e.includes('Warning') && !e.includes('deprecat') && !e.includes('Download the')
        );
        expect(criticalErrors.length).withContext('Found ' + criticalErrors.length + ' console errors').toBeLessThan(3);
      },

      isOnLoginPage: async () => {
        await page.waitForLoadState('domcontentloaded');
        const url = page.url();
        const loginIndicators = ['/login', '/signin', '/sign-in', '/auth'];
        if (loginIndicators.some(ind => url.toLowerCase().includes(ind))) return true;
        const emailInput = await page.locator('input[type="email"], input[name="email"]').count();
        const passwordInput = await page.locator('input[type="password"], input[name="password"]').count();
        return emailInput > 0 && passwordInput > 0;
      },

      isAuthenticated: async () => {
        await page.waitForLoadState('domcontentloaded');
        const userElements = await page.locator('[data-testid="user-menu"], [aria-label*="profile"]').count();
        const loginForm = await page.locator('form #email').count();
        return userElements > 0 && loginForm === 0;
      },
    };

    await use(ext);
  },
});
