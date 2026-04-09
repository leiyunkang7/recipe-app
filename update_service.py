import re

with open('/home/k/code/recipe-app/services/recipe/src/service.ts', 'r') as f:
    content = f.read()

# Update imports
content = content.replace(
    'import { eq, ilike, or, and, lte, desc, count }',
    'import { eq, ilike, or, and, lte, desc, asc, count, sql }'
)

# Add recipeRatings to imports from database
content = content.replace(
    'recipeSteps,\n  recipeTags,',
    'recipeSteps,\n  recipeTags,\n  recipeRatings,'
)

with open("/home/k/code/recipe-app/services/recipe/src/service.ts", "w") as f:
    f.write(content)

print('Updated imports successfully')
