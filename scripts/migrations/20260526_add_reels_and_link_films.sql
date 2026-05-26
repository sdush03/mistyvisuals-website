-- Migration: Create website_reels table and add story_id to website_films
-- Created: 2026-05-26

-- Create website_reels table if not exists
CREATE TABLE IF NOT EXISTS website_reels (
  id SERIAL PRIMARY KEY,
  story_id INTEGER REFERENCES website_stories(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  youtube_video_id VARCHAR(50) NOT NULL,
  thumbnail_url VARCHAR(255),
  thumbnail_blur TEXT,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add story_id to website_films if not exists
ALTER TABLE website_films 
ADD COLUMN IF NOT EXISTS story_id INTEGER REFERENCES website_stories(id) ON DELETE SET NULL;
