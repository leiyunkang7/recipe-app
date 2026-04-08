with open("/home/k/code/recipe-app/web/server/api/my-recipes/index.ts", "r") as f:
    lines = f.readlines()
query_idx = None
for i, line in enumerate(lines):
    if "const query = getQuery(event)" in line:
        query_idx = i
        break
post_idx = None
for i, line in enumerate(lines):
    if "// Handle POST requests for favorites actions" in line:
        post_idx = i
        break
print("query_idx:", query_idx, "post_idx:", post_idx)
print("query line:", repr(lines[query_idx]))
print("post line:", repr(lines[post_idx]))
