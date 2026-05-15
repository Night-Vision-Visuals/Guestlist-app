-- Add lat/lng coordinates to qr_scans and interaction_events tables
-- Run this in the Supabase SQL editor

ALTER TABLE qr_scans
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION;

ALTER TABLE interaction_events
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS city    TEXT,
  ADD COLUMN IF NOT EXISTS lat     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng     DOUBLE PRECISION;

-- Optional indexes for map queries
CREATE INDEX IF NOT EXISTS qr_scans_geo_idx             ON qr_scans (lat, lng);
CREATE INDEX IF NOT EXISTS interaction_events_geo_idx   ON interaction_events (lat, lng);
