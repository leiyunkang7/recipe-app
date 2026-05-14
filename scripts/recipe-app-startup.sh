#!/usr/bin/env bash
# ============================================
# recipe-app Startup Script
# Fixes Docker BuildKit registry mirror issue
# ============================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
WEB_DIR="$APP_DIR/web"
ENV_FILE="$WEB_DIR/.env"

echo "🐾 recipe-app Startup Script"
echo "============================"

# Step 1: Check if .env exists and has real values
echo ""
echo "📋 Checking environment configuration..."

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env file not found at $ENV_FILE"
    echo "   Copy .env.example to .env and fill in the values"
    exit 1
fi

# Load env vars from .env file
set -a
source "$ENV_FILE"
set +a

# Validate required variables
MISSING=""
[ -z "$DATABASE_URL" ] && MISSING="$MISSING DATABASE_URL"
[ -z "$SUPABASE_URL" ] && MISSING="$MISSING SUPABASE_URL"
[ -z "$SUPABASE_SERVICE_KEY" ] && MISSING="$MISSING SUPABASE_SERVICE_KEY"
[ -z "$SUPABASE_ANON_KEY" ] && MISSING="$MISSING SUPABASE_ANON_KEY"

if [ -n "$MISSING" ]; then
    echo "❌ Missing required environment variables:$MISSING"
    echo ""
    echo "   Please update $ENV_FILE with real values:"
    echo "   - SUPABASE_URL (found: ${SUPABASE_URL:-NOT SET})"
    echo "   - SUPABASE_ANON_KEY (found: ${SUPABASE_ANON_KEY:0:10}... if set)"
    echo "   - SUPABASE_SERVICE_KEY (found: ${SUPABASE_SERVICE_KEY:0:10}... if set)"
    echo "   - DATABASE_URL (found: ${DATABASE_URL:-NOT SET})"
    echo ""
    echo "   For local Supabase, use:"
    echo "   DATABASE_URL=postgresql://recipe_user:recipe_password@localhost:5432/recipe_app"
    exit 1
fi

# Check for placeholder values
if [[ "$SUPABASE_ANON_KEY" == YOUR_* ]] || [[ "$SUPABASE_SERVICE_KEY" == YOUR_* ]]; then
    echo "⚠️  WARNING: .env contains placeholder values (YOUR_...)"
    echo "   Please update with real Supabase credentials"
    echo ""
fi

echo "✅ Environment variables loaded"

# Step 2: Stop any existing containers
echo ""
echo "🛑 Stopping existing containers..."
cd "$WEB_DIR"
docker compose down 2>/dev/null || true

# Step 3: Build with Legacy Builder (DOCKER_BUILDKIT=0)
# This works because the oven/bun image exists locally
# and BuildKit's registry mirror (docker.1ms.run) can't find it
echo ""
echo "🔨 Building with Legacy Builder (DOCKER_BUILDKIT=0)..."
echo "   This bypasses the BuildKit registry mirror issue"

DOCKER_BUILDKIT=0 docker compose build

echo "✅ Build successful!"

# Step 4: Start the container
echo ""
echo "🚀 Starting recipe-app..."
docker compose up -d

# Wait a moment for container to start
sleep 3

# Step 5: Check health
echo ""
echo "🏥 Health check..."
if curl -s -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ recipe-app is healthy at http://localhost:3000"
else
    echo "⚠️  Container started but health check failed"
    echo "   Check logs with: docker compose logs web"
fi

echo ""
echo "📝 Useful commands:"
echo "   docker compose logs -f    # View logs"
echo "   docker compose down       # Stop"
echo "   docker compose restart    # Restart"
