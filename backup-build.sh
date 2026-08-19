#!/usr/bin/env bash

set -e

PROJECT_DIR="$HOME/obsidian-sites"
BACKUP_DIR="$HOME/obsidian-sites-backups"
TIMESTAMP="$(date +"%Y-%m-%d_%H-%M-%S")"
BACKUP_PATH="$BACKUP_DIR/obsidian-sites-$TIMESTAMP"

mkdir -p "$BACKUP_PATH"

echo "Backing up Obsidian site..."
echo "Source: $PROJECT_DIR"
echo "Destination: $BACKUP_PATH"
echo

# Core site source
cp -R "$PROJECT_DIR/src" "$BACKUP_PATH/"

# Eleventy configuration
cp "$PROJECT_DIR/.eleventy.js" "$BACKUP_PATH/"

# Package configuration
cp "$PROJECT_DIR/package.json" "$BACKUP_PATH/"
cp "$PROJECT_DIR/package-lock.json" "$BACKUP_PATH/"

# Git configuration if present
if [ -f "$PROJECT_DIR/.gitignore" ]; then
  cp "$PROJECT_DIR/.gitignore" "$BACKUP_PATH/"
fi

# Existing helper scripts, if present
if [ -f "$PROJECT_DIR/backup-obsidian.sh" ]; then
  cp "$PROJECT_DIR/backup-obsidian.sh" "$BACKUP_PATH/"
fi

if [ -f "$PROJECT_DIR/publish-site.sh" ]; then
  cp "$PROJECT_DIR/publish-site.sh" "$BACKUP_PATH/"
fi

echo "Backup complete:"
echo "$BACKUP_PATH"
echo

# Show what was backed up
find "$BACKUP_PATH" -type f -print | sort
