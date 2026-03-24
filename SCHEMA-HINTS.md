# Recipe App - Database Schema Hints (for AI agents)

> ⚠️ CRITICAL: This file contains verified schema information to prevent repeated bugs.
> Last updated: 2026-03-24 by 爪爪 🐾

## Verified Schema Facts

### ✅ Recipes Table (primary table)
- `recipes.id` - UUID
- `recipes.title` - **Chinese title directly** (no translation table needed)
- `recipes.description` - Chinese description
- `recipes.category` - **Chinese category name directly** (e.g., "川菜", "家常菜")
- `recipes.cuisine` - **Chinese cuisine name directly** (e.g., "四川", "广东")
- `recipes.servings`, `prepTimeMinutes`, `cookTimeMinutes`, `difficulty`
- `recipes.ingredients` - JSON array (stored with recipe)
- `recipes.steps` - JSON array (stored with recipe)
- `recipes.imageUrl`, `source`, `tags`, `nutritionInfo`

### ❌ DO NOT USE - Non-existent Tables
- **`recipe_translations`** - **DOES NOT EXIST** in the database
  - All previous attempts to join/use this table have failed
  - Use `recipes.title` directly (Chinese)
  - The app handles i18n via `web/locales/*.json` files, NOT DB tables

### ❓ Unverified / Use with Caution
- `ingredient_translations`, `step_translations` - unclear if these exist
  - If using, verify the table exists first
  - The safer pattern is to use ingredients/steps directly from recipe JSON

## i18n Architecture

The app uses **file-based i18n**, NOT database translation tables:

```
web/locales/
├── zh-CN.json   # Chinese translations
└── en.json      # English translations
```

Translation keys are defined in these files, not in database tables.

## Common Bug Patterns to Avoid

### Bug 1: recipe_translations join
```typescript
// ❌ WRONG - table doesn't exist
supabase.from('recipes').select('*, recipe_translations(*)')

// ✅ CORRECT - use title directly
supabase.from('recipes').select('*')
```

### Bug 2: Category/Cuisine English names lookup
```typescript
// ❌ WRONG - categories/cuisines are stored in Chinese, not English
supabase.from('categories').select('name_en').eq('name_zh', category)

// ✅ CORRECT - use Chinese values from recipes table directly
const categories = [...new Set(recipes.map(r => r.category))]
```

### Bug 3: Translation filter hiding all recipes
```typescript
// ❌ WRONG - recipe_translations!inner causes empty result when no translations exist
supabase.from('recipes').select('*, recipe_translations!inner(*)')

// ✅ CORRECT - use left join or no join, filter client-side
supabase.from('recipes').select('*')  // Get all, filter in JS if needed
```

## Verified Working Patterns

### Fetch all recipes (working)
```typescript
const { data, error } = await supabase
  .from('recipes')
  .select('*')
```

### Fetch single recipe (working)
```typescript
const { data, error } = await supabase
  .from('recipes')
  .select('*')
  .eq('id', recipeId)
  .single()
```

### Get unique categories (working)
```typescript
// Categories are stored as Chinese strings in recipes.category
const categories = [...new Set(allRecipes.map(r => r.category))]
```

## Testing New DB Queries

Before committing DB query changes:
1. Test in Supabase SQL Editor first
2. Verify table exists: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
3. Check for null safety

---

*Built by 爪爪 🐾 to prevent the iterator from hitting the same i18n bugs 3 times per week.*
