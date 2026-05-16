#!/usr/bin/env bash
# ─────────────────────────────────────────────────────
# Misty Visuals Website — Database Migration Script
# Usage:  bash /var/www/mistyvisuals-website/scripts/migrate.sh
#
# Reads DB credentials from the OS backend .env file.
# Safe to run multiple times (uses IF NOT EXISTS).
# ─────────────────────────────────────────────────────
set -euo pipefail

OS_ENV="/var/www/mistyvisuals-os/backend/.env"

# ── Load DB credentials from OS backend .env ──
if [ ! -f "$OS_ENV" ]; then
  echo "  ⚠  OS backend .env not found at $OS_ENV"
  echo "     Set DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD manually."
  exit 1
fi

DB_HOST=$(grep -E '^DB_HOST=' "$OS_ENV" | cut -d= -f2)
DB_PORT=$(grep -E '^DB_PORT=' "$OS_ENV" | cut -d= -f2)
DB_NAME=$(grep -E '^DB_NAME=' "$OS_ENV" | cut -d= -f2)
DB_USER=$(grep -E '^DB_USER=' "$OS_ENV" | cut -d= -f2)
DB_PASS=$(grep -E '^DB_PASSWORD=' "$OS_ENV" | cut -d= -f2)

export PGPASSWORD="$DB_PASS"

echo "  ▸ Connecting to ${DB_NAME}@${DB_HOST}:${DB_PORT} as ${DB_USER}"

psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=0 <<'SQL'

-- =============================================================
-- Website Tables — Create if not exist
-- =============================================================

CREATE TABLE IF NOT EXISTS website_hero (
  id            SERIAL PRIMARY KEY,
  media_type    TEXT NOT NULL DEFAULT 'image',
  media_url     TEXT NOT NULL,
  mobile_url    TEXT,
  poster_url    TEXT,
  headline      TEXT,
  subline       TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_stories (
  id                     SERIAL PRIMARY KEY,
  slug                   TEXT UNIQUE NOT NULL,
  title                  TEXT NOT NULL,
  subtitle               TEXT,
  location               TEXT,
  year                   INT,
  date                   TEXT,
  category               TEXT,
  cover_image_url        TEXT,
  cover_image_mobile_url TEXT,
  cover_blur_data_url    TEXT,
  is_featured            BOOLEAN NOT NULL DEFAULT false,
  display_order          INT NOT NULL DEFAULT 0,
  is_published           BOOLEAN NOT NULL DEFAULT false,
  tabs                   JSONB,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_story_photos (
  id                SERIAL PRIMARY KEY,
  story_id          INT NOT NULL REFERENCES website_stories(id) ON DELETE CASCADE,
  file_url          TEXT NOT NULL,
  file_url_mobile   TEXT,
  file_url_thumb    TEXT,
  blur_data_url     TEXT,
  original_filename TEXT,
  display_order     INT NOT NULL DEFAULT 0,
  is_cover          BOOLEAN NOT NULL DEFAULT false,
  tab_name          TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_films (
  id               SERIAL PRIMARY KEY,
  title            TEXT NOT NULL,
  subtitle         TEXT,
  location         TEXT,
  year             INT,
  category         TEXT,
  thumbnail_url    TEXT,
  thumbnail_blur   TEXT,
  youtube_url      TEXT,
  youtube_video_id TEXT,
  hls_url          TEXT,
  transcode_status TEXT DEFAULT 'pending',
  transcode_error  TEXT,
  is_featured      BOOLEAN NOT NULL DEFAULT false,
  display_order    INT NOT NULL DEFAULT 0,
  is_published     BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_testimonials (
  id             SERIAL PRIMARY KEY,
  quote          TEXT NOT NULL,
  client_name    TEXT NOT NULL,
  location       TEXT,
  year           INT,
  display_order  INT NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_sections (
  id             SERIAL PRIMARY KEY,
  key            TEXT UNIQUE NOT NULL,
  label          TEXT NOT NULL,
  is_visible     BOOLEAN NOT NULL DEFAULT true,
  display_order  INT NOT NULL DEFAULT 0,
  content        JSONB NOT NULL DEFAULT '{}'
);

-- Seed default sections (skip if already exist)
INSERT INTO website_sections (key, label, display_order, content) VALUES
  ('hero',         'Hero',          1, '{"headline": "Misty Visuals", "subline": "Luxury Wedding Photography & Films"}'),
  ('stories',      'Stories',       2, '{"heading": "Featured Stories"}'),
  ('philosophy',   'Philosophy',    3, '{"quote": "We don''t chase moments. We wait for them."}'),
  ('films',        'Films',         4, '{"heading": "Films"}'),
  ('experience',   'Experience',    5, '{"heading": "The Experience"}'),
  ('testimonials', 'Testimonials',  6, '{"heading": "Families We''ve Served"}'),
  ('inquiry',      'Inquiry',       7, '{"headline": "Begin Your Story", "subline": "Let''s create something timeless together."}')
ON CONFLICT (key) DO NOTHING;

-- =============================================================
-- ALTER TABLE — Add columns that may be missing from older schemas
-- =============================================================

ALTER TABLE website_stories ADD COLUMN IF NOT EXISTS date TEXT;
ALTER TABLE website_stories ADD COLUMN IF NOT EXISTS tabs JSONB;
ALTER TABLE website_story_photos ADD COLUMN IF NOT EXISTS tab_name TEXT;
ALTER TABLE website_films ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE website_films ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE website_films ADD COLUMN IF NOT EXISTS youtube_video_id TEXT;
ALTER TABLE website_films ADD COLUMN IF NOT EXISTS hls_url TEXT;
ALTER TABLE website_films ADD COLUMN IF NOT EXISTS transcode_status TEXT;
ALTER TABLE website_films ADD COLUMN IF NOT EXISTS transcode_error TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_website_stories_featured   ON website_stories(is_featured, is_published, display_order);
CREATE INDEX IF NOT EXISTS idx_website_stories_slug       ON website_stories(slug) WHERE is_published = true;
CREATE INDEX IF NOT EXISTS idx_website_story_photos_story ON website_story_photos(story_id, display_order);
CREATE INDEX IF NOT EXISTS idx_website_films_featured     ON website_films(is_featured, is_published, display_order);
CREATE INDEX IF NOT EXISTS idx_website_testimonials_active ON website_testimonials(is_active, display_order);

SQL

echo "  ✓ All website tables and columns are up to date"
