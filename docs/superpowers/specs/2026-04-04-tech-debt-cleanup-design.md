# Tech Debt Cleanup Design

## Context

The recipe-app codebase has accumulated technical debt across multiple categories. A systematic cleanup is needed to improve code quality, type safety, and maintainability. The user has chosen a **file-by-file complete** approach - fix ALL issues in each file before moving to the next.

## Scope

**Included:**
- Delete leftover backup files from flywheel cycles
- Fix type safety issues (`any` → proper types)
- Fix error handling (silent failures)
- Split large composables
- Add missing test coverage
- Remove code duplication

**Excluded:**
- Config files (Supabase config, nuxt.config.ts)

## Approach

File-by-File Complete - for each file, fix ALL identified issues before moving to the next.

---

## Files to Address

### 1. Delete Backup Files (Standalone)

Delete leftover files from previous flywheel cycles:

| File | Action |
|------|--------|
| `RecipeGrid.vue.backup` | Delete |
| `useFavorites_backup.ts` | Delete |
| `web/app/components/FavoriteButton.vue.orig` | Delete |
| `web/app/components/HeroSection.vue.orig` | Delete |

---

### 2. `web/app/composables/useRecipes.ts` (703 lines)

**Problems:**
- Monolithic composable doing too much
- Silent error handling

**Fixes:**
- Split into focused composables:
  - `useRecipeMutations.ts` - createRecipe, updateRecipe, deleteRecipe
  - `useRecipeQueries.ts` - getRecipe, getRecipes, getUserRecipes
  - `useRecipes.ts` - thin facade that imports and re-exports from the above
- Add proper error handling with user-facing error messages

---

### 3. `web/app/composables/useFavorites.ts` (389 lines)

**Problems:**
- Line 52: Silent `return` on error
- Line 239: Silent `return []` on error
- Hardcoded default color `#F97316` on line 245

**Fixes:**
- Add error feedback (throw or return with error state)
- Extract hardcoded color to constant

---

### 4. `services/recipe/src/service.ts`

**Problems:**
- Line 235: `updateData: any` - should use proper type mapping
- Lines 27-29: Silent rollback failure

**Fixes:**
- Replace `any` with proper `UpdateRecipeDTO` mapping
- Add logging for rollback failures (don't silently fail)

---

### 5. `shared/types/src/index.ts`

**Problems:**
- Lines 145, 156: `details?: any` - should be `unknown`

**Fixes:**
- Change `details?: any` to `details?: unknown`

---

### 6. `web/app/utils/recipeMapper.ts`

**Problems:**
- Duplicate mapping logic with `services/recipe/src/service.ts`

**Fixes:**
- Ensure this is the single source of truth
- Update service.ts to use shared mapper or import from here

---

### 7. Test Coverage

**Problems:**
- `useRecipeGridVirtualScroll.ts` has no test file

**Fixes:**
- Add tests for virtual scrolling composable
- Verify all existing tests still pass

---

## Verification

After each file fix:
```bash
cd web && bun run build
```

After all changes:
```bash
bun run test:run
```

---

## File Order

1. Delete backup files
2. Fix `shared/types/src/index.ts` (foundational - other fixes depend on this)
3. Fix `services/recipe/src/service.ts` (type mapping + error handling)
4. Fix `web/app/utils/recipeMapper.ts` (remove duplication)
5. Split `web/app/composables/useRecipes.ts`
6. Fix `web/app/composables/useFavorites.ts`
7. Add tests for `useRecipeGridVirtualScroll.ts`
