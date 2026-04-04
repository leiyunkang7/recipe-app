# Recipe App - Agent Coding Guidelines

> Guidelines for agentic AI coding assistants operating in this repository.

## Tech Stack

| Component | Tool |
|-----------|------|
| Package Manager | **Bun** (v1.3.9+) |
| Language | TypeScript (strict mode) |
| Monorepo | Workspace-based (`cli`, `services/*`, `shared/*`, `database`) |
| Database | PostgreSQL (via **drizzle-orm** + **pg**) |
| Web Framework | Nuxt 4 + Vue 3 |
| CLI | Commander.js |
| Validation | Zod |
| Testing | Vitest |
| E2E Testing | Playwright |
| Styling | TailwindCSS |

## Build & Test Commands

### Root Commands (from `/root/code/recipe-app`)
```bash
# Build all workspaces
bun run build

# Development
bun run dev          # Start CLI dev mode
bun run cli          # Run CLI directly

# Testing
bun run test         # Vitest watch mode
bun run test:run     # Vitest run once (single test run)
bun run test:unit    # Vitest with coverage
bun run test:ui      # Vitest UI mode

# E2E Testing (in web folder)
bun run test:e2e     # Run E2E tests
bun run test:all     # Unit + E2E tests
```

### Running a Single Test
```bash
# Unit tests - run a specific test file
bun run vitest run shared/types/src/__tests__/schemas.test.ts

# Or from root with vitest directly
bun run vitest run src/commands/__tests__/add.test.ts

# E2E tests - run specific spec
cd web && bunx playwright test e2e/home.spec.ts
```

### Web App Commands (from `/root/code/recipe-app/web`)
```bash
pnpm run dev         # Start Nuxt dev server (http://localhost:3000)
pnpm run build       # Build for production
pnpm run preview     # Preview production build
```

## Project Structure

```
recipe-app/
├── cli/                    # CLI tool (Commander.js)
│   └── src/
│       ├── commands/       # CLI command implementations
│       ├── config.ts       # Config loader
│       └── index.ts        # Entry point
├── services/
│   ├── recipe/             # Recipe CRUD service
│   ├── image/              # Image upload service
│   └── search/             # Search functionality
├── shared/
│   └── types/              # Shared TypeScript types + Zod schemas
└── web/                    # Nuxt 3 web application
    ├── pages/              # Public + admin pages
    ├── composables/        # Vue composables
    └── components/         # Vue components
```

## Code Style Guidelines

### TypeScript
- **Strict mode enabled** in all tsconfig files
- Use explicit types; avoid `any`
- Use `z.infer<typeof Schema>` for type inference from Zod schemas
- Use PascalCase for types and interfaces: `Recipe`, `ServiceResponse`

### Imports
- Use absolute paths via aliases:
  ```
  @recipe-app/shared-types
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
    details?: any;
  };
}

// Helper functions
function successResponse<T>(data: T): ServiceResponse<T>
function errorResponse<T>(code: string, message: string, details?: any): ServiceResponse<T>
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

## Validation Rules

### Recipe Required Fields
- `title`: non-empty string
- `category`: non-empty string
- `servings`: positive integer
- `prepTimeMinutes`: non-negative integer
- `cookTimeMinutes`: non-negative integer
- `difficulty`: enum ('easy' | 'medium' | 'hard')
- `ingredients`: array with at least 1 item
- `steps`: array with at least 1 item

### UUID Format
- Database IDs use UUID v4 format
- Zod validation: `z.string().uuid()`

## Configuration

CLI config file: `.credentials/recipe-app-db.txt`
```
DATABASE_URL=postgresql://user:password@localhost:5432/recipe_app
UPLOAD_DIR=./uploads
```

## Git Commit Convention

```
feat: new feature
fix: bug fix
refactor: code refactoring
perf: performance improvement
test: adding tests
docs: documentation
chore: build/tooling changes
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `shared/types/src/index.ts` | All Zod schemas and TypeScript types |
| `services/recipe/src/service.ts` | Recipe CRUD operations |
| `cli/src/config.ts` | Database config loader (DATABASE_URL) |
| `vitest.config.ts` | Root Vitest configuration |
| `web/vitest.config.ts` | Web Vitest configuration |
