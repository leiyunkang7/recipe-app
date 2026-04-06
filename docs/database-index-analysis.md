# Database Query Analysis and Index Optimization Report

## Overview

This document analyzes the query patterns in the recipe-app database and documents the index optimizations implemented.

## Query Pattern Analysis

### RecipeService.findAll() - Main Search Query

**Location:** `services/recipe/src/service.ts`

**Filters Applied:**
- `category` - exact match (eq)
- `cuisine` - exact match (eq)
- `difficulty` - exact match (eq)
- `maxPrepTime` - range match (lte)
- `maxCookTime` - range match (lte)
- `search` - ILIKE pattern match on title and description

**Query Structure:**
```sql
SELECT * FROM recipes 
WHERE category = $1 
  AND cuisine = $2 
  AND difficulty = $3 
  AND prep_time_minutes <= $4 
  AND cook_time_minutes <= $5 
  AND (title ILIKE $6 OR description ILIKE $6)
ORDER BY created_at DESC
LIMIT $7 OFFSET $8
```

**Performance Issues Identified:**

1. **Missing range indexes** - `prep_time_minutes` and `cook_time_minutes` had no indexes for `<=` queries
2. **No text search optimization** - `title` and `description` had no trigram indexes for ILIKE
3. **No composite indexes** - Common filter combinations weren't indexed together

### RecipeService.mapToRecipe() - N+1 Query Problem

**Location:** `services/recipe/src/service.ts` lines 330-348

**Issue:** Fetches ingredients, steps, and tags in 3 separate queries per recipe.

```sql
SELECT * FROM recipe_ingredients WHERE recipe_id = $1;
SELECT * FROM recipe_steps WHERE recipe_id = $1;
SELECT * FROM recipe_tags WHERE recipe_id = $1;
```

**Impact:** When listing 20 recipes, this results in 1 + (20 * 3) = 61 queries instead of potentially 4.

## Index Optimizations Implemented

### New Indexes Added

| Index Name | Column(s) | Type | Purpose |
|------------|-----------|------|---------|
| `idx_recipes_prep_time` | `prep_time_minutes` | B-tree | Range queries for maxPrepTime filter |
| `idx_recipes_cook_time` | `cook_time_minutes` | B-tree | Range queries for maxCookTime filter |
| `idx_recipes_total_time` | `prep_time_minutes + cook_time_minutes` | B-tree | Combined time filtering |
| `idx_recipes_title_trgm` | `title` | GIN trgm | Text search with ILIKE |
| `idx_recipes_description_trgm` | `description` | GIN trgm | Text search with ILIKE |
| `idx_recipes_category_difficulty` | `category, difficulty` | B-tree | Combined filter optimization |
| `idx_recipes_category_cuisine` | `category, cuisine` | B-tree | Combined filter optimization |
| `idx_recipes_category_created` | `category, created_at DESC` | B-tree | Category listing with sorting |
| `idx_recipes_cuisine_difficulty` | `cuisine, difficulty` | B-tree | Combined filter optimization |
| `idx_recipes_difficulty_created` | `difficulty, created_at DESC` | B-tree | Difficulty listing with sorting |
| `idx_recipes_views` | `views DESC` | B-tree | Popular recipes sorting |
| `idx_recipe_translations_locale_recipe` | `locale, recipe_id` | B-tree | i18n lookup optimization |
| `idx_ingredient_translations_locale_ingredient` | `locale, ingredient_id` | B-tree | i18n lookup optimization |
| `idx_step_translations_locale_step` | `locale, step_id` | B-tree | i18n lookup optimization |

## Query Execution Improvements

### Before Optimization

| Query Type | Estimated Cost |
|------------|----------------|
| Filter by `maxPrepTime` | Sequential scan (~100% of table) |
| Search with `ILIKE` on title | Sequential scan (~100% of table) |
| Filter by `category + difficulty` | Two separate index lookups + merge |

### After Optimization

| Query Type | Index Used | Estimated Cost |
|------------|-----------|----------------|
| Filter by `maxPrepTime` | `idx_recipes_prep_time` | Index range scan (<5% of table) |
| Search with `ILIKE` on title | `idx_recipes_title_trgm` | GIN index scan (<10% of table) |
| Filter by `category + difficulty` | `idx_recipes_category_difficulty` | Single index range scan |

## Estimated Performance Impact

- **Search queries:** 50-70% reduction in query time
- **Filtered listings:** 30-50% reduction in query time
- **Index storage overhead:** ~500KB - 1MB additional disk space

## Future Optimization Opportunities

### 1. N+1 Query Resolution for mapToRecipe()

Consider refactoring to use a single JOIN query:

```sql
SELECT 
  r.*,
  ri.name as ingredient_name,
  ri.amount as ingredient_amount,
  rs.step_number,
  rs.instruction,
  rt.tag
FROM recipes r
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN recipe_steps rs ON r.id = rs.recipe_id
LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
WHERE r.id = $1
ORDER BY rs.step_number;
```

### 2. Materialized View for Recipe Listings

For frequently accessed recipe summaries, consider a materialized view:

```sql
CREATE MATERIALIZED VIEW recipe_listing AS
SELECT 
  r.id,
  r.category,
  r.cuisine,
  r.difficulty,
  r.prep_time_minutes,
  r.cook_time_minutes,
  r.image_url,
  r.views,
  r.created_at,
  rt.title,
  COUNT(DISTINCT ri.id) as ingredient_count,
  COUNT(DISTINCT rs.id) as step_count,
  COUNT(DISTINCT rt.id) as tag_count
FROM recipes r
LEFT JOIN recipe_translations rt ON r.id = rt.recipe_id AND rt.locale = 'en'
LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
LEFT JOIN recipe_steps rs ON r.id = rs.recipe_id
LEFT JOIN recipe_tags rt ON r.id = rt.recipe_id
GROUP BY r.id, rt.title;

CREATE UNIQUE INDEX ON recipe_listing(id);
CREATE INDEX ON recipe_listing(category, created_at DESC);
```

## Migration File

The index optimizations are implemented in:
`database/migrations/004_optimize_indexes.sql`

To apply these changes to an existing database:

```bash
# Run the migration
psql $DATABASE_URL -f database/migrations/004_optimize_indexes.sql

# Or if using Drizzle
bun run db:push
# Or
bun run migrate
```
