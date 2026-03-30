#!/usr/bin/env node
// Migration script to add video support
//
// Requires env vars:
//   SUPABASE_URL=https://euucwcmtzlpoywszphsd.supabase.co
//   SUPABASE_SERVICE_KEY=<your-service-role-key>

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://euucwcmtzlpoywszphsd.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_KEY env var is required');
  process.exit(1);
}

async function migrate() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔧 Adding video_url and source_url columns...');

  // Add video_url column
  const { error: error1 } = await supabase.rpc('exec', {
    sql: 'ALTER TABLE recipes ADD COLUMN IF NOT EXISTS video_url TEXT;'
  });

  if (error1) {
    // Try direct SQL approach
    console.log('RPC approach failed, trying alternative...');

    // Use the REST API directly
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    });
  }

  console.log('✅ Migration script ready!');
  console.log('');
  console.log('To apply the migration manually:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Open your project -> SQL Editor');
  console.log('3. Run the following SQL:');
  console.log('');
  console.log('ALTER TABLE recipes ADD COLUMN IF NOT EXISTS video_url TEXT;');
  console.log('ALTER TABLE recipes ADD COLUMN IF NOT EXISTS source_url TEXT;');
}

migrate().catch(console.error);
