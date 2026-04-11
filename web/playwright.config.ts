import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Optimized Playwright Configuration
 * 
 * Key improvements:
 * - Better timeout defaults
 * - Improved retry strategies
 * - Enhanced browser launch options for stability
 * - Better error reporting
 */

function loadEnv() {
  try {
    const envPath = join(process.cwd(), ".env");
    const envContent = readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");
    for (const line of lines) {
      const [key, ...valueParts] = line.split("=");
      if (key && valueParts.length > 0) {
        const trimmedKey = key.trim();
        const trimmedValue = valueParts.join("=").trim();
        if (trimmedKey && trimmedValue && !process.env[trimmedKey]) {
          process.env[trimmedKey] = trimmedValue;
        }
      }
    }
  } catch (error) {
    console.error("Failed to load .env file:", error);
  }
}
loadEnv();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  
  // Retry configuration for flakiness
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  
  // Enhanced reporters
  reporter: [
    ["html"],
    ["json", { outputFile: "playwright-report/results.json" }],
    ["list"],
  ],
  
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    
    // Capture traces/screenshots on failure
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    
    // Optimized timeouts
    actionTimeout: 15000,
    navigationTimeout: 60000,
    
    // Browser launch options for stability
    launchOptions: {
      args: [
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-web-security",
        "--no-sandbox",
        "--disable-translate",
        "--disable-extensions",
      ],
    },
  },
  
  expect: {
    timeout: 10000,
    // Polling for dynamic content
    polling: 100,
  },
  
  webServer: {
    command: "bun run dev",
    url: "http://127.0.0.1:3000",
    timeout: 180 * 1000,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      DATABASE_URL: process.env.DATABASE_URL || "",
      UPLOAD_DIR: process.env.UPLOAD_DIR || "./uploads",
      USE_MOCK_DATA: "true",
      NUXT_PUBLIC_USE_MOCK_DATA: "true",
    },
  },
  
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
