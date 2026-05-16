#!/usr/bin/env bash
# ─────────────────────────────────────────────────────
# Misty Visuals Website — Production Deploy Script
# Usage:  bash /var/www/mistyvisuals-website/scripts/deploy.sh
# ─────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="/var/www/mistyvisuals-website"
PM2_NAME="misty-website"
PORT=3002

echo ""
echo "═══════════════════════════════════════════"
echo "  MISTY VISUALS WEBSITE — DEPLOY"
echo "═══════════════════════════════════════════"
echo ""

# 1. Pull latest code
echo "▸ Pulling latest code..."
cd "$APP_DIR"
git checkout -- .
git pull origin main
echo "  ✓ Code updated"

# 2. Install dependencies
echo "▸ Installing dependencies..."
npm install --omit=dev
echo "  ✓ Dependencies installed"

# 3. Run migrations
echo "▸ Running database migrations..."
bash "$APP_DIR/scripts/migrate.sh"
echo "  ✓ Migrations complete"

# 4. Build Next.js
echo "▸ Building Next.js production bundle..."
npm run build
echo "  ✓ Build complete"

# 5. Restart PM2
echo "▸ Restarting PM2 process..."
if pm2 describe "$PM2_NAME" > /dev/null 2>&1; then
  pm2 restart "$PM2_NAME"
else
  pm2 start npm --name "$PM2_NAME" -- start -- -p "$PORT"
fi
echo "  ✓ $PM2_NAME restarted"

# 6. Save PM2 state
pm2 save --force > /dev/null 2>&1

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ DEPLOY COMPLETE"
echo "  Site: https://mistyvisuals.com"
echo "  Admin: https://mistyvisuals.com/admin"
echo "═══════════════════════════════════════════"
echo ""
