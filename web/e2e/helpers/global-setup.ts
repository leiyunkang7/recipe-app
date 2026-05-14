import { chromium, FullConfig } from "@playwright/test";

/**
 * Global setup for Playwright E2E tests
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  // Ensure browser is launched with consistent settings
  const browser = await chromium.launch();
  
  // Clear any cached state
  await browser.contexts().forEach(async (context) => {
    await context.close();
  });
  
  await browser.close();
}

export default globalSetup;
