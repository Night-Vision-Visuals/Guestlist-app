/**
 * @file /api/checkin/route.ts
 * POST /api/checkin — QR-scanner door check-in
 * GET  /api/checkin?token= — look up a guest by QR token (with entry price)
 *
 * POST: Called by the Scanner page after payment confirmation.
 *   - Accepts `{ token, paid? }` in the request body.
 *   - Validates the guest is approved and not already checked in.
 *   - Sets `checked_in = true`, `paid = paid ?? false`, and records `checked_in_at`.
 *   - Returns guest name, check-in timestamp, and paid status on success.
 *   - Returns `alreadyCheckedIn: true` (HTTP 409) if scanned twice.
 *
 * GET: Used to preview a guest record before the check-in action is taken.
 *   Returns guest info including current check-in state, paid status, and
 *   a pre-calculated entryPrice based on event fee and guest tier.
 *
 * Auth: admin JWT cookie required for both methods.
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const admin = await verifyAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token, paid } = await req.json()

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 })
    }

    // Find the application by QR token
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select("id, first_name, last_name, email, status, checked_in, checked_in_at, qr_token, role, invite_type, invitation_code_id, paid")
      .eq("qr_token", token)
      .single()

    if (fetchError || !application) {
      return NextResponse.json({ error: "Invalid or unknown QR code" }, { status: 404 })
    }

    if (application.status !== "approved") {
      return NextResponse.json(
        { error: `Guest is not approved (status: ${application.status})` },
        { status: 400 }
      )
    }

    if (application.checked_in) {
      return NextResponse.json({
        error: "Guest already checked in",
        alreadyCheckedIn: true,
        guest: {
          id: application.id,
          name: `${application.first_name} ${application.last_name}`,
          email: application.email,
          checked_in_at: application.checked_in_at,
          paid: application.paid ?? false,
        }
      }, { status: 409 })
    }

    // Mark as checked in
    const checkinTime = new Date().toISOString()
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        checked_in: true,
        checked_in_at: checkinTime,
        paid: paid ?? false,
      })
      .eq("id", application.id)

    if (updateError) {
      console.error("Check-in update error:", updateError)
      return NextResponse.json({ error: "Failed to check in guest" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      guest: {
        id: application.id,
        name: `${application.first_name} ${application.last_name}`,
        email: application.email,
        checked_in_at: checkinTime,
        paid: paid ?? false,
      }
    })
  } catch (error) {
    console.error("Check-in error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET endpoint to look up a guest by QR token (for validation + price preview)
export async function GET(req: Request) {
  try {
    const admin = await verifyAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 })
    }

    const { data: application, error } = await supabase
      .from("applications")
      .select("id, first_name, last_name, email, status, checked_in, checked_in_at, event_id, role, invite_type, invitation_code_id, paid")
      .eq("qr_token", token)
      .single()

    if (error || !application) {
      return NextResponse.json({ error: "Invalid QR code" }, { status: 404 })
    }

    // Calculate entry price server-side
    let entryPrice = 0
    if (application.event_id) {
      const { data: event } = await supabase
        .from("events")
        .select("entry_fee, friendlist_discount")
        .eq("id", application.event_id)
        .single()

      if (event && event.entry_fee != null) {
        const entryFee: number = event.entry_fee
        const friendlistDiscount: number = event.friendlist_discount ?? 0

        // Staff roles are always free
        if (!application.role || application.role === "guest") {
          // Resolve tier: invite code tier takes priority, then invite_type, then default "guest"
          let tier = application.invite_type ?? "guest"

          if (application.invitation_code_id) {
            const { data: code } = await supabase
              .from("invite_codes")
              .select("tier, invite_type")
              .eq("id", application.invitation_code_id)
              .single()
            if (code) tier = code.tier || code.invite_type || tier
          }

          if (tier === "crew" || tier === "staff") {
            entryPrice = 0
          } else if (tier === "friendlist") {
            entryPrice = Math.round(entryFee * (1 - friendlistDiscount / 100) * 100) / 100
          } else {
            entryPrice = entryFee
          }
        }
      }
    }

    return NextResponse.json({
      id: application.id,
      name: `${application.first_name} ${application.last_name}`,
      email: application.email,
      status: application.status,
      checked_in: application.checked_in || false,
      checked_in_at: application.checked_in_at || null,
      paid: application.paid ?? false,
      invite_type: application.invite_type ?? "guest",
      entryPrice,
    })
  } catch (error) {
    console.error("QR lookup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
