#!/usr/bin/env bash
# Misty Visuals Website — server setup for FFmpeg + website media dir
# Run ONCE on the DigitalOcean server:
#   bash /var/www/mistyvisuals-website/frontend/scripts/server-setup.sh

set -euo pipefail

echo "=== Installing FFmpeg ==="
apt-get update -y
apt-get install -y ffmpeg

echo "=== FFmpeg version ==="
ffmpeg -version | head -1

echo "=== Creating website media directories ==="
MEDIA_ROOT="/var/www/mistyvisuals-os/backend/media/website"
mkdir -p "$MEDIA_ROOT/homepage/hero"
mkdir -p "$MEDIA_ROOT/stories"
mkdir -p "$MEDIA_ROOT/films"
chmod -R 755 "$MEDIA_ROOT"

echo "=== Setting WEBSITE_MEDIA_DIR in backend .env ==="
ENV_FILE="/var/www/mistyvisuals-os/backend/.env"
if ! grep -q "WEBSITE_MEDIA_DIR" "$ENV_FILE"; then
  echo "WEBSITE_MEDIA_DIR=$MEDIA_ROOT" >> "$ENV_FILE"
  echo "Added WEBSITE_MEDIA_DIR to .env"
else
  echo "WEBSITE_MEDIA_DIR already in .env"
fi

echo "=== Installing sharp in backend ==="
cd /var/www/mistyvisuals-os/backend
npm install sharp

echo "=== Done! ==="
echo "Run 'pm2 restart misty-backend' to apply changes."
