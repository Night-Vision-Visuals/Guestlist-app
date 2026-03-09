-- =============================================================================
-- Migration 002: Extended features — invite types, revoke tracking, age settings
-- =============================================================================
-- Run this script AFTER migration 001.
-- Run in: Supabase project → Database → SQL Editor → New query
-- All statements are idempotent (IF NOT EXISTS) — safe to re-run.
-- =============================================================================

-- ─── invite_codes table ──────────────────────────────────────────────────────

-- Category label applied when the code is generated.
-- Values: guestlist | friend | vip | instagram | whatsapp | socialmedia
-- Default: 'guestlist'
-- Displayed in the Invitations tab and copied to the application record.
ALTER TABLE invite_codes
  ADD COLUMN IF NOT EXISTS invite_type TEXT DEFAULT 'guestlist';

-- Timestamp set by POST /api/invite/revoke when an admin manually disables a code.
-- A NULL value means the code has NOT been revoked.
-- The UI uses this to distinguish "Revoked" (admin action) from "Fully Used"
-- (all max_uses consumed through normal applications).
ALTER TABLE invite_codes
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- ─── events table ────────────────────────────────────────────────────────────

-- Minimum age required to attend this event.
-- Default: 18 — nobody under 18 should ever appear without a flag.
-- Guests outside this range are flagged with age_flagged = TRUE on their
-- application (see below) rather than being silently rejected, so the admin
-- can still make a manual decision.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS min_age INTEGER DEFAULT 18;

-- Maximum age for this event (optional).
-- NULL means no upper age limit.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS max_age INTEGER;

-- ─── applications table ──────────────────────────────────────────────────────

-- Set to TRUE when the applicant's age (derived from date_of_birth) falls
-- outside the event's min_age / max_age range.
-- The application is still created normally — the admin decides whether to
-- approve or reject flagged applicants.
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS age_flagged BOOLEAN DEFAULT FALSE;

-- Copied from invite_codes.invite_type at application time.
-- Allows analytics and the guest list UI to distinguish VIP / friend / guestlist
-- applicants without joining back to invite_codes on every query.
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS invite_type TEXT;

-- ─── Performance indexes ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invite_codes_invite_type ON invite_codes(invite_type);
CREATE INDEX IF NOT EXISTS idx_applications_age_flagged  ON applications(age_flagged);
CREATE INDEX IF NOT EXISTS idx_applications_invite_type  ON applications(invite_type);

-- ─── Post-migration note ─────────────────────────────────────────────────────
-- If you have existing rows in invite_codes that were revoked before this
-- migration (i.e. redeemed = true but revoked_at is still NULL), you can
-- backfill revoked_at to distinguish them from legitimately fully-used codes:
--
--   UPDATE invite_codes
--   SET revoked_at = updated_at   -- or use created_at as a fallback
--   WHERE redeemed = true
--     AND revoked_at IS NULL
--     AND current_uses < max_uses; -- codes that were revoked before being exhausted

