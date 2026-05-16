#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

# ── Ensure psql is available ──
if ! command -v psql >/dev/null 2>&1; then
  echo "psql not found. Please install PostgreSQL client tools." >&2
  exit 1
fi

# ── Load DB credentials from OS backend .env ──
OS_ENV="/var/www/mistyvisuals-os/backend/.env"

if [ -z "${DATABASE_URL:-}" ] && [ -f "$OS_ENV" ]; then
  set -a
  source "$OS_ENV"
  set +a
fi

# Auto-construct DATABASE_URL from individual DB params if not set
DB_URL="${DATABASE_URL:-}"
if [ -z "$DB_URL" ] && [ -n "${DB_HOST:-}" ] && [ -n "${DB_NAME:-}" ]; then
  DB_URL="postgresql://${DB_USER:-postgres}:${DB_PASSWORD:-}@${DB_HOST}:${DB_PORT:-5432}/${DB_NAME}"
fi

if [ -z "$DB_URL" ]; then
  echo "DATABASE_URL is not set and could not be constructed from DB_HOST/DB_NAME." >&2
  echo "Set DATABASE_URL or ensure /var/www/mistyvisuals-os/backend/.env exists." >&2
  exit 1
fi

echo "[migrate] Connecting to database..."

# ── Create migration tracking table ──
psql "$DB_URL" -v ON_ERROR_STOP=1 -c \
  "CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMP NOT NULL DEFAULT NOW());"

# ── Ensure migrations directory exists ──
if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "[migrate] No migrations directory at $MIGRATIONS_DIR — nothing to apply."
  exit 0
fi

# ── Apply pending migrations in order ──
shopt -s nullglob
APPLIED=0
SKIPPED=0

for f in "$MIGRATIONS_DIR"/*.sql; do
  fname=$(basename "$f")
  applied=$(psql "$DB_URL" -tAc "SELECT 1 FROM schema_migrations WHERE filename='$fname'")
  if [ "$applied" != "1" ]; then
    # Safety: detect destructive statements
    if grep -Eiq "\b(drop|truncate)\b|\bdelete\s+from\b" "$f"; then
      if [ "${ALLOW_DESTRUCTIVE_MIGRATIONS:-}" != "1" ]; then
        echo "[migrate] ⚠  Skipping $fname (destructive statements detected)."
        echo "             Set ALLOW_DESTRUCTIVE_MIGRATIONS=1 to allow."
        continue
      fi
    fi
    echo "[migrate] Applying $fname"
    psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$f"
    psql "$DB_URL" -v ON_ERROR_STOP=1 -c "INSERT INTO schema_migrations (filename) VALUES ('$fname');"
    APPLIED=$((APPLIED + 1))
  else
    echo "[migrate] Skipping $fname (already applied)"
    SKIPPED=$((SKIPPED + 1))
  fi
done

echo "[migrate] ✓ Done. Applied: $APPLIED, Skipped: $SKIPPED"
