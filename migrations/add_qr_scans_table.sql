-- QR Code scan tracking table
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS qr_scans (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scanned_at  TIMESTAMPTZ NOT NULL    DEFAULT now(),
  qr_source   TEXT        NOT NULL,   -- 'poster' | 'sticker'
  ip_address  TEXT,
  country     TEXT,
  city        TEXT,
  device_type TEXT,                   -- 'mobile' | 'tablet' | 'desktop'
  os          TEXT,                   -- 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'Unknown'
  browser     TEXT,                   -- 'Safari' | 'Chrome' | 'Firefox' | etc.
  user_agent  TEXT
);

-- Optional: index for fast time-range queries on the dashboard
CREATE INDEX IF NOT EXISTS qr_scans_scanned_at_idx ON qr_scans (scanned_at DESC);
CREATE INDEX IF NOT EXISTS qr_scans_source_idx     ON qr_scans (qr_source);
