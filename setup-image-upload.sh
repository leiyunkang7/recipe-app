#!/bin/bash

# Supabase Image Upload Test Script
# This script helps you set up and test image upload to Supabase Storage

set -e

echo "🚀 Supabase Image Upload Setup"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Please install it first:"
    echo "  brew install supabase/tap/supabase  # macOS"
    echo "  or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"

# Check if we're in the recipe-app directory
if [ ! -f "package.json" ] || [ ! -d "web" ]; then
    echo -e "${RED}❌ Not in recipe-app directory${NC}"
    echo "Please run this script from /root/code/recipe-app"
    exit 1
fi

echo -e "${GREEN}✅ In recipe-app directory${NC}"

echo ""
echo "📋 Setup Steps:"
echo "==============="
echo ""

# Step 1: Start Supabase locally
echo -e "${YELLOW}Step 1: Start local Supabase${NC}"
echo "   Run: supabase start"
echo ""

# Step 2: Create storage bucket
echo -e "${YELLOW}Step 2: Create storage bucket${NC}"
echo "   Run: supabase storage create recipe-images --public"
echo ""

# Step 3: Apply RLS policies
echo -e "${YELLOW}Step 3: Apply RLS policies${NC}"
echo "   Open Supabase Studio: http://localhost:54323"
echo "   Go to SQL Editor and run:"
echo ""
cat << 'EOF'
-- Allow anonymous uploads
CREATE POLICY "Allow anonymous uploads" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'recipe-images');

-- Allow public read
CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'recipe-images');

-- Allow anonymous delete (optional)
CREATE POLICY "Allow anonymous delete" ON storage.objects
  FOR DELETE TO anon
  USING (bucket_id = 'recipe-images');
EOF
echo ""

# Step 4: Update environment variables
echo -e "${YELLOW}Step 4: Update environment variables${NC}"
echo "   Edit web/.env.local:"
echo ""
echo "   SUPABASE_URL=http://localhost:54321"
echo "   SUPABASE_ANON_KEY=YOUR_LOCAL_ANON_KEY"
echo ""

# Step 5: Test upload
echo -e "${YELLOW}Step 5: Test upload${NC}"
echo "   Go to http://localhost:3000"
echo "   Try uploading an image in the recipe form"
echo ""

echo "================================"
echo "💡 Tips:"
echo "================================"
echo ""
echo "1. Get your local anon key:"
echo "   supabase status"
echo ""
echo "2. View storage in Studio:"
echo "   http://localhost:54323/project/default/storage/buckets"
echo ""
echo "3. If upload fails, check RLS policies:"
echo "   http://localhost:54323/project/default/auth/policies"
echo ""
echo "================================"
echo ""
echo -e "${GREEN}🎉 Setup guide complete!${NC}"
echo ""
echo "Ready to start? Run:"
echo "  cd /root/code/recipe-app"
echo "  supabase start"
