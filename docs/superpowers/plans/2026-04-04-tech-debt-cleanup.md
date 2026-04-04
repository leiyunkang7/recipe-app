# Tech Debt Cleanup Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Systematically clean up technical debt across the recipe-app codebase using a file-by-file approach.

**Architecture:** File-by-file complete - fix ALL issues in each file before moving to the next. Tasks are ordered to respect dependencies (foundational types first, then services, then composables).

**Tech Stack:** TypeScript, Nuxt 3, Supabase, Vitest

---

## Chunk 1: Delete Backup Files

**Files:**
- Delete: `RecipeGrid.vue.backup`
- Delete: `useFavorites_backup.ts`
- Delete: `web/app/components/FavoriteButton.vue.orig`
- Delete: `web/app/components/HeroSection.vue.orig`

- [ ] **Step 1: Delete backup files**

```bash
rm -f RecipeGrid.vue.backup
rm -f useFavorites_backup.ts
rm -f web/app/components/FavoriteButton.vue.orig
rm -f web/app/components/HeroSection.vue.orig
```

- [ ] **Step 2: Verify deletions**

```bash
git status
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete leftover backup files from flywheel cycles"
```

---

## Chunk 2: Fix shared/types/src/index.ts

**Files:**
- Modify: `shared/types/src/index.ts:145,156`

- [ ] **Step 1: Read current file to verify line numbers**

Run: `head -160 shared/types/src/index.ts | tail -20`

- [ ] **Step 2: Replace `any` with `unknown` for details fields**

Edit `shared/types/src/index.ts`:
```typescript
// Line 145: Change
details?: any;
// To
details?: unknown;

// Line 156: Change
details?: any
// To
details?: unknown
```

- [ ] **Step 3: Verify build passes**

Run: `cd web && bun run build`

- [ ] **Step 4: Commit**

```bash
git add shared/types/src/index.ts
git commit -m "fix(types): replace any with unknown in ServiceResponse"
```

---

## Chunk 3: Fix services/recipe/src/service.ts

**Files:**
- Modify: `services/recipe/src/service.ts:24-30,235`

**Problems to fix:**
1. Line 27-29: Silent rollback failure - add logging
2. Line 235: `updateData: any` - replace with proper type mapping

- [ ] **Step 1: Read lines 20-40 to verify rollback code**

Run: `sed -n '20,40p' services/recipe/src/service.ts`

- [ ] **Step 2: Fix silent rollback failure**

Edit `services/recipe/src/service.ts` - replace lines 24-30:
```typescript
private async rollbackRecipe(recipeId: string): Promise<void> {
  try {
    await this.client.from('recipes').delete().eq('id', recipeId);
  } catch (error) {
    console.error(`[RecipeService] Rollback failed for recipe ${recipeId}:`, error);
  }
}
```

- [ ] **Step 3: Read lines 225-260 to verify updateData usage**

Run: `sed -n '225,260p' services/recipe/src/service.ts`

- [ ] **Step 4: Replace `any` with proper type mapping for updateData**

Edit `services/recipe/src/service.ts` - replace line 235:
```typescript
const updateData: Record<string, unknown> = {};
if (dto.title !== undefined) updateData.title = dto.title;
if (dto.description !== undefined) updateData.description = dto.description;
if (dto.category !== undefined) updateData.category = dto.category;
if (dto.cuisine !== undefined) updateData.cuisine = dto.cuisine;
if (dto.servings !== undefined) updateData.servings = dto.servings;
if (dto.prepTimeMinutes !== undefined) updateData.prep_time_minutes = dto.prepTimeMinutes;
if (dto.cookTimeMinutes !== undefined) updateData.cook_time_minutes = dto.cookTimeMinutes;
if (dto.difficulty !== undefined) updateData.difficulty = dto.difficulty;
if (dto.imageUrl !== undefined) updateData.image_url = dto.imageUrl;
if (dto.source !== undefined) updateData.source = dto.source;
if (dto.nutritionInfo !== undefined) updateData.nutrition_info = dto.nutritionInfo;
```

