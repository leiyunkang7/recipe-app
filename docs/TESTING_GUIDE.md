# Testing Guide - Recipe App

This guide explains how to run and maintain the automated test suite for the Recipe App project.

---

## Quick Start

### Run All Tests
```bash
cd ~/code/recipe-app
pnpm test:all
```

### Run Unit Tests Only
```bash
cd ~/code/recipe-app
pnpm test:unit
# View coverage report
open coverage/index.html
```

### Run E2E Tests Only
```bash
cd ~/code/recipe-app/web
pnpm test:e2e
# View Playwright report
npx playwright show-report
```

---

## Test Structure

```
recipe-app/
├── coverage/                          # Unit test coverage reports
│   ├── index.html                     # Interactive coverage report
│   └── coverage-final.json            # Coverage data
├── vitest.config.ts                   # Vitest configuration
├── web/
│   ├── e2e/                           # E2E test files
│   │   ├── public.spec.ts             # Public page tests
│   │   └── admin.spec.ts              # Admin page tests
│   ├── playwright.config.ts           # Playwright configuration
│   ├── playwright-report/             # E2E test reports
│   └── test-results/                  # Screenshots & videos
├── services/
│   ├── recipe/src/__tests__/          # RecipeService tests
│   ├── image/src/__tests__/           # ImageService tests
│   └── search/src/__tests__/          # SearchService tests
├── shared/types/src/__tests__/        # Schema validation tests
└── cli/src/commands/__tests__/        # CLI command tests
    ├── add.test.ts
    ├── list.test.ts
    └── get.test.ts
```

---

## Unit Tests

### Framework
- **Vitest** - Fast unit test framework
- **@vitest/coverage-v8** - Code coverage provider
- **jsdom** - DOM environment for CLI tests

### Running Unit Tests

```bash
# Watch mode (interactive)
pnpm test

# Run once (CI mode)
pnpm test:run

# With coverage
pnpm test:unit

# With UI
pnpm test:ui

# Run specific test file
pnpm test:run shared/types/src/__tests__/schemas.test.ts

# Run tests matching pattern
pnpm test:run --grep "should validate"
```

### Coverage Reports

```bash
# Generate coverage
pnpm test:unit

# Open HTML report
open coverage/index.html

# Or use vite preview
cd coverage && python3 -m http.server 8000
# Open http://localhost:8000
```

**Coverage Thresholds:**
- Statements: 100% (goal)
- Branches: 100% (goal)
- Functions: 100% (goal)
- Lines: 100% (goal)

**Current:** ~80% (estimated)

---

## E2E Tests

### Framework
- **Playwright** - Cross-browser E2E testing
- Browsers: Chromium, Firefox, WebKit
- Reporter: HTML + JSON + JUnit

### Running E2E Tests

```bash
cd web

# First time: Install browsers
pnpm test:e2e:install

# Run E2E tests
pnpm test:e2e

# Run with UI (interactive)
pnpm test:e2e:ui

# Debug mode (step-by-step)
pnpm test:e2e:debug

# Run specific test file
npx playwright test e2e/public.spec.ts

# Run specific test
npx playwright test -g "should load homepage"

# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### E2E Test Reports

```bash
# View HTML report
cd web
npx playwright show-report

# Open specific report
open playwright-report/index.html
```

**Report Contents:**
- Test execution timeline
- Screenshots (on failure)
- Videos (on failure)
- Network traces
- Console logs

---

## CI/CD

### GitHub Actions

**Workflow:** `.github/workflows/test.yml`

**Triggers:**
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

**Jobs:**
1. **unit** - Run unit tests with coverage
2. **e2e** - Run E2E tests
3. **build** - Verify build succeeds

**Artifacts:**
- Coverage reports (30 days retention)
- Playwright reports (30 days retention)
- Screenshots (7 days retention, on failure)

### Running Tests Locally (CI-like)

```bash
# Simulate CI environment
export CI=true

# Run unit tests
pnpm test:run

# Run E2E tests
cd web && pnpm test:e2e
```

---

## Writing New Tests

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { YourService } from '../service';

describe('YourService', () => {
  let service: YourService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new YourService();
  });

  it('should do something', async () => {
    const result = await service.method();
    expect(result.success).toBe(true);
  });

  it('should handle errors', async () => {
    // Mock dependencies
    vi.spyOn(dependency, 'method').mockRejectedValue(new Error('Test error'));

    const result = await service.method();
    expect(result.success).toBe(false);
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/path');
  });

  test('should do something', async ({ page }) => {
    await page.click('button');
    await expect(page.locator('.result')).toBeVisible();
  });

  test('should handle errors', async ({ page }) => {
    await page.fill('input', 'invalid');
    await page.click('button');
    await expect(page.locator('.error')).toBeVisible();
  });
});
```

---

## Troubleshooting

### Unit Tests

**Problem:** Tests fail with mock errors
**Solution:**
```bash
# Clear cache
pnpm test:run --clearCache

# Re-run tests
pnpm test:run
```

**Problem:** Coverage not generating
**Solution:**
```bash
# Install c8 (if needed)
pnpm add -D @vitest/coverage-v8

# Run with coverage
pnpm test:unit
```

### E2E Tests

**Problem:** Browser not found
**Solution:**
```bash
cd web
pnpm test:e2e:install
```

**Problem:** Tests timeout
**Solution:**
```bash
# Increase timeout in playwright.config.ts
use: {
  actionTimeout: 10000,
  navigationTimeout: 30000,
}
```

**Problem:** Tests fail in CI but pass locally
**Solution:**
- Check for timing issues (add explicit waits)
- Verify environment variables are set
- Check for hardcoded localhost URLs

---

## Best Practices

### Unit Tests

1. **One assertion per test** (when possible)
2. **Arrange-Act-Assert** pattern
3. **Mock external dependencies** (Supabase, filesystem)
4. **Test success AND failure paths**
5. **Use descriptive test names**

### E2E Tests

1. **Use data-testid attributes** for selectors
2. **Wait for elements explicitly** (avoid fixed timeouts)
3. **Clean up test data** after each test
4. **Test user flows, not implementation details**
5. **Use page objects** for complex interactions

### General

1. **Run tests before committing**
2. **Fix flaky tests immediately**
3. **Keep tests fast** (unit tests < 100ms each)
4. **Review coverage reports regularly**
5. **Update tests when refactoring**

---

## Test Data

### Unit Tests
- Use mocks and fixtures
- No external dependencies
- Deterministic results

### E2E Tests
- Use dedicated test database
- Seed data before tests
- Clean up after tests
- Isolated test runs

**Environment Variables:**
```bash
# Supabase test credentials
SUPABASE_URL=https://your-test-project.supabase.co
SUPABASE_ANON_KEY=your-test-anon-key
SUPABASE_SERVICE_KEY=your-test-service-key
```

---

## Performance Benchmarks

### Unit Tests
- **Target:** < 5 seconds for full suite
- **Current:** ~370ms (transform + execution)

### E2E Tests
- **Target:** < 2 minutes for full suite
- **Current:** TBD (depends on web app implementation)

---

## Resources

### Documentation
- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)
- [Supabase Testing Guide](https://supabase.com/docs/guides/testing)

### Internal Documentation
- `TEST_AUTOMATION_REPORT.md` - Detailed test coverage report
- `TEST_PLAN.md` - Original QA test plan
- `TEST_REPORT.md` - Manual QA test results

---

## Support

For issues or questions:
1. Check this guide first
2. Review test output logs
3. Check GitHub Actions runs (if CI issue)
4. Consult framework documentation

---

**Last Updated:** 2026-02-22
**Version:** 1.0.0
