#!/data/data/com.termux/files/usr/bin/bash

# =========================================================
# PUBLISH OBSIDIAN CONTENT
#
# Copies only Markdown files tagged:
#
#   #posts
#   #notes
#
# Everything else stays private.
# =========================================================

set -e

PROJECT_DIR="$HOME/obsidian-sites"
VAULT_DIR="$PROJECT_DIR/obsidian-vault"
PUBLIC_DIR="$PROJECT_DIR/src/content"

echo "========================================"
echo " Publishing Obsidian Site"
echo "========================================"

# ---------------------------------------------------------
# Safety checks
# ---------------------------------------------------------

if [ ! -d "$VAULT_DIR" ]; then
  echo "❌ Obsidian vault not found:"
  echo "   $VAULT_DIR"
  exit 1
fi

mkdir -p "$PUBLIC_DIR"

# ---------------------------------------------------------
# Clear previous published content
# ---------------------------------------------------------

echo "🧹 Clearing previous published content..."

find "$PUBLIC_DIR" -type f -delete

# ---------------------------------------------------------
# Find Markdown files
# ---------------------------------------------------------

echo "📦 Finding #posts and #notes..."

COUNT=0

while IFS= read -r -d '' file; do

  # Ignore Obsidian/system directories
  case "$file" in
    */.obsidian/*|*/.trash/*|*/.smart-env/*|*/templates/*)
      continue
      ;;
  esac

  # Only Markdown files
  case "$file" in
    *.md)
      ;;
    *)
      continue
      ;;
  esac

  # -------------------------------------------------------
  # Check the frontmatter for #posts or #notes.
  #
  # We only inspect the YAML frontmatter at the top
  # of the file.
  # -------------------------------------------------------

  FRONTMATTER=$(awk '
    BEGIN { in_frontmatter=0 }

    /^---[[:space:]]*$/ {
      if (in_frontmatter == 0) {
        in_frontmatter=1
        next
      } else {
        exit
      }
    }

    in_frontmatter == 1 {
      print
    }
  ' "$file")

  # -------------------------------------------------------
  # Check for posts or notes tags
  # -------------------------------------------------------

  if printf '%s\n' "$FRONTMATTER" | grep -qiE '#?(posts|notes)'; then

    relative="${file#$VAULT_DIR/}"

    destination="$PUBLIC_DIR/$relative"

    mkdir -p "$(dirname "$destination")"

    cp "$file" "$destination"

    echo "  ✓ $relative"

    COUNT=$((COUNT + 1))

  fi

done < <(find -L "$VAULT_DIR" -type f -print0)

echo
echo "========================================"
echo " Published $COUNT file(s)"
echo "========================================"

echo
echo "Public source:"
echo "  $PUBLIC_DIR"