- [ ] **Step 5: Verify build passes**

Run: `cd web && bun run build`

- [ ] **Step 6: Commit**

```bash
git add services/recipe/src/service.ts
git commit -m "fix(service): add logging for rollback failures and fix any types"
```

---

## Chunk 4: Verify recipeMapper is single source of truth

**Files:**
- Review: `web/app/utils/recipeMapper.ts`
- Review: `services/recipe/src/service.ts:400-430`

**Context:** The service.ts has its own `mapToRecipe` method (lines 400-430) which duplicates logic from `recipeMapper.ts`. Since the frontend uses `recipeMapper.ts` and the backend service has different database schema (snake_case), we need to verify they handle the same logical fields.

- [ ] **Step 1: Verify both mappings handle the same logical fields**

Read both files and verify they map these fields equivalently:
- id, title, description, category, cuisine
- servings, prepTimeMinutes, cookTimeMinutes, difficulty
- ingredients (name, amount, unit), steps (stepNumber, instruction, durationMinutes)
- tags, nutritionInfo, imageUrl, source
- createdAt, updatedAt

Compare the field mappings:
- service.ts: `data.prep_time_minutes` → `prepTimeMinutes`
- recipeMapper.ts: `data.prep_time_minutes` → `prepTimeMinutes`

Verify both use identical mapping logic for all fields.

- [ ] **Step 2: Document findings**

If both mappings are consistent: No changes needed. The service.ts mapping is for backend use with direct Supabase access, while recipeMapper.ts is for frontend use with API responses. They serve different purposes but produce consistent output.

- [ ] **Step 3: Commit (if any changes made, otherwise skip)**

No changes - this chunk is informational.

---

## Chunk 5: Split useRecipes.ts

**Files:**
- Create: `web/app/composables/useRecipeQueries.ts` (~150 lines)
- Create: `web/app/composables/useRecipeMutations.ts` (~180 lines)
- Modify: `web/app/composables/useRecipes.ts` (~703 → ~40 lines facade)

**Problems:**
- Monolithic composable doing too much (703 lines)
- Silent error handling in some functions

**Split strategy:**
1. Extract `useRecipeQueries.ts` - fetchRecipes, fetchRecipesList, fetchRecipeById, fetchCategoryKeys, fetchCuisineKeys, incrementViews
2. Extract `useRecipeMutations.ts` - createRecipe, updateRecipe, deleteRecipe
3. Keep `useRecipes.ts` as thin facade that combines both and re-exports

- [ ] **Step 0: Consumer audit before refactoring**

Search for all usages of `useRecipes()` to ensure the facade will maintain the same interface:

```bash
grep -r "useRecipes()" web/app --include="*.vue" --include="*.ts" -l
grep -r "\.fetchRecipes\|\.createRecipe\|\.updateRecipe\|\.deleteRecipe" web/app --include="*.vue" --include="*.ts"
```

Verify the returned object shape matches what existing consumers expect. The facade MUST return:
- recipes, recipesList, loading, loadingMore, error, hasMore
- fetchRecipes, fetchRecipesList, fetchRecipeById
- createRecipe, updateRecipe, deleteRecipe
- fetchCategoryKeys, fetchCuisineKeys, incrementViews
- currentLocale

- [ ] **Step 1: Create useRecipeQueries.ts**

Create `web/app/composables/useRecipeQueries.ts` with:
- fetchRecipes (lines 29-134)
- fetchRecipesList (lines 141-238)
- fetchRecipeById (lines 240-288)
- fetchCategoryKeys (lines 657-680)
- fetchCuisineKeys (line 682-683)
- incrementViews (lines 632-653)

- [ ] **Step 2: Create useRecipeMutations.ts**

Create `web/app/composables/useRecipeMutations.ts` with:
- createRecipe (lines 290-441)
- updateRecipe (lines 443-608)
- deleteRecipe (lines 610-629)

