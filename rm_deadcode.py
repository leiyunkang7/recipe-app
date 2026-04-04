filepath = "/root/.openclaw/code/recipe-app/web/app/components/FavoriteButton.vue"
with open(filepath, "r") as f: content = f.read()
lines = content.split("\\n")
new_lines = lines[:52] + lines[57:]
with open(filepath, "w") as f: f.write("\\n".join(new_lines))
