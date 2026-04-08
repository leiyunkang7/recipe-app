import re
f = open("/home/k/code/recipe-app/web/server/api/my-recipes/index.ts", "r")
content = f.read()
f.close()
old1 = "const query = getQuery(event);\\n  const page = parseInt"
new1 = """const query = getQuery(event);\\n\\n  // Handle GET requests for favorites\\n  if (query.type === 'favorites') {\\n    return handleGetFavorites(event, user.id);\\n  }\\n\\n  // Handle GET requests for favorite folders\\n  if (query.type === 'favorite-folders') {\\n    return handleGetFavoriteFolders(event, user.id);\\n  }\\n\\n  const page = parseInt"""
