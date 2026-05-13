-- Migration: Friendlist limits + crew +1 feature
-- Run this in your Supabase SQL editor.

-- ── 1. New columns on events ──────────────────────────────────────────────────
-- friendlist_total_limit: max number of manually-generated friendlist invite
--   codes any admin can create in total for this event (NULL = unlimited).
-- plus_one_eligible_roles: array of staff role values (e.g. '{"dj","security"}')
--   whose members automatically receive a free +1 friendlist code on approval.
--   NULL means no roles get +1.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS friendlist_total_limit INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS plus_one_eligible_roles TEXT[] DEFAULT NULL;

-- ── 2. Per-admin friendlist quota per event ────────────────────────────────────
-- Stores how many friendlist codes a specific admin is allowed to generate for
-- a specific event. If no row exists for an admin+event pair the quota is
-- considered unlimited (or constrained only by the event-wide total cap above).

CREATE TABLE IF NOT EXISTS event_admin_settings (
  event_id         UUID    NOT NULL REFERENCES events(id)  ON DELETE CASCADE,
  admin_id         UUID    NOT NULL REFERENCES admins(id)  ON DELETE CASCADE,
  friendlist_quota INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (event_id, admin_id)
);

-- ── 3. New columns on invite_codes ────────────────────────────────────────────
-- is_staff_plus_one: TRUE for auto-generated +1 codes — these are excluded from
--   the manual friendlist quota/cap checks.
-- linked_staff_application_id: FK back to the staff member whose approval
--   triggered the auto-generation of this +1 code. Set to NULL on application
--   deletion (SET NULL) so the code record survives.

ALTER TABLE invite_codes
  ADD COLUMN IF NOT EXISTS is_staff_plus_one           BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS linked_staff_application_id UUID    DEFAULT NULL
    REFERENCES applications(id) ON DELETE SET NULL;

-- Index for fast lookup of +1 codes by staff application
CREATE INDEX IF NOT EXISTS idx_invite_codes_linked_staff
  ON invite_codes (linked_staff_application_id)
  WHERE linked_staff_application_id IS NOT NULL;
