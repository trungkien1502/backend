#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:?APP_DIR is required}"
BACKUP_DIR="${BACKUP_DIR:-$APP_DIR/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

cd "$APP_DIR"

if [ ! -f ".env" ]; then
  echo "Missing .env in $APP_DIR"
  exit 1
fi

if ! command -v mysqldump >/dev/null 2>&1; then
  echo "mysqldump is required on the server"
  exit 1
fi

DATABASE_URL="$(grep '^DATABASE_URL=' .env | head -n 1 | cut -d '=' -f2- | sed 's/^"//; s/"$//')"

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is missing in .env"
  exit 1
fi

DB_JSON="$(DATABASE_URL="$DATABASE_URL" node -e "const u = new URL(process.env.DATABASE_URL); console.log(JSON.stringify({ host: u.hostname, port: u.port || '3306', user: decodeURIComponent(u.username), password: decodeURIComponent(u.password), database: decodeURIComponent(u.pathname.replace(/^\//, '')) }));")"

DB_HOST="$(echo "$DB_JSON" | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).host")"
DB_PORT="$(echo "$DB_JSON" | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).port")"
DB_USER="$(echo "$DB_JSON" | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).user")"
DB_PASSWORD="$(echo "$DB_JSON" | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).password")"
DB_NAME="$(echo "$DB_JSON" | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).database")"

TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/${DB_NAME}-${TIMESTAMP}.sql.gz"
CHECKSUM_FILE="$BACKUP_FILE.sha256"

MYSQL_PWD="$DB_PASSWORD" mysqldump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --user="$DB_USER" \
  --no-tablespaces \
  --single-transaction \
  --quick \
  --lock-tables=false \
  "$DB_NAME" | gzip > "$BACKUP_FILE"

sha256sum "$BACKUP_FILE" > "$CHECKSUM_FILE"

find "$BACKUP_DIR" -type f -name '*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -type f -name '*.sql.gz.sha256' -mtime +"$RETENTION_DAYS" -delete

echo "Backup created: $BACKUP_FILE"
echo "Checksum created: $CHECKSUM_FILE"
