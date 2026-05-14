#!/usr/bin/env bash
#===============================================================================
# Jieba Reindex Wrapper - Makes running the reindex script easy
# 
# Usage:
#   ./run-jieba-reindex.sh <DB_PASSWORD>
#
# What it does:
#   1. Constructs DATABASE_URL from your password
#   2. Runs the reindex script with jieba segmentation
#   3. Verifies the results
#
# Prerequisites:
#   - Python packages: pip install jieba psycopg2-binary
#   - DB password from Supabase Dashboard → Settings → Database
#
#===============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Supabase connection details (from .env)
DB_USER="recipe_user"
DB_HOST="db.euucwcmtzlpoywszphsd.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"

main() {
    if [[ $# -eq 0 ]]; then
        echo -e "${RED}❌ Missing DB_PASSWORD argument${NC}"
        echo ""
        echo -e "${YELLOW}Usage:${NC} $0 <DB_PASSWORD>"
        echo ""
        echo -e "${YELLOW}To get your DB_PASSWORD:${NC}"
        echo "  1. Go to https://supabase.com/dashboard/project/euucwcmtzlpoywszphsd/settings/database"
        echo "  2. Under 'Connection string' → 'URI', copy the password"
        echo "  3. Or use the 'Connection pooling' URL"
        echo ""
        echo -e "${YELLOW}Example:${NC}"
        echo "  $0 my-secret-password"
        exit 1
    fi

    DB_PASSWORD="$1"
    DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    
    echo -e "${GREEN}🐾 Jieba Reindex Starting...${NC}"
    echo ""
    echo -e "${YELLOW}Connecting to:${NC} ${DB_HOST}"
    echo -e "${YELLOW}Database:${NC} ${DB_NAME}"
    echo -e "${YELLOW}User:${NC} ${DB_USER}"
    echo ""
    
    # Check Python dependencies
    echo -e "${YELLOW}Checking dependencies...${NC}"
    if ! python3 -c "import jieba" 2>/dev/null; then
        echo -e "${RED}❌ jieba not installed${NC}"
        echo -e "Run: ${GREEN}pip install jieba psycopg2-binary${NC}"
        exit 1
    fi
    if ! python3 -c "import psycopg2" 2>/dev/null; then
        echo -e "${RED}❌ psycopg2 not installed${NC}"
        echo -e "Run: ${GREEN}pip install jieba psycopg2-binary${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Dependencies OK${NC}"
    echo ""
    
    # Run the reindex
    echo -e "${YELLOW}🚀 Running reindex script...${NC}"
    echo ""
    DATABASE_URL="$DATABASE_URL" python3 "${SCRIPT_DIR}/reindex-search-vector.py"
    
    echo ""
    echo -e "${GREEN}✨ Jieba Reindex Complete!${NC}"
    echo ""
    echo -e "${YELLOW}Test search:${NC}"
    echo "  curl 'http://localhost:3000/api/recipes/search?q=国宴'"
    echo "  curl 'http://localhost:3000/api/recipes/search?q=黑芝麻'"
}

main "$@"
