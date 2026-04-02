#\!/bin/bash
FILE="/root/.openclaw/code/recipe-app/web/app/components/FavoriteButton.vue"
TMP=$(mktemp)
head -n 52 "$FILE" > "$TMP"
tail -n +58 "$FILE" >> "$TMP"
mv "$TMP" "$FILE"
