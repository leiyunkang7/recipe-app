#!/bin/bash
# Deploy Supabase Edge Functions

echo "Deploying Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "Supabase CLI could not be found. Please install it first."
    echo "Visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Deploy functions
echo "Deploying send-category-notification function..."
supabase functions deploy send-category-notification

echo "Deploying send-author-notification function..."
supabase functions deploy send-author-notification

echo "Functions deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Set up the database triggers to call these functions"
echo "2. Configure environment variables for email service"
echo "3. Test the subscription functionality"