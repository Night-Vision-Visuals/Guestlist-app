/**
 * @file /api/decline-invite/route.ts
 * POST /api/decline-invite
 *
 * Public endpoint called when a guest explicitly declines to join an event
 * at the confirmation step on the event-info screen (after validating their
 * invite code but before completing registration).
 *
 * Marks the invite code as redeemed AND sets `declined_at` so it can be
 * distinguished from a legitimately fully-used code in the admin dashboard.
 * This prevents the same code from being reused after a decline.
 *
 * Body: { code: string }
 *
 * No auth required — called by guests without an admin session.
 *
 * Error codes:
 *   400 — code already redeemed/declined
 *   401 — code not found
 *   500 — internal error
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 })
    }

    // Find the invitation code
    const { data: matchedInvitation, error: fetchError } = await supabase
      .from("invite_codes")
      .select("id, code_hash, redeemed, declined_at")
      .eq("code_hash", code.toUpperCase())
      .single()

    if (fetchError || !matchedInvitation) {
      return NextResponse.json({ error: "Invalid code" }, { status: 401 })
    }

    // If already redeemed or declined, treat as success (idempotent)
    if (matchedInvitation.redeemed || matchedInvitation.declined_at) {
      return NextResponse.json({ success: true })
    }

    // Mark as redeemed + declined
    const { error: updateError } = await supabase
      .from("invite_codes")
      .update({
        redeemed: true,
        declined_at: new Date().toISOString(),
      })
      .eq("id", matchedInvitation.id)

    if (updateError) {
      console.error("Error marking code as declined:", updateError)
      return NextResponse.json({ error: "Failed to process decline" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Decline invite error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