- [ ] **Step 3: Refactor useRecipes.ts to thin facade**

Replace contents of `web/app/composables/useRecipes.ts`:
```typescript
import type { Recipe, RecipeFilters, CreateRecipeDTO, Locale, RecipeListItem } from '~/types'

// Re-export everything from sub-composables
export { useRecipeQueries } from './useRecipeQueries'
export { useRecipeMutations } from './useRecipeMutations'

// Thin facade that provides unified interface
export const useRecipes = () => {
  const queries = useRecipeQueries()
  const mutations = useRecipeMutations()

  // Return merged interface
  return {
    // State
    recipes: queries.recipes,
    recipesList: queries.recipesList,
    loading: queries.loading,
    loadingMore: queries.loadingMore,
    error: queries.error,
    hasMore: queries.hasMore,
    currentLocale: queries.currentLocale,

    // Queries
    fetchRecipes: queries.fetchRecipes,
    fetchRecipesList: queries.fetchRecipesList,
    fetchRecipeById: queries.fetchRecipeById,
    fetchCategoryKeys: queries.fetchCategoryKeys,
    fetchCuisineKeys: queries.fetchCuisineKeys,
    incrementViews: queries.incrementViews,

    // Mutations
    createRecipe: mutations.createRecipe,
    updateRecipe: mutations.updateRecipe,
    deleteRecipe: mutations.deleteRecipe,
  }
}
```

- [ ] **Step 4: Verify build passes**

Run: `cd web && bun run build`

- [ ] **Step 5: Commit**

```bash
git add web/app/composables/useRecipeQueries.ts web/app/composables/useRecipeMutations.ts web/app/composables/useRecipes.ts
git commit -m "refactor: split useRecipes.ts into focused composables"
```

---

## Chunk 6: Fix useFavorites.ts error handling

**Files:**
- Modify: `web/app/composables/useFavorites.ts:52,239,245`

**Problems to fix:**
1. Line 52: Silent `return` on error in fetchFavoriteIds
2. Line 239: Silent `return []` on error in fetchFolders
3. Line 245: Hardcoded default color `#F97316`

- [ ] **Step 1: Read lines 45-60 to verify error handling**

Run: `sed -n '45,60p' web/app/composables/useFavorites.ts`

- [ ] **Step 2: Fix fetchFavoriteIds silent error (line 51-53)**

Edit `web/app/composables/useFavorites.ts`:
```typescript
const fetchFavoriteIds = async (userId: string) => {
  const { data, error } = await $supabase
    .from('favorites')
    .select('recipe_id')
    .eq('user_id', userId)

  if (error) {
    console.error('[useFavorites] Failed to fetch favorite IDs:', error)
    return
  }

  favoriteIds.value = new Set((data || []).map((f: { recipe_id: string }) => f.recipe_id))
}
```

- [ ] **Step 3: Read lines 227-245 to verify fetchFolders**

Run: `sed -n '227,245p' web/app/composables/useFavorites.ts`

- [ ] **Step 4: Fix fetchFolders silent error (lines 237-238)**

Edit `web/app/composables/useFavorites.ts`:
```typescript
if (error) {
  console.error('[useFavorites] Failed to fetch folders:', error)
  return []
}
```

- [ ] **Step 5: Extract hardcoded color to constant**

Add after the imports section (after line 3):
```typescript
const DEFAULT_FOLDER_COLOR = '#F97316'
```

Replace line 245:
```typescript
const createFolder = async (name: string, color: string = DEFAULT_FOLDER_COLOR): Promise<FavoriteFolder | null> => {
```

- [ ] **Step 6: Verify build passes**

Run: `cd web && bun run build`

- [ ] **Step 7: Commit**

```bash
git add web/app/composables/useFavorites.ts
git commit -m "fix(useFavorites): add error logging and extract hardcoded color"
```

---

## Chunk 7: Add tests for useRecipeGridVirtualScroll

**Files:**
- Create: `web/app/composables/useRecipeGridVirtualScroll.test.ts`

