#!/usr/bin/env python3
import subprocess
import json

result = subprocess.run(
    ["curl", "-s", "http://localhost:3000/api/recipes?limit=9"],
    capture_output=True, text=True
)
data = json.loads(result.stdout)
recipes = data.get("data", [])

print(f"Verifying tags for {len(recipes)} recipes:\n")
for r in recipes:
    title = r.get("title", "Unknown")
    tags = r.get("tags", [])
    print(f"✅ {title}")
    print(f"   Tags ({len(tags)}): {', '.join(tags) if tags else '(none)'}")
    print()
