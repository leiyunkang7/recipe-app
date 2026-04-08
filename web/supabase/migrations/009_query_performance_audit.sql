-- =============================================================================
-- Migration: 009_query_performance_audit
-- Description: Add query performance analysis views and missing index recommendations
-- Author: Hephaestus
-- Created: 2026-04-09
-- =============================================================================

-- =============================================================================
-- SECTION 1: Index Usage Statistics View
-- =============================================================================

CREATE OR REPLACE VIEW index_usage_stats AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- =============================================================================
-- SECTION 2: Missing Index Recommendations
-- =============================================================================

CREATE OR REPLACE VIEW missing_index_recommendations AS
SELECT
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  seq_scan - idx_scan AS seq_scan_delta,
  pg_size_pretty(
    pg_relation_size((schemaname || '.' || tablename)::regclass)
  ) AS table_size,
  'Consider adding index on ' || tablename ||
  ' if seq_scan is high and queries filter/sort this table' AS recommendation
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan * 10
  AND seq_scan > 100
  AND schemaname = 'public'
ORDER BY seq_scan DESC;

-- =============================================================================
-- SECTION 3: Table Bloat Analysis
-- =============================================================================

CREATE OR REPLACE VIEW table_bloat_analysis AS
SELECT
  schemaname,
  tablename,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_live_tup,
  n_dead_tup,
  CASE WHEN n_live_tup > 0
    THEN round((n_dead_tup::numeric / n_live_tup) * 100, 2)
    ELSE 0
  END AS dead_tuple_pct,
  last_vacuum,
  last_autovacuum,
  last_analyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND (n_dead_tup > 100 OR n_live_tup = 0)
ORDER BY n_dead_tup DESC;

-- =============================================================================
-- SECTION 4: Slow Query Detection
-- =============================================================================

CREATE OR REPLACE VIEW query_statistics AS
SELECT
  LEFT(query, 100) AS query_preview,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  min_exec_time,
  stddev_exec_time,
  rows
FROM pg_stat_statements
WHERE query LIKE '%recipes%'
   OR query LIKE '%recipe_ingredients%'
   OR query LIKE '%recipe_steps%'
   OR query LIKE '%recipe_tags%'
ORDER BY total_exec_time DESC
LIMIT 50;

-- =============================================================================
-- SECTION 5: Composite Index Candidates
-- =============================================================================

CREATE OR REPLACE VIEW composite_index_candidates AS
SELECT
  tablename,
  array_agg(column_name ORDER BY usage_count DESC) AS frequently_filtered_columns,
  'CREATE INDEX idx_' || tablename || '_composite ON ' || tablename ||
  '(' || string_agg(column_name, ', ') || ');' AS suggested_index_ddl,
  'Composite index for multi-column filtering' AS purpose
FROM (
  SELECT
    'recipes' AS tablename,
    unnest(ARRAY['category', 'difficulty', 'created_at', 'cuisine']) AS column_name,
    1 AS usage_count
  UNION ALL
  SELECT 'recipe_ingredients', 'recipe_id', 1
  UNION ALL
  SELECT 'recipe_steps', 'recipe_id', 1
  UNION ALL
  SELECT 'recipe_tags', 'recipe_id', 1
) combined
GROUP BY tablename;

-- =============================================================================
-- SECTION 6: Index Coverage Analysis
-- =============================================================================

CREATE OR REPLACE VIEW index_coverage_analysis AS
SELECT
  tablename,
  indexname,
  indexdef,
  CASE
    WHEN indexdef LIKE '%INCLUDE%' THEN 'Covering Index'
    WHEN indexdef LIKE '%CREATE INDEX%' THEN 'Standard Index'
    ELSE 'Other'
  END AS index_type,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_indexes
WHERE schemaname = 'public'
  AND (
    tablename IN ('recipes', 'recipe_ingredients', 'recipe_steps', 'recipe_tags')
    OR indexname LIKE 'idx_recipes_%'
    OR indexname LIKE 'idx_recipe_%'
  )
ORDER BY tablename, indexname;

-- =============================================================================
-- SECTION 7: Query Pattern Analysis Helper
-- =============================================================================