**Context:** No test file exists for this composable. It uses Nuxt composables (useState, etc.) and browser APIs, so tests need proper mocking.

- [ ] **Step 1: Read the composable to understand its interface**

Run: `cat web/app/composables/useRecipeGridVirtualScroll.ts`

Note the returned interface and dependencies (useState, Ref, etc.)

- [ ] **Step 2: Create test file with proper Nuxt mocking**

Create `web/app/composables/useRecipeGridVirtualScroll.test.ts`:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Nuxt app context
const mockNuxtApp = {
  $supabase: vi.fn(),
}

vi.mock('#app', () => ({
  useNuxtApp: () => mockNuxtApp,
  useState: <T>(key: string, init: () => T) => {
    const state = init()
    return ref(state) as any
  },
  useI18n: () => ({ value: { locale: 'en' } }),
}))

import { useRecipeGridVirtualScroll } from './useRecipeGridVirtualScroll'

describe('useRecipeGridVirtualScroll', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be defined', () => {
    const result = useRecipeGridVirtualScroll()
    expect(result).toBeDefined()
  })

  it('should have required properties', () => {
    const composable = useRecipeGridVirtualScroll()

    expect(composable.items).toBeDefined()
    expect(composable.visibleItems).toBeDefined()
    expect(composable.containerRef).toBeDefined()
    expect(composable.totalHeight).toBeDefined()
    expect(composable.scrollTop).toBeDefined()
    expect(composable.visibleRange).toBeDefined()
    expect(composable.getItemStyle).toBeDefined()
  })

  it('should calculate visible range correctly', () => {
    const { visibleRange, updateVisibleRange } = useRecipeGridVirtualScroll()

    // Simulate scrolling: containerHeight=200, scrollTop=100, itemHeight=150
    updateVisibleRange(100, 200, 150)

    expect(visibleRange.value.start).toBeGreaterThanOrEqual(0)
    expect(visibleRange.value.end).toBeGreaterThan(visibleRange.value.start)
  })

  it('should return valid item styles', () => {
    const { getItemStyle } = useRecipeGridVirtualScroll()

    const style = getItemStyle(0)

    expect(style).toBeDefined()
    expect(style.position).toBe('absolute')
    expect(style.transform).toBeDefined()
  })

  it('should handle empty items', () => {
    const { items, visibleItems, totalHeight } = useRecipeGridVirtualScroll()

    items.value = []

    expect(visibleItems.value).toEqual([])
    expect(totalHeight.value).toBe(0)
  })

  it('should slice items to visible range', () => {
    const { items, visibleItems, updateVisibleRange } = useRecipeGridVirtualScroll()

    // Add 20 mock items
    items.value = Array.from({ length: 20 }, (_, i) => ({ id: String(i), title: `Item ${i}` }))

    // Simulate scroll position
    updateVisibleRange(0, 300, 150) // scrollTop=0, containerHeight=300, itemHeight=150

    expect(visibleItems.value.length).toBeLessThanOrEqual(items.value.length)
  })
})
```

- [ ] **Step 3: Run the test to verify it works**

Run: `cd web && bun run test:run -- --grep "useRecipeGridVirtualScroll"`

If tests fail due to Nuxt context issues, add mocking as needed based on actual composable dependencies.

- [ ] **Step 4: Run all tests to verify no regressions**

Run: `bun run test:run`

- [ ] **Step 5: Commit**

```bash
git add web/app/composables/useRecipeGridVirtualScroll.test.ts
git commit -m "test: add tests for useRecipeGridVirtualScroll composable"
```

---

## Chunk 8: Final Verification

- [ ] **Step 1: Run full build**

Run: `cd web && bun run build`

- [ ] **Step 2: Run all tests**

Run: `bun run test:run`

- [ ] **Step 3: Review git status**

Run: `git status && git log --oneline -5`

- [ ] **Step 4: Final commit if needed**

If any issues found and fixed in previous steps.
