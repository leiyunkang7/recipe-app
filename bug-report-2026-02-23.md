# Bug Report: Code Duplication and Unused Imports

## Bug Information

| Field | Value |
|-------|-------|
| **Bug ID** | BUG-2026-02-23-001 |
| **Severity** | Medium |
| **Priority** | Medium |
| **Status** | Open |
| **Classification** | Code Quality / Maintainability Issue |
| **Report Date** | 2026-02-23 |

## Summary

The staged changes introduce new reusable composables (`useNavigation` and `useRecipeLayout`) but fail to utilize them in the page components, resulting in code duplication. Additionally, there are unused imports and variables that trigger linting warnings.

## Affected Files

- `web/app/composables/useNavigation.ts` (New file, not used)
- `web/app/composables/useRecipeLayout.ts` (New file, not used)
- `web/app/composables/useImageUpload.ts` (Unused imports and variables)
- `web/app/pages/index.vue` (Duplicate logic)
- `web/e2e/accessibility.spec.ts` (Misleading character class)

## Environment

- **Operating System**: Linux
- **Node.js Version**: v20.19.33
- **Package Manager**: Bun 1.3.9
- **Framework**: Nuxt 4.3.1
- **Testing Framework**: Vitest 4.0.18, Playwright 1.58.2
- **Linting Tool**: oxlint 1.49.0

## Detailed Description

### Issue 1: Code Duplication in index.vue

**Location**: `web/app/pages/index.vue` (Lines 48-57)

The `index.vue` component implements logic that should be using the new `useRecipeLayout` composable:

```typescript
const leftColumnRecipes = computed(() => {
  return recipes.value.filter((_, i) => i % 2 === 0)
})

const rightColumnRecipes = computed(() => {
  return recipes.value.filter((_, i) => i % 2 === 1)
})

const selectCategory = (name: string) => {
  selectedCategory.value = selectedCategory.value === name ? '' : name
}
```

**Expected Behavior**: The component should import and use the `useRecipeLayout` composable:

```typescript
const { leftColumnRecipes, rightColumnRecipes } = useRecipeLayout(() => recipes.value)
const { selectCategory } = useCategorySelect(
  () => selectedCategory.value,
  (value: string) => { selectedCategory.value = value }
)
```

**Actual Behavior**: The logic is duplicated in the component, making the new composables unused.

### Issue 2: Unused Import in useImageUpload.ts

**Location**: `web/app/composables/useImageUpload.ts` (Line 1)

```typescript
import { createClient } from '@supabase/supabase-js'
```

The `createClient` function is imported but never used in the code. The code uses `$supabase` from Nuxt app context instead.

**Linting Warning**:
```
⚠ eslint(no-unused-vars): Identifier 'createClient' is imported but never used.
```

### Issue 3: Unused Variable in useImageUpload.ts

**Location**: `web/app/composables/useImageUpload.ts` (Line 35)

```typescript
const { data, error: uploadError } = await $supabase.storage
```

The `data` variable is destructured but never used. According to linting rules, unused variables should start with an underscore (`_`).

**Linting Warning**:
```
⚠ eslint(no-unused-vars): Variable 'data' is declared but never used. Unused variables should start with a '_'.
```

### Issue 4: Misleading Character Class in accessibility.spec.ts

**Location**: `web/e2e/accessibility.spec.ts` (Line 34)

```typescript
const hasText = text && text.trim().length > 0 && !text.trim().match(/^[🗑️✏️×]+$/);
```

The regex pattern contains emoji characters that create misleading character classes. The emojis contain combining characters and surrogate pairs that may not work as expected in regex character classes.

**Linting Warnings**:
```
⚠ eslint(no-misleading-character-class): Unexpected combining class in character class.
⚠ eslint(no-misleading-character-class): Unexpected surrogate pair in character class.
```

## Impact Assessment

