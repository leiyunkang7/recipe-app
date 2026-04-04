# Recipe App - Agent Coding Guidelines

> Guidelines for agentic AI coding assistants operating in this repository.

## Tech Stack

| Component | Tool |
|-----------|------|
| Package Manager | **Bun** (v1.3.9+) |
| Language | TypeScript v6.0.2 (strict mode) |
| Monorepo | Workspace-based (`cli`, `services/*`, `shared/*`, `database`) |
| Database | PostgreSQL (via **drizzle-orm** v0.39.3 + **pg**) |
| Web Framework | Nuxt 4.3.1 + Vue 3.5.28 |
| CLI | Commander.js v11.1.0 |
| Validation | Zod v3.22.4 |
| Testing | Vitest v4.1.2 |
| E2E Testing | Playwright v1.58.2 |
| Styling | TailwindCSS |
| i18n | @nuxtjs/i18n v10.2.3 (en, zh-CN) |
| PWA | @vite-pwa/nuxt v1.1.1 |
| Image | @nuxt/image v2.0.0 |

## Build & Test Commands

### Root Commands (from `/root/code/recipe-app`)
```bash
# Build all workspaces
bun run build

# Build specific workspaces
bun run build:shared      # Build shared/types
bun run build:database    # Build database
bun run build:services    # Build all services
bun run build:cli         # Build CLI

# Development
bun run dev               # Start CLI dev mode
bun run cli               # Run CLI directly

# Testing
bun run test              # Vitest watch mode
bun run test:run          # Vitest run once (single test run)
bun run test:unit         # Vitest with coverage
bun run test:ui           # Vitest UI mode

# Linting
bun run lint              # Run oxlint
```

### Running a Single Test
```bash
# Unit tests - run a specific test file
bun run vitest run shared/types/src/__tests__/schemas.test.ts

# Or from root with vitest directly
bun run vitest run cli/src/__tests__/add.test.ts

# E2E tests - run specific spec
cd web && bunx playwright test e2e/home.spec.ts
```

### Web App Commands (from `/root/code/recipe-app/web`)
```bash
bun run dev               # Start Nuxt dev server (http://localhost:3000)
bun run build             # Build for production
bun run preview           # Preview production build

# Testing
bun run test              # Vitest unit tests
bun run test:ui           # Vitest UI mode
bun run test:coverage     # Vitest with coverage

# E2E Testing
bun run test:e2e          # Run E2E tests
bun run test:e2e:ui       # Run E2E tests with UI
bun run test:e2e:debug    # Run E2E tests in debug mode
bun run test:e2e:install  # Install Playwright browsers

# Linting & Formatting
bun run lint              # Run oxlint + i18n checks
bun run lint:fix          # Fix lint issues
bun run format            # Format with Prettier
bun run format:check      # Check formatting
```

### Database Commands (from `/root/code/recipe-app/database`)
```bash
bun run db:generate       # Generate migrations
bun run db:migrate        # Run migrations
bun run db:push           # Push schema to database
bun run db:studio         # Open Drizzle Studio
```

## Project Structure

```
recipe-app/
├── cli/                          # CLI tool (Commander.js)
│   └── src/
│       ├── commands/             # CLI command implementations (20 files)
│       ├── __tests__/            # CLI unit tests
│       ├── types/                # CLI-specific types
│       ├── config.ts             # Config loader
│       └── index.ts              # Entry point
├── database/                     # Database schema & migrations
│   └── src/
│       └── schema/               # Drizzle ORM schemas
│           ├── recipes.ts        # Core recipe tables
│           ├── i18n.ts           # Translation tables
│           ├── taxonomy.ts       # Categories & cuisines
│           └── favorites.ts      # Auth-dependent tables
├── services/
│   ├── recipe/                   # Recipe CRUD service
│   ├── image/                    # Image upload service
│   ├── search/                   # Search functionality
│   └── video/                    # Video processing service
├── shared/
│   └── types/                    # Shared TypeScript types + Zod schemas
│       └── src/
│           ├── index.ts          # All schemas & types
│           └── __tests__/        # Schema tests
├── web/                          # Nuxt 4 web application
│   ├── app/                      # App directory (Vue 3)
│   │   ├── components/           # Vue components
│   │   ├── pages/                # Public + admin pages
│   │   ├── composables/          # Vue composables
│   │   └── layouts/              # Page layouts
│   ├── server/                   # Server-side API routes
│   │   └── api/                  # API endpoints
│   ├── e2e/                      # Playwright E2E tests (16 files)
│   ├── tests/                    # Vitest unit tests
│   ├── locales/                  # i18n translation files
│   ├── public/                   # Static assets
│   └── assets/                   # CSS & other assets
├── migrations/                   # Database migration files
├── scripts/                      # Utility scripts
├── docs/                         # Documentation (15 files)
└── supabase/                     # Supabase configuration
```

