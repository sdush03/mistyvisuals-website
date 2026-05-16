#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="/var/www/mistyvisuals-website"
LOG_DIR="${HOME}/deploy-logs/mistyvisuals-website"
TS="$(date +%Y%m%d_%H%M%S)"
LOG_FILE="$LOG_DIR/deploy_$TS.log"
PM2_NAME="misty-website"
PORT=3002

# Optional notifications (set one of these in the server environment)
# SLACK_WEBHOOK_URL="https://hooks.slack.com/services/XXX/YYY/ZZZ"
# NOTIFY_WEBHOOK_URL="https://your-webhook-endpoint"

mkdir -p "$LOG_DIR"

exec > >(tee -a "$LOG_FILE") 2>&1

cd "$REPO_ROOT"

# Load environment variables (needed for non-interactive SSH sessions like GitHub Actions)
if [[ -f "$REPO_ROOT/.env.local" ]]; then
  set -a
  source "$REPO_ROOT/.env.local"
  set +a
fi

export NODE_ENV=production

PREV_HASH="$(git rev-parse HEAD)"
STASH_CREATED=""

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "[deploy] Uncommitted changes detected. Stashing..."
  STASH_CREATED="1"
  git stash push -u -m "deploy-autostash-$TS"
fi

notify() {
  local message="$1"
  local payload
  payload=$(printf '{"text":"%s"}' "$(echo "$message" | sed 's/"/\\"/g')")
  if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
    curl -s -X POST -H 'Content-Type: application/json' -d "$payload" "$SLACK_WEBHOOK_URL" >/dev/null || true
  elif [[ -n "${NOTIFY_WEBHOOK_URL:-}" ]]; then
    curl -s -X POST -H 'Content-Type: application/json' -d "$payload" "$NOTIFY_WEBHOOK_URL" >/dev/null || true
  fi
}

rollback() {
  echo "[deploy] ERROR detected. Rolling back to $PREV_HASH..."
  notify "❌ Website deploy failed on $(hostname). Rolling back to $PREV_HASH."
  git checkout "$PREV_HASH"

  echo "[deploy] Installing deps (rollback)..."
  cd "$REPO_ROOT"
  npm install
  bash "$REPO_ROOT/scripts/migrate.sh"
  rm -f .next/lock
  npm run build
  pm2 restart "$PM2_NAME" --update-env

  echo "[deploy] Rollback complete."
}

trap rollback ERR

echo "[deploy] ═══════════════════════════════════════════"
echo "[deploy]   MISTY VISUALS WEBSITE — DEPLOY"
echo "[deploy]   $(date)"
echo "[deploy] ═══════════════════════════════════════════"

echo "[deploy] Pulling latest code..."
git pull origin main

NEW_HASH="$(git rev-parse HEAD)"

if [[ "$PREV_HASH" == "$NEW_HASH" ]]; then
  echo "[deploy] No new changes. Force-rebuilding anyway..."
fi

CHANGED_FILES="$(git diff --name-only "$PREV_HASH" "$NEW_HASH" 2>/dev/null || echo "")"
MIGRATIONS_CHANGED="$(echo "$CHANGED_FILES" | grep -E '^scripts/migrations/' || true)"
DEPS_CHANGED="$(echo "$CHANGED_FILES" | grep -E '^package(-lock)?\.json$' || true)"

# ── Dependencies ──
if [[ -n "$DEPS_CHANGED" ]]; then
  echo "[deploy] package.json changed → npm install"
  npm install
else
  echo "[deploy] package.json unchanged → skipping npm install"
fi

# ── Migrations ──
if [[ -n "$MIGRATIONS_CHANGED" ]] || [[ "$PREV_HASH" == "$NEW_HASH" ]]; then
  echo "[deploy] Running migrations..."
  bash "$REPO_ROOT/scripts/migrate.sh"
else
  echo "[deploy] No migration changes → skipping migrate.sh"
fi

# ── Build ──
echo "[deploy] Building Next.js production bundle..."
rm -rf .next
npm run build

# ── Restart ──
echo "[deploy] Restarting PM2 process..."
if pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start npm --name "$PM2_NAME" -- start -- -p "$PORT"
fi
pm2 save --force > /dev/null 2>&1

echo "[deploy] Done."
notify "✅ Website deploy succeeded on $(hostname). Commit: ${NEW_HASH:0:8}"

if [[ -n "$STASH_CREATED" ]]; then
  echo "[deploy] Restoring stashed changes..."
  git stash pop || echo "[deploy] Stash pop had conflicts; resolve manually."
fi

# Clean up local package-lock changes if they were not part of the pulled diff
if [[ -z "$DEPS_CHANGED" && -f "$REPO_ROOT/package-lock.json" ]]; then
  git restore "$REPO_ROOT/package-lock.json" || true
fi

echo ""
echo "[deploy] ═══════════════════════════════════════════"
echo "[deploy]   ✅ DEPLOY COMPLETE"
echo "[deploy]   Site:  https://mistyvisuals.com"
echo "[deploy]   Admin: https://mistyvisuals.com/admin"
echo "[deploy]   Log:   $LOG_FILE"
echo "[deploy] ═══════════════════════════════════════════"
