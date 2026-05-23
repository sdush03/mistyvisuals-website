-- =============================================================
-- Analytics Tables — Create if not exist
-- =============================================================

CREATE TABLE IF NOT EXISTS website_analytics_views (
  id            SERIAL PRIMARY KEY,
  session_hash  TEXT NOT NULL,
  path          TEXT NOT NULL,
  referrer      TEXT,
  country       TEXT,
  city          TEXT,
  browser       TEXT,
  os            TEXT,
  device_type   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS website_analytics_events (
  id            SERIAL PRIMARY KEY,
  session_hash  TEXT NOT NULL,
  event_name    TEXT NOT NULL,
  event_data    JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_views_created ON website_analytics_views(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_views_path    ON website_analytics_views(path);
CREATE INDEX IF NOT EXISTS idx_analytics_views_session ON website_analytics_views(session_hash);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name   ON website_analytics_events(event_name);
