-- =============================================================================
-- Migration 002: Extended features - invite types, revoke fix, age settings, edit
-- Run these SQL statements in your Supabase SQL editor
-- =============================================================================

-- 1. Add invite_type column to invite_codes table
-- ------------------------------------------------
ALTER TABLE invite_codes
  ADD COLUMN IF NOT EXISTS invite_type TEXT DEFAULT 'guestlist';

-- 2. Add revoked_at column to invite_codes table (to properly track revocation)
-- ---------------------------------------------------------------------------
ALTER TABLE invite_codes
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- 3. Add age settings to events table
-- ------------------------------------
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS min_age INTEGER DEFAULT 18;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS max_age INTEGER;

-- 4. Add age_flagged to applications table
-- -----------------------------------------
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS age_flagged BOOLEAN DEFAULT FALSE;

-- 5. Add invite_type to applications (copied from invite code when applying)
-- --------------------------------------------------------------------------
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS invite_type TEXT;

-- 6. Index for performance
-- -------------------------
CREATE INDEX IF NOT EXISTS idx_invite_codes_invite_type ON invite_codes(invite_type);
CREATE INDEX IF NOT EXISTS idx_applications_age_flagged ON applications(age_flagged);
CREATE INDEX IF NOT EXISTS idx_applications_invite_type ON applications(invite_type);

-- NOTE: After adding revoked_at, update the revoke endpoint to set this column.
-- The revoke API has already been updated to set revoked_at = NOW().
-- If you have existing revoked codes (redeemed=true from revoke), you may want to
-- set their revoked_at manually, e.g.:
-- UPDATE invite_codes SET revoked_at = updated_at WHERE redeemed = true AND revoked_at IS NULL;
