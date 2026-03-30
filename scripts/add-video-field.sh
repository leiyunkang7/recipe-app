#!/bin/bash
# Migration script to add video support to recipes table
# Run: bash scripts/add-video-field.sh
#
# Requires env vars:
#   SUPABASE_URL=https://euucwcmtzlpoywszphsd.supabase.co
#   SUPABASE_SERVICE_KEY=<your-service-role-key>

set -euo pipefail

SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY}"

echo "🔧 Adding video_url and source_url columns to recipes table..."

SQL="
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_url TEXT;
"

response=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "{\"query\": \"$(echo "$SQL" | tr '\n' ' ')\"}")

echo "Response: $response"
echo "✅ Migration complete!"