## Code Style Guidelines

### TypeScript
- **Strict mode enabled** in all tsconfig files
- Use explicit types; avoid `any`
- Use `z.infer<typeof Schema>` for type inference from Zod schemas
- Use PascalCase for types and interfaces: `Recipe`, `ServiceResponse`
- Coverage thresholds: 100% for lines, functions, branches, statements

### Imports
- Use absolute paths via aliases:
  ```
  @recipe-app/shared-types
  @recipe-app/database
  @recipe-app/recipe-service
  @recipe-app/image-service
  @recipe-app/search-service
  ```
- Order: external → internal → relative
- Zod schemas imported from `@recipe-app/shared-types`

### Naming Conventions
| Item | Convention | Example |
|------|------------|---------|
| Types/Interfaces | PascalCase | `Recipe`, `ServiceResponse` |
| Functions | camelCase | `createRecipe`, `findById` |
| Variables | camelCase | `recipeId`, `databaseUrl` |
| Constants | UPPER_SNAKE | `DEFAULT_LOCALE`, `SUPPORTED_LOCALES` |
| Enums | PascalCase | `Locale`, `SearchScope` |
| Files | kebab-case | `recipe-service.ts`, `add.test.ts` |

### Error Handling Pattern

All services return `ServiceResponse<T>`:
```typescript
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// Helper functions
function successResponse<T>(data: T): ServiceResponse<T>
function errorResponse<T>(code: string, message: string, details?: unknown): ServiceResponse<T>
```

Example usage:
```typescript
async create(dto: CreateRecipeDTO): Promise<ServiceResponse<Recipe>> {
  try {
    // business logic
    return successResponse(data);
  } catch (error) {
    return errorResponse('DB_ERROR', 'Failed to create recipe', error);
  }
}
```

### Database Snake_case Convention
- TypeScript: camelCase (`prepTimeMinutes`, `cookTimeMinutes`)
- Database: snake_case (`prep_time_minutes`, `cook_time_minutes`)
- Map between them in service layer (see `mapToRecipe()` in recipe service)

### Zod Schema Pattern
```typescript
export const MySchema = z.object({
  field: z.string().min(1, 'Error message'),
  optional: z.string().optional(),
  nested: z.object({
    sub: z.number()
  })
});

export type MyType = z.infer<typeof MySchema>;
```

### JSDoc Comments
Use JSDoc for public methods:
```typescript
/**
 * Create a new recipe with transaction-like rollback
 */
async create(dto: CreateRecipeDTO): Promise<ServiceResponse<Recipe>> {
  // ...
}
```

## Testing Patterns

### Unit Tests (Vitest)
- Location: `**/__tests__/**/*.test.ts`
- Use `describe`, `it`, `expect` from vitest
- Use `safeParse()` for Zod schema testing
- Coverage thresholds: 100% for all metrics
```typescript
import { describe, it, expect } from 'vitest';

describe('MySchema', () => {
  it('should validate valid data', () => {
    const result = MySchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
```

### E2E Tests (Playwright)
- Location: `web/e2e/**/*.spec.ts`
- Run with: `cd web && bunx playwright test`
- UI mode: `cd web && bunx playwright test --ui`
- Debug mode: `cd web && bunx playwright test --debug`

## Validation Rules

### Recipe Required Fields
- `title`: non-empty string
- `category`: non-empty string
- `servings`: positive integer
- `prepTimeMinutes`: non-negative integer
- `cookTimeMinutes`: non-negative integer
- `difficulty`: enum ('easy' | 'medium' | 'hard')
- `ingredients`: array with at least 1 item
- `steps`: array with at least 1 step

