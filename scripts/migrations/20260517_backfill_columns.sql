-- =============================================================
-- Add missing columns to website tables
-- Backfills columns added after initial schema creation
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