### Impact on Code Quality
- **Maintainability**: Code duplication makes future changes harder and increases the risk of inconsistencies
- **Readability**: Developers may be confused about which implementation is the "source of truth"
- **Test Coverage**: The new composables have tests but are not actually used in production code

### Impact on Performance
- **Minimal**: The duplicated code does not significantly affect runtime performance
- **Bundle Size**: Slightly increased due to unused composables being included in the bundle

### Impact on User Experience
- **None**: The application functionality works correctly despite these issues
- All 69 E2E tests pass successfully
- All 18 unit tests pass successfully

## Reproduction Steps

1. Navigate to `web/app/pages/index.vue`
2. Observe the `leftColumnRecipes`, `rightColumnRecipes`, and `selectCategory` implementations
3. Compare with `web/app/composables/useRecipeLayout.ts`
4. Notice the duplicate logic
5. Run `bun run lint` to see the warnings

## Expected vs Actual Behavior

### Expected Behavior
- New composables should be imported and used in page components
- No unused imports or variables
- Clean linting output with zero warnings

### Actual Behavior
- Composables exist but are not used
- Logic is duplicated in components
- Linting shows 5 warnings

## Root Cause Analysis

1. **Incomplete Refactoring**: The developer created reusable composables but did not complete the refactoring to use them in the components
2. **Missing Code Review**: The staged changes were not properly reviewed for code duplication
3. **Linting Warnings Ignored**: The linting warnings were present but not addressed before staging

## Recommended Fixes

### Fix 1: Use Composables in index.vue

Replace the duplicate logic in `web/app/pages/index.vue`:

```typescript
// Remove lines 48-57
// Add at the top of the script section:
import { useRecipeLayout, useCategorySelect } from '~/composables/useRecipeLayout'

// Replace the computed properties and selectCategory function with:
const { leftColumnRecipes, rightColumnRecipes } = useRecipeLayout(() => recipes.value)
const { selectCategory } = useCategorySelect(
  () => selectedCategory.value,
  (value: string) => { selectedCategory.value = value }
)
```

### Fix 2: Remove Unused Import

In `web/app/composables/useImageUpload.ts`:

```typescript
// Remove line 1:
// import { createClient } from '@supabase/supabase-js'
```

### Fix 3: Prefix Unused Variable

In `web/app/composables/useImageUpload.ts` (Line 35):

```typescript
const { data: _data, error: uploadError } = await $supabase.storage
```

### Fix 4: Fix Regex Pattern

In `web/e2e/accessibility.spec.ts` (Line 34):

```typescript
// Option 1: Use individual emoji checks
const iconEmojis = ['🗑️', '✏️', '×']
const hasText = text && text.trim().length > 0 && !iconEmojis.includes(text.trim())

// Option 2: Use Unicode escape sequences
const hasText = text && text.trim().length > 0 && !text.trim().match(/^[\u{1F5D1}\u270F\u00D7]+$/u)
```

## Test Results

### Unit Tests (Vitest)
```
✓ app/composables/useNavigation.test.ts (9 tests)
✓ app/composables/useRecipeLayout.test.ts (9 tests)
Test Files  2 passed (2)
     Tests  18 passed (18)
```

### E2E Tests (Playwright)
```
69 passed (5.0m)
```

### Linting Results
```
Found 5 warnings and 0 errors
```

## Additional Notes

- All functional tests pass, indicating the application works correctly
- The issues are primarily code quality and maintainability concerns
- The staged changes include test files for the new composables, which is good practice
- The composables are well-designed and should be used to reduce code duplication

## Attachments

- None

## Related Issues

- None

## References

- [Vitest Documentation](https://vitest.dev/)
- [Nuxt Composables](https://nuxt.com/docs/getting-started/composables)
- [ESLint Rules](https://eslint.org/docs/latest/rules/)

---

**Reported By**: Test Development Engineer
**Reviewed By**: Pending
**Target Fix Version**: Next Release
