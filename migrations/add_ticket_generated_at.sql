-- Migration: Add ticket_generated_at column to applications table
-- Run this in your Supabase project: Dashboard → SQL Editor → New Query

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS ticket_generated_at TIMESTAMPTZ DEFAULT NULL;

-- Optional: index for dashboard queries that filter on this column
CREATE INDEX IF NOT EXISTS idx_applications_ticket_generated_at
  ON applications (ticket_generated_at)
  WHERE ticket_generated_at IS NOT NULL;
