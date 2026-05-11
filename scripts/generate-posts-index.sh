#!/bin/bash

# Generates content/posts/index.json by scanning content/posts/*/index.html
# Expected structure: content/posts/<slug>/index.html

set -e

echo "Generating posts index... 📝"

POSTS_DIR="./content/posts"
INDEX_FILE="$POSTS_DIR/index.json"

mkdir -p "$POSTS_DIR"

cat > "$INDEX_FILE" << 'EOF'
{
  "posts": [
EOF

post_files=("$POSTS_DIR"/*/index.html)

if [ ! -f "${post_files[0]}" ]; then
    echo "⚠️  No index.html files found in $POSTS_DIR subdirectories"
    printf '  ]\n}\n' >> "$INDEX_FILE"
    exit 0
fi

total=${#post_files[@]}
count=0

echo "📝 Found $total posts"

for file in "${post_files[@]}"; do
    [ ! -f "$file" ] && continue

    slug=$(basename "$(dirname "$file")")

    # Extract title from first <h1> tag in the fragment
    title=$(grep -o '<h1>[^<]*</h1>' "$file" | head -1 \
        | sed 's/<h1>//;s/<\/h1>//' \
        | tr -d '\r\n')

    [ -z "$title" ] && title="$slug"

    if [[ "$OSTYPE" == "darwin"* ]]; then
        date=$(stat -f "%Sm" -t "%d-%m-%Y" "$file")
    else
        date=$(date -r "$file" "+%d-%m-%Y")
    fi

    count=$((count + 1))
    echo "  📄 Processing: $slug"

    cat >> "$INDEX_FILE" << EOF
    {
      "id":  "${slug}_${date}",
      "title": "$title",
      "publishedAt": "$date",
      "slug": "$slug"
EOF

    if [ $count -lt $total ]; then
        echo "    }," >> "$INDEX_FILE"
    else
        echo "    }" >> "$INDEX_FILE"
    fi
done

printf '  ]\n}\n' >> "$INDEX_FILE"

echo "✅ Generated index with $count posts"
echo "📋 Index saved to: $INDEX_FILE"

if [ "${SHOW_OUTPUT:-false}" = "true" ]; then
    echo "📄 Generated content:"
    cat "$INDEX_FILE"
fi
