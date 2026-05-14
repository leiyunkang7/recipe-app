import re

with open("/home/k/code/recipe-app/services/recipe/src/service.ts", "r") as f:
    content = f.read()

# Check if already updated
if "filters.maxTime !== undefined" in content:
    print("Already updated")
    exit(0)
