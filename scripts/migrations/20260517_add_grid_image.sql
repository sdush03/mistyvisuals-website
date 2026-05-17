-- Add grid_image_url to website_stories
ALTER TABLE website_stories ADD COLUMN IF NOT EXISTS grid_image_url TEXT;
