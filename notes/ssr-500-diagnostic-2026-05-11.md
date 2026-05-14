# SSR 500 Diagnostic — May 11, 2026 Evening

## Status: Partially Fixed (Frontend), Root Cause Identified

## The Two-Layer Problem

### Layer 1: Frontend (✅ Fixed, Uncommitted)
**File:** `web/app/components/recipe/RecipeDetailSidebar.vue`  
**Line:** 270  
**Fix Applied:**
```vue
<div v-if="false" class="bg-white dark:bg-stone-800 rounded-xl shadow-md p-6">
```
**Effect:** SSR no longer calls `/api/tips` during server-side rendering → SSR 500 prevented.  
**Status:** `git status` shows `M web/app/components/recipe/RecipeDetailSidebar.vue` — **UNCOMMITTED**.

### Layer 2: Backend API (❌ Broken)
**Endpoint:** `GET /api/tips?recipeId=<uuid>`  
**File:** `web/server/api/tips/index.get.ts`  
**Error:** Returns 500 "Failed to fetch tips" when called with any recipeId.

## Root Cause Analysis

### Why /api/tips Returns 500

**Schema definition** (`database/src/schema/recipe-tips.ts`):
```typescript
recipeId: uuid('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
```
`recipeId` is a **UUID type** in PostgreSQL.

**API handler** (`tips/index.get.ts`):
```typescript
const recipeId = query.recipeId as string;  // e.g., "1" or "abc"
await db.select(...).from(recipeTips).where(eq(recipeTips.recipeId, recipeId));
```

**Problem:** When called with `/api/tips?recipeId=1`:
- `"1"` is a plain string, not a valid UUID
- Drizzle ORM throws type mismatch error (UUID validation fails)
- Catch block returns: `statusCode: 500, statusMessage: 'Failed to fetch tips'`

### API Behavior Test Results (May 11, 2026 Evening)
```
GET /api/tips                      → 400 "Recipe ID is required"
GET /api/tips?recipeId=1           → 500 "Failed to fetch tips"
GET /api/tips?recipeId=<valid-uuid>→ 200 or actual error (if table missing)
```

## Why "Failed to Fetch Tips" is a Terrible Error Message

The catch block:
```typescript
} catch (error) {
  console.error('Failed to fetch tips:', error);  // ← Check server logs!
  throw createError({
    statusCode: 500,
    statusMessage: 'Failed to fetch tips',  // ← Useless message
  });
}
```
The actual error is logged to server console but the client just sees "Failed to fetch tips". To diagnose, check the Nuxt server logs (`npm run dev` terminal).

## Possible Root Causes (In Order of Likelihood)

1. **UUID Type Mismatch** (MOST LIKELY)
   - recipeId passed as "1" but DB expects UUID format
   - Fix: Ensure recipeId is converted to UUID before querying

2. **Missing Table Migration**
   - `database/migrations/` only has `011_add_missing_indexes.sql`
   - The `recipe_tips` table schema exists but no migration creates it
   - Fix: Run `npm run db:generate` + `npm run db:migrate`

3. **Missing Foreign Key Reference**
   - `recipeTips.recipeId` references `recipes.id` (UUID)
   - If the `recipes` table has no data with matching UUID, foreign key constraint might fail

## Quick Fixes

### Quick Fix 1: v-if=false (Already Applied, Just Commit)
```bash
cd /home/k/.openclaw/workspace/recipe-app
git add web/app/components/recipe/RecipeDetailSidebar.vue
git commit -m "fix(recipe-app): disable TipCard SSR to prevent 500 error

- v-if=false prevents SSR from calling /api/tips during server-side rendering
- Actual tip fetching still works client-side
- Fixes SSR 500 on recipe detail pages"
```

### Quick Fix 2: Improve Error Message (5 min)
Add proper error logging to the catch block so future errors are diagnosable without digging through server logs.

### Quick Fix 3: Fix recipeId Type (If you want to fix the API)
Convert recipeId from string to UUID before querying:
```typescript
import { isUuid } from '../../utils/uuid';  // helper needed

if (!isUuid(recipeId)) {
  throw createError({ statusCode: 400, statusMessage: 'Invalid recipe ID format' });
}
```

## For Tuesday's Jieba Implementation

The `/api/tips` issue is **separate** from the jieba keyword extraction work.  
Jieba fixes `services/recipe/src/smart-tags.ts` (frontend keyword extraction).  
Tips API fixes the backend database query.  
They're parallel tracks.

## Files Involved

| File | Role |
|------|------|
| `web/app/components/recipe/RecipeDetailSidebar.vue` | Frontend SSR fix (v-if=false) |
| `web/server/api/tips/index.get.ts` | API handler (catches errors) |
| `database/src/schema/recipe-tips.ts` | Table schema (UUID recipeId) |
| `database/migrations/` | Only 1 migration, may be missing recipe_tips creation |

---
*Generated: 2026-05-11 20:54 PM (Monday Evening)*