CREATE OR REPLACE FUNCTION get_table_optimization_recommendations(p_table_name TEXT)
RETURNS TABLE (
  recommendation TEXT,
  priority TEXT,
  details TEXT
)
AS $$
BEGIN
  RETURN QUERY
  SELECT
    'Sequential scan detected: ' || seq_scan || ' times' AS recommendation,
    'HIGH' AS priority,
    'Table ' || p_table_name || ' has high sequential scan count. Consider adding indexes.' AS details
  FROM pg_stat_user_tables
  WHERE tablename = p_table_name
    AND seq_scan > 100;

  RETURN QUERY
  SELECT
    'Dead tuples: ' || n_dead_tup AS recommendation,
    'MEDIUM' AS priority,
    'Run VACUUM ANALYZE on ' || p_table_name AS details
  FROM pg_stat_user_tables
  WHERE tablename = p_table_name
    AND n_dead_tup > 100;

  RETURN QUERY
  SELECT
    'Table size: ' || pg_size_pretty(
      pg_relation_size((schemaname || '.' || tablename)::regclass)
    ) AS recommendation,
    'LOW' AS priority,
    'Monitor table growth for ' || p_table_name AS details
  FROM pg_stat_user_tables
  WHERE tablename = p_table_name;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SECTION 8: Full Index List with Purpose
-- =============================================================================

CREATE OR REPLACE VIEW index_purpose_catalog AS
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef,
  CASE
    WHEN indexname = 'idx_recipes_category' THEN 'Category filtering'
    WHEN indexname = 'idx_recipes_cuisine' THEN 'Cuisine filtering'
    WHEN indexname = 'idx_recipes_difficulty' THEN 'Difficulty filtering'
    WHEN indexname = 'idx_recipes_created_at' THEN 'Sort by creation date'
    WHEN indexname = 'idx_recipes_category_created' THEN 'Category filter + date sort'
    WHEN indexname = 'idx_recipes_cuisine_created' THEN 'Cuisine filter + date sort'
    WHEN indexname = 'idx_recipes_title_trgm' THEN 'Title search (ILIKE)'
    WHEN indexname = 'idx_recipes_description_trgm' THEN 'Description search (ILIKE)'
    WHEN indexname = 'idx_recipes_total_time' THEN 'Total time filtering'
    WHEN indexname = 'idx_recipes_prep_time_asc' THEN 'Prep time sorting'
    WHEN indexname = 'idx_recipes_nutrition_info' THEN 'Nutrition JSONB queries'
    WHEN indexname = 'idx_recipes_difficulty_created' THEN 'Difficulty + date sort'
    WHEN indexname = 'idx_recipes_author_created' THEN 'Author recipes + date sort'
    WHEN indexname = 'idx_recipes_category_difficulty_created' THEN 'Multi-filter + date sort'
    WHEN indexname = 'idx_recipes_views_desc' THEN 'Popularity sorting'
    WHEN indexname = 'idx_recipes_cuisine_difficulty_created' THEN 'Cuisine + difficulty + date sort'
    WHEN indexname = 'idx_recipe_ingredients_name_trgm' THEN 'Ingredient name search'
    WHEN indexname = 'idx_recipe_ingredients_recipe_id' THEN 'Recipe ingredient lookup'
    WHEN indexname = 'idx_recipe_ingredients_recipe_id_covering' THEN 'Covering index for ingredient queries'
    WHEN indexname = 'idx_recipe_steps_recipe_id' THEN 'Recipe steps lookup'
    WHEN indexname = 'idx_recipe_steps_recipe_id_covering' THEN 'Covering index for step queries'
    WHEN indexname = 'idx_recipe_tags_tag_trgm' THEN 'Tag search'
    WHEN indexname = 'idx_recipe_tags_recipe_id' THEN 'Recipe tags lookup'
    WHEN indexname = 'idx_recipe_tags_recipe_id_covering' THEN 'Covering index for tag queries'
    WHEN indexname = 'idx_recipe_ratings_recipe_id' THEN 'Rating lookup by recipe'
    WHEN indexname = 'idx_recipe_ratings_user_id' THEN 'Rating lookup by user'
    WHEN indexname = 'idx_recipe_ratings_recipe_score' THEN 'Rating aggregation'
    WHEN indexname = 'idx_recipe_ratings_recipe_user' THEN 'User rating check'
    WHEN indexname = 'idx_favorites_user_id' THEN 'User favorites lookup'
    WHEN indexname = 'idx_favorites_recipe_id' THEN 'Recipe favorites lookup'
    WHEN indexname = 'idx_favorites_user_recipe' THEN 'User + recipe composite'
    WHEN indexname = 'idx_favorites_user_created' THEN 'User favorites with time order'
    WHEN indexname = 'idx_recipe_translations_recipe_id' THEN 'Recipe translation lookup'
    WHEN indexname = 'idx_recipe_translations_locale' THEN 'Locale filtering'
    WHEN indexname = 'idx_recipe_translations_recipe_locale' THEN 'Recipe + locale composite'
    WHEN indexname = 'idx_recipe_translations_title_trgm' THEN 'Translation title search'
    WHEN indexname = 'idx_recipe_translations_recipe_id_covering' THEN 'Covering index for translations'
    WHEN indexname = 'idx_notifications_user_created' THEN 'User notifications with time order'
    ELSE 'General purpose'
  END AS purpose,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
