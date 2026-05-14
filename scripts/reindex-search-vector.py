#!/usr/bin/env python3
"""
Re-index search_vector for all recipes using jieba segmentation.
Fixes compound Chinese word search (e.g. "国宴豆浆" -> "国宴" + "豆浆").

Usage:
    DATABASE_URL="postgresql://..." python3 scripts/reindex-search-vector.py

Requires: jieba, psycopg2
    pip install jieba psycopg2-binary
"""

import os
import sys

try:
    import jieba
except ImportError:
    print("❌ jieba not installed. Run: pip install jieba")
    sys.exit(1)

try:
    import psycopg2
except ImportError:
    print("❌ psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)


def segment_text(text: str) -> str:
    """Segment Chinese text using jieba, return space-separated words."""
    if not text:
        return ""
    
    # Check if text contains Chinese
    has_chinese = any('\u4e00' <= char <= '\u9fff' for char in text)
    
    if has_chinese:
        words = jieba.cut(text)
        return " ".join(w for w in words if w.strip())
    else:
        # English: simple whitespace split
        return " ".join(w for w in text.split() if len(w) > 1)


def build_search_vector(title: str, description: str, category: str, cuisine: str, tags: list) -> str:
    """Build search_vector text from recipe fields."""
    parts = []
    if title:
        parts.append(title)
    if description:
        parts.append(description)
    if category:
        parts.append(category)
    if cuisine:
        parts.append(cuisine)
    if tags:
        parts.extend(tags)
    
    combined = " ".join(parts)
    return segment_text(combined)


def main():
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not set")
        print("Usage: DATABASE_URL='postgresql://...' python3 scripts/reindex-search-vector.py")
        sys.exit(1)
    
    print(f"🔌 Connecting to database...")
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor()
    
    # Get all recipes with their search_vector
    print(f"📊 Fetching all recipes...")
    cursor.execute("""
        SELECT id, title, description, category, cuisine, search_vector
        FROM recipes
    """)
    recipes = cursor.fetchall()
    print(f"Found {len(recipes)} recipes")
    
    # Get all tags
    cursor.execute("SELECT recipe_id, tag FROM recipe_tags")
    tags_rows = cursor.fetchall()
    
    # Build tag map
    tag_map = {}
    for recipe_id, tag in tags_rows:
        if recipe_id not in tag_map:
            tag_map[recipe_id] = []
        tag_map[recipe_id].append(tag)
    
    # Re-index each recipe
    updated = 0
    errors = 0
    
    print(f"🔨 Re-indexing with jieba segmentation...")
    for recipe_id, title, description, category, cuisine, old_vector in recipes:
        try:
            tags = tag_map.get(recipe_id, [])
            new_vector = build_search_vector(
                title or "",
                description or "",
                category or "",
                cuisine or "",
                tags
            )
            
            # Update database
            cursor.execute("""
                UPDATE recipes 
                SET search_vector = to_tsvector('simple', %s)
                WHERE id = %s
            """, (new_vector, recipe_id))
            
            updated += 1
            if updated % 10 == 0:
                print(f"  Processed {updated}/{len(recipes)} recipes...")
                
        except Exception as e:
            errors += 1
            print(f"❌ Error on recipe {recipe_id}: {e}")
    
    conn.commit()
    print(f"\n✅ Re-indexing complete!")
    print(f"   Updated: {updated}")
    print(f"   Errors: {errors}")
    
    # Verify a few recipes
    print(f"\n🔍 Verification (sample):")
    cursor.execute("""
        SELECT id, title, search_vector::text 
        FROM recipes 
        LIMIT 3
    """)
    for row in cursor.fetchall():
        print(f"   {row[0]}: {row[1]}")
        print(f"      tsvector: {row[2][:100]}...")
    
    cursor.close()
    conn.close()
    print(f"\n✨ Done!")


if __name__ == "__main__":
    main()
