-- =============================================================================
-- Migration: 013_add_missing_indexes
-- Description: Add missing indexes for cooking_groups, subscriptions, and notifications
-- Author: Hephaestus
-- Created: 2026-04-10
-- =============================================================================

-- Cooking Groups: creator lookup
CREATE INDEX IF NOT EXISTS idx_cooking_groups_creator_id ON cooking_groups(creator_id) WHERE creator_id IS NOT NULL;

-- Cooking Groups: name/description full-text search (GIN trgm)
CREATE INDEX IF NOT EXISTS idx_cooking_groups_name_fts ON cooking_groups USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cooking_groups_description_fts ON cooking_groups USING gin(description gin_trgm_ops);

-- Cooking Group Members: user lookup for "my groups" queries
CREATE INDEX IF NOT EXISTS idx_cooking_group_members_user_id ON cooking_group_members(user_id);

-- Recipe Subscriptions: user and recipe lookups
CREATE INDEX IF NOT EXISTS idx_recipe_subscriptions_user_id ON recipe_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_recipe_subscriptions_recipe_id ON recipe_subscriptions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_subscriptions_user_recipe ON recipe_subscriptions(user_id, recipe_id);

-- Category Subscriptions: user and category lookups
CREATE INDEX IF NOT EXISTS idx_category_subscriptions_user_id ON category_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_category_subscriptions_category ON category_subscriptions(category);

-- Author Subscriptions: user and author_name lookups
CREATE INDEX IF NOT EXISTS idx_author_subscriptions_user_id ON author_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_author_subscriptions_author_name ON author_subscriptions(author_name);

-- Recipe Reviews: recipe pagination optimization (sort by created_at)
CREATE INDEX IF NOT EXISTS idx_recipe_reviews_recipe_created ON recipe_reviews(recipe_id, created_at DESC);

-- Notifications: read status + time ordering (covers both read/unread queries)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, read, created_at DESC);

-- Email Recipe Subscriptions: email lookup for unsubscribe
CREATE INDEX IF NOT EXISTS idx_email_recipe_subscriptions_email ON email_recipe_subscriptions(email);

-- Recipe Tips: recipe lookup for tips retrieval
CREATE INDEX IF NOT EXISTS idx_recipe_tips_recipe_id ON recipe_tips(recipe_id);

-- Analyze tables to update statistics
ANALYZE cooking_groups;
ANALYZE cooking_group_members;
ANALYZE recipe_subscriptions;
ANALYZE category_subscriptions;
ANALYZE author_subscriptions;
ANALYZE recipe_reviews;
ANALYZE notifications;
ANALYZE email_recipe_subscriptions;
ANALYZE recipe_tips;
