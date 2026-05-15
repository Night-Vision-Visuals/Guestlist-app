-- Interaction events tracking table
-- Tracks clicks on Instagram follow, WhatsApp join, Request Key, Access Now, etc.
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS interaction_events (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at  TIMESTAMPTZ NOT NULL    DEFAULT now(),
  event_type   TEXT        NOT NULL,   -- e.g. 'instagram_follow_nav', 'whatsapp_join_footer', etc.
  page         TEXT,                   -- '/login', '/', etc.
  ip_address   TEXT,
  device_type  TEXT,
  os           TEXT,
  user_agent   TEXT
);

CREATE INDEX IF NOT EXISTS interaction_events_occurred_at_idx ON interaction_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS interaction_events_event_type_idx  ON interaction_events (event_type);