### UUID Format
- Database IDs use UUID v4 format
- Zod validation: `z.string().uuid()`

### Supported Locales
- Languages: `en` (English), `zh-CN` (Simplified Chinese)
- Default locale: `zh-CN`
- All translatable content supports multiple locales

## Configuration

### Environment Variables
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/recipe_app
UPLOAD_DIR=./uploads
SITE_URL=http://localhost:3000
```

### CLI Config File
Location: `.credentials/recipe-app-db.txt`

### PWA Configuration
- Theme color: `#f97316` (orange)
- Display: `standalone`
- Orientation: `portrait`
- Icons: 192x192, 512x512

## Git Commit Convention

```
feat: new feature
fix: bug fix
refactor: code refactoring
perf: performance improvement
test: adding tests
docs: documentation
chore: build/tooling changes
style: formatting, missing semicolons
ci: CI/CD changes
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `shared/types/src/index.ts` | All Zod schemas and TypeScript types |
| `database/src/schema/index.ts` | Database schema exports |
| `database/src/schema/recipes.ts` | Core recipe table definitions |
| `database/src/schema/i18n.ts` | Translation tables |
| `services/recipe/src/service.ts` | Recipe CRUD operations |
| `cli/src/config.ts` | Database config loader (DATABASE_URL) |
| `vitest.config.ts` | Root Vitest configuration |
| `web/vitest.config.ts` | Web Vitest configuration |
| `web/nuxt.config.ts` | Nuxt configuration |
| `web/playwright.config.ts` | Playwright E2E test configuration |

## Database Schema Overview

### Core Tables
- `recipes` - Main recipe records
- `recipe_ingredients` - Recipe ingredients
- `recipe_steps` - Recipe cooking steps
- `recipe_tags` - Recipe tags

### i18n Tables
- `recipe_translations` - Recipe title/description translations
- `ingredient_translations` - Ingredient name translations
- `step_translations` - Step instruction translations
- `category_translations` - Category name translations
- `cuisine_translations` - Cuisine name translations

### Taxonomy Tables
- `categories` - Recipe categories
- `cuisines` - Cuisine types

### Auth-Dependent Tables (preserved but disabled)
- `favorites` - User favorites
- `favorite_folders` - Favorite folders
- `recipe_ratings` - Recipe ratings

## Common Tasks

### Adding a New Service
1. Create directory in `services/`
2. Add `package.json` with dependencies
3. Implement service with `ServiceResponse<T>` pattern
4. Export from `index.ts`
5. Update root `vitest.config.ts` aliases

### Adding a New CLI Command
1. Create file in `cli/src/commands/`
2. Implement command with Commander.js
3. Register in `cli/src/index.ts`
4. Add tests in `cli/src/__tests__/`

### Adding a New API Endpoint
1. Create file in `web/server/api/`
2. Use `defineEventHandler()` from Nuxt
3. Return JSON responses
4. Add E2E test in `web/e2e/`

### Adding a New Page
1. Create `.vue` file in `web/app/pages/`
2. Use auto-imports for composables
3. Support both `en` and `zh-CN` locales
4. Add E2E test for the page

## Development Workflow

1. **Start Development**
   ```bash
   # Start web dev server
   cd web && bun run dev
   
   # Or start CLI dev mode
   bun run dev
   ```

2. **Run Tests During Development**
   ```bash
   # Run unit tests in watch mode
   bun run test
   
   # Run specific test file
   bun run vitest run path/to/test.ts
   ```

3. **Build for Production**
   ```bash
   # Build all workspaces
   bun run build
   
   # Build web app
   cd web && bun run build
   ```

4. **Database Changes**
   ```bash
   cd database
   bun run db:generate   # Generate migration
   bun run db:migrate    # Apply migration
   ```

## Notes

- **Package Manager**: Always use `bun` commands, never `npm` or `yarn`
- **Database**: All migrations should be reviewed before applying to production
- **Testing**: Maintain 100% coverage threshold for unit tests
- **i18n**: All user-facing strings must support both locales
- **PWA**: Service worker updates automatically on deployment
