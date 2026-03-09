/**
 * @file supabase.ts
 * Supabase client singleton for the entire application.
 *
 * Uses the public anon key, which is safe to use on both the client and server.
 * Row Level Security (RLS) policies in Supabase control what each role can access.
 *
 * Required environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL   — your Supabase project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY — the project's anonymous/public API key
 *
 * All API routes and server components import this singleton rather than
 * creating their own Supabase instances to avoid connection overhead.
 */
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)