-- =============================================================================
-- Migration 001: Add extended columns for the full guestlist feature set
-- =============================================================================
-- Run this script in your Supabase project: Database → SQL Editor → New query
-- All statements use IF NOT EXISTS / IF NOT EXISTS so re-running is safe.
-- =============================================================================

-- ─── applications table ──────────────────────────────────────────────────────

-- Guest's gender selection (values: male | female | diverse)
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS gender TEXT;

-- How the guest heard about the party
-- (values: friend | instagram | flyer | tiktok | other)
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS heard_about_us TEXT;

-- Whether the guest accepted the GDPR/Datenschutz privacy policy
-- Must be TRUE before an application is accepted by the /api/apply route
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS datenschutz_accepted BOOLEAN DEFAULT FALSE;

-- Unique token generated when an application is approved.
-- Powers the /ticket/[token] URL the guest uses to display their QR code.
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS qr_token TEXT UNIQUE;

-- Whether the guest physically checked in at the event entrance
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT FALSE;

-- Timestamp recorded when the guest checked in (via QR scanner or manual button)
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;

-- ─── events table ────────────────────────────────────────────────────────────

-- Free-text description of the event (shown on the Events tab card)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS description TEXT;

-- Maximum number of guests that can be approved for this event.
-- The /api/update-status route enforces a separate hard cap of 130 approved guests.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS guest_limit INTEGER;

-- URL to the event's poster image (displayed on the Events tab)
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS poster_url TEXT;

-- ─── invite_codes table ──────────────────────────────────────────────────────
-- NOTE: The `code_hash` column is repurposed to store plain-text 6-character
-- uppercase hex codes (e.g. "A3F9C1"). Codes are no longer hashed.
-- Old bcrypt hashes in this column will no longer be valid.
-- To remove stale hashed codes (hashes are > 6 characters):
--   DELETE FROM invite_codes WHERE length(code_hash) > 6;

-- ─── Performance indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_applications_qr_token ON applications(qr_token);
CREATE INDEX IF NOT EXISTS idx_invite_codes_code_hash ON invite_codes(code_hash);

