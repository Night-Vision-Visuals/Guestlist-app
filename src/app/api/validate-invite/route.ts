/**
 * @file /api/validate-invite/route.ts
 * POST /api/validate-invite
 *
 * Public endpoint called from the guest login page (/login) immediately after
 * the user enters a 6-character code. It validates the code before showing
 * the full application form, so guests get instant feedback without having to
 * fill in all their details first.
 *
 * Body: { code: string }
 *
 * Validation steps:
 *  1. Find the code by exact plain-text match in `invite_codes.code_hash`
 *     (codes are always stored and compared in uppercase).
 *  2. Reject if `redeemed = true` (covers both revoked codes and fully-used codes).
 *  3. Reject if `current_uses >= max_uses` (marks as redeemed as a side effect).
 *  4. Return `{ success: true }` if all checks pass.
 *
 * No auth required — this is called by guests who don't have an admin session.
 *
 * Error codes:
 *   400 — code is revoked or has no uses remaining
 *   401 — code does not exist
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { code } = await req.json()

    console.log("Validating code:", code)

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 })
    }

    // Find the invitation code using plain text comparison
    const { data: matchedInvitation, error: fetchError } = await supabase
      .from("invite_codes")
      .select("id, code_hash, redeemed, current_uses, max_uses, event_id")
      .eq("code_hash", code.toUpperCase())
      .single()

    if (fetchError || !matchedInvitation) {
      console.log("No matching code found")
      return NextResponse.json({ error: "Invalid code" }, { status: 401 })
    }

    console.log("Code matched:", { id: matchedInvitation.id, redeemed: matchedInvitation.redeemed, current_uses: matchedInvitation.current_uses, max_uses: matchedInvitation.max_uses })

    // Check if code is already redeemed (all uses consumed)
    if (matchedInvitation.redeemed) {
      console.log("Code already redeemed")
      return NextResponse.json(
        { error: "This invitation code has already been fully redeemed" },
        { status: 400 }
      )
    }

    // Check if code has reached max uses
    if (matchedInvitation.current_uses >= matchedInvitation.max_uses) {
      console.log("Max uses reached, marking as redeemed")
      await supabase
        .from("invite_codes")
        .update({ redeemed: true })
        .eq("id", matchedInvitation.id)

      return NextResponse.json(
        { error: "This invitation code has reached its maximum uses" },
        { status: 400 }
      )
    }

    // Code is valid and has uses remaining — fetch event data to return to guest
    console.log("Code valid, uses remaining")

    let eventData = null
    if (matchedInvitation.event_id) {
      const { data: event } = await supabase
        .from("events")
        .select("name, event_date, description, poster_url, guest_limit, min_age, max_age")
        .eq("id", matchedInvitation.event_id)
        .single()
      eventData = event
    }

    return NextResponse.json({ success: true, event: eventData })
  } catch (error) {
    console.error("Validate invite error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}