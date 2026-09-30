#!/usr/bin/env sh
set -eu
: "${DATABASE_URL:?DATABASE_URL required}"
: "${BACKUP_DIR:=/var/backups/rwanimu}"
mkdir -p "$BACKUP_DIR"
name="rwanimu_$(date +%Y%m%d_%H%M%S).dump"
pg_dump --format=custom --no-owner --file "$BACKUP_DIR/$name" "$DATABASE_URL"
echo "$BACKUP_DIR/$name"
