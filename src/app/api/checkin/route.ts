/**
 * @file /api/checkin/route.ts
 * POST /api/checkin — QR-scanner door check-in
 * GET  /api/checkin?token= — look up a guest by QR token
 *
 * POST: Called by the Scanner page when a QR code is successfully decoded.
 *   - Accepts `{ token }` in the request body.
 *   - Validates the guest is approved and not already checked in.
 *   - Sets `checked_in = true` and records `checked_in_at`.
 *   - Returns guest name and check-in timestamp on success.
 *   - Returns `alreadyCheckedIn: true` (HTTP 409) if scanned twice — the scanner
 *     page shows a yellow "already checked in" card instead of an error.
 *
 * GET: Used to preview a guest record before the check-in action is taken.
 *   Returns guest info including current check-in state.
 *
 * Auth: admin JWT cookie required for both methods.
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    // Check if admin is authenticated
    const admin = await verifyAdminSession()

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 })
    }

    // Find the application by QR token
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select("id, first_name, last_name, email, status, checked_in, checked_in_at, qr_token")
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
          checked_in_at: application.checked_in_at
        }
      }, { status: 409 })
    }

    // Mark as checked in
    const checkinTime = new Date().toISOString()
    const { error: updateError } = await supabase
      .from("applications")
      .update({
        checked_in: true,
        checked_in_at: checkinTime
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
        checked_in_at: checkinTime
      }
    })
  } catch (error) {
    console.error("Check-in error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET endpoint to look up a guest by QR token (for validation)
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
      .select("id, first_name, last_name, email, status, checked_in, checked_in_at, event_id")
      .eq("qr_token", token)
      .single()

    if (error || !application) {
      return NextResponse.json({ error: "Invalid QR code" }, { status: 404 })
    }

    return NextResponse.json({
      id: application.id,
      name: `${application.first_name} ${application.last_name}`,
      email: application.email,
      status: application.status,
      checked_in: application.checked_in || false,
      checked_in_at: application.checked_in_at || null
    })
  } catch (error) {
    console.error("QR lookup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
