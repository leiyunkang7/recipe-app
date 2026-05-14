#!/usr/bin/env python3
import subprocess
import json

# Check a single recipe by ID
RECIPE_ID = "6d99aa5c-f174-464a-9ac6-5cbda5c581e1"
result = subprocess.run(
    ["curl", "-s", f"http://localhost:3000/api/recipes/{RECIPE_ID}"],
    capture_output=True, text=True
)
print("Raw response (first 1000 chars):")
print(result.stdout[:1000])

try:
    data = json.loads(result.stdout)
    if isinstance(data, dict) and "data" in data:
        r = data["data"]
        print(f"\nRecipe: {r.get('title', 'N/A')}")
        print(f"Tags: {r.get('tags', [])}")
    elif isinstance(data, dict) and "error" in data:
        print(f"\nError: {data['error']}")
except:
    print("\nCould not parse JSON response")
