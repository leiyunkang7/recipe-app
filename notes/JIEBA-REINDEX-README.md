# Jieba Reindex - One-Step Execution Guide

## What This Does
Re-indexes all recipe search vectors using jieba Chinese word segmentation.
Fixes compound word search issues like "国宴豆浆" → ["国宴", "豆浆"]

## Prerequisites
```bash
pip install jieba psycopg2-binary
```

## Quick Start

### Step 1: Get Your DB Password
1. Go to: https://supabase.com/dashboard/project/euucwcmtzlpoywszphsd/settings/database
2. Find "Connection string" → "URI"
3. Copy the password (the part after `:` and before `@`)

### Step 2: Run the Reindex
```bash
cd /home/k/.openclaw/code/recipe-app
./scripts/run-jieba-reindex.sh <YOUR_DB_PASSWORD>
```

### Step 3: Verify
```bash
curl 'http://localhost:3000/api/recipes/search?q=国宴'
curl 'http://localhost:3000/api/recipes/search?q=黑芝麻'
```

Expected: Both should return results now (they didn't before jieba).

## Files
- `scripts/run-jieba-reindex.sh` - One-step wrapper script
- `scripts/reindex-search-vector.py` - Core reindex logic

## Background
- **Problem**: Compound Chinese words like "国宴豆浆" were indexed as single tokens
- **Solution**: jieba segmentation breaks them into ["国宴", "豆浆"]
- **Status**: jieba integration complete (2026-05-11), reindex pending

## Troubleshooting

### "❌ DATABASE_URL not set"
You forgot to pass the password:
```bash
./scripts/run-jieba-reindex.sh <YOUR_PASSWORD>
```

### "connection refused" or timeout
The Supabase DB might be sleeping. Try:
```bash
# Wake it up first with a simple query
psql "postgresql://recipe_user:<PASSWORD>@db.euucwcmtzlpoywszphsd.supabase.co:5432/postgres" -c "SELECT 1"
```

### Module not found errors
Install dependencies:
```bash
pip install jieba psycopg2-binary
```
