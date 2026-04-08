-- =============================================================================
-- Migration: 007_api_versions
-- Description: Create API versions table for versioned API management
-- Author: Hephaestus
-- Created: 2026-04-07
-- =============================================================================

-- =============================================================================
-- SECTION 1: API Versions Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS api_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version VARCHAR(20) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deprecation_date TIMESTAMPTZ,
  sunset_date TIMESTAMPTZ,
  changelog_url TEXT,
  docs_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_version_format CHECK (version ~ '^[vV]?\d+(\.\d+)?$')
);

CREATE INDEX IF NOT EXISTS idx_api_versions_version ON api_versions(version);
CREATE INDEX IF NOT EXISTS idx_api_versions_active ON api_versions(is_active) WHERE is_active = true;

INSERT INTO api_versions (version, is_active, deprecation_date, changelog_url, docs_url)
VALUES ('v1', true, NULL, '/api/v1/changelog', '/api/v1/docs')
ON CONFLICT (version) DO NOTHING;

CREATE TABLE IF NOT EXISTS api_version_migrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version VARCHAR(20) NOT NULL,
  migration_name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  rollback_sql TEXT,
  UNIQUE(version, migration_name)
);

CREATE INDEX IF NOT EXISTS idx_api_version_migrations_lookup ON api_version_migrations(version, migration_name);

ALTER TABLE api_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_version_migrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view API versions" ON api_versions FOR SELECT USING (true);
CREATE POLICY "Service role can manage API versions" ON api_versions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can manage version migrations" ON api_version_migrations FOR ALL USING (auth.role() = 'service_role');
