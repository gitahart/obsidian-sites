#!/data/data/com.termux/files/usr/bin/bash

# ============================
# CONFIG
# ============================

SOURCE_DIR="$HOME/obsidian-sites"
BASE_DEST="/storage/emulated/0/Acode/obsidian"

TIMESTAMP=$(date +"%H-%M_%Y-%m-%d")
SUFFIX="_dg_${TIMESTAMP}"

DEST_DIR="${BASE_DEST}/dg_${TIMESTAMP}"

# ============================
# SAFETY CHECKS
# ============================

if [ ! -d "$SOURCE_DIR" ]; then
  echo "❌ Source directory not found: $SOURCE_DIR"
  exit 1
fi

mkdir -p "$DEST_DIR"

# ============================
# COPY + RENAME
# ============================

echo "📦 Backing up with timestamped filenames"
echo "➡️  From: $SOURCE_DIR"
echo "⬅️  To:   $DEST_DIR"

cd "$SOURCE_DIR" || exit 1

find . -type d -exec mkdir -p "$DEST_DIR/{}" \;

find . -type f | while read -r file; do
  dir=$(dirname "$file")
  base=$(basename "$file")
  name="${base%.*}"
  ext="${base##*.}"

  if [ "$base" = "$ext" ]; then
    newname="${name}${SUFFIX}"
  else
    newname="${name}${SUFFIX}.${ext}"
  fi

  cp "$file" "$DEST_DIR/$dir/$newname"
done

echo "🎉 Backup complete!"
echo "📁 Folder: $DEST_DIR"