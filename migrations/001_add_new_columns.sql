-- =============================================================================
-- Migration 001: Add new columns for extended features
-- Run these SQL statements in your Supabase SQL editor
-- =============================================================================

-- 1. Add new columns to the applications table
-- -----------------------------------------------

-- Gender field
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS gender TEXT;

-- How did they hear about the party
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS heard_about_us TEXT;

-- Datenschutz (privacy policy) acceptance
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS datenschutz_accepted BOOLEAN DEFAULT FALSE;

-- QR token for check-in (unique per approved guest)
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE;

-- Check-in status
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE;

-- Timestamp of check-in
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;


-- 2. Add new columns to the events table
-- ----------------------------------------

-- Event description
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Guest limit for the event
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS guest_limit INTEGER;

-- Poster image URL
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS poster_url TEXT;


-- 3. Invite codes: codes are now stored as plain text
-- ---------------------------------------------------
-- The existing `code_hash` column is reused to store plain text codes.
-- No column rename is needed; new codes will be stored as plain uppercase hex strings.
-- Old hashed codes will no longer be valid after this change.
-- If you want to clean up old hashed codes, run:
--   DELETE FROM invite_codes WHERE length(code_hash) > 10;
-- (Plain text codes are always exactly 6 characters, hashes are much longer)


-- 4. Optional: Add indexes for performance
-- -----------------------------------------
CREATE INDEX IF NOT EXISTS idx_applications_qr_token ON applications(qr_token);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code_hash ON invite_codes(code_hash);
