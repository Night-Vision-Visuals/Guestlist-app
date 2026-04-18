/**
 * @file /api/manual-checkin/route.ts
 * POST /api/manual-checkin
 *
 * Backup check-in for approved guests when their QR code can't be scanned
 * (e.g. phone battery dead, screenshot quality issues). Admins trigger this
 * from the Applications dashboard via the LogIn icon button on approved rows.
 *
 * Unlike `/api/checkin` (which looks up by QR token), this route looks up the
 * guest directly by their application `id`.
 *
 * Body: { id: string } — the application UUID.
 *
 * Validates:
 *   - Application exists
 *   - Status is "approved" (unapproved guests cannot be checked in)
 *   - Not already checked in (returns 409 if so)
 *
 * On success, sets `checked_in = true` and `checked_in_at = now()`.
 *
 * Auth: admin JWT cookie required.
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

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 })
    }

    // Fetch the application
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select("id, first_name, last_name, status, checked_in")
      .eq("id", id)
      .single()

    if (fetchError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    if (application.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved guests can be checked in" },
        { status: 400 }
      )
    }

    if (application.checked_in) {
      return NextResponse.json({ error: "Guest is already checked in" }, { status: 409 })
    }

    const checkinTime = new Date().toISOString()
    const { error: updateError } = await supabase
      .from("applications")
      .update({ checked_in: true, checked_in_at: checkinTime, paid: true })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to check in guest" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${application.first_name} ${application.last_name} checked in successfully`,
      checked_in_at: checkinTime
    })
  } catch (error) {
    console.error("Manual check-in error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
