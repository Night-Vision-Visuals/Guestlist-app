/**
 * @file /api/manual-guest/route.ts
 * POST /api/manual-guest
 *
 * Creates a manually-added guest or staff member for an event. Used by the
 * dashboard "Add Staff / Add Guest" modal. Bypasses the public application form
 * — no DOB or intro required. The record is inserted with status "approved" and
 * a generated QR token so the person can be scanned at the door.
 *
 * Body:
 *   event_id      string   (required)
 *   first_name    string   (required)
 *   last_name     string   (required)
 *   email         string   (optional — defaults to empty string)
 *   role          string   (required — "guest" | "dj" | "security" | "bar_staff" | "general_staff" | "awareness" | "other")
 *   role_note     string   (optional — free text note, e.g. "playing 02:00–04:00")
 *
 * Auth: admin JWT cookie required.
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

const VALID_ROLES = ["guest", "dj", "security", "bar_staff", "general_staff", "awareness", "other"]

export async function POST(req: Request) {
  try {
    const admin = await verifyAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { event_id, first_name, last_name, email = "", role, role_note = "" } = body

    if (!event_id || !first_name || !last_name || !role) {
      return NextResponse.json(
        { error: "event_id, first_name, last_name and role are required" },
        { status: 400 }
      )
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
        { status: 400 }
      )
    }

    // Verify the event exists
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id")
      .eq("id", event_id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    const qr_token = uuidv4()

    const { data, error } = await supabase
      .from("applications")
      .insert({
        event_id,
        first_name,
        last_name,
        email,
        role,
        role_note: role_note || null,
        status: "approved",
        qr_token,
        checked_in: false,
        no_show_count: 0,
        // Placeholder DOB — staff don't need age validation
        date_of_birth: "1990-01-01",
        age_flagged: false,
      })
      .select()
      .single()

    if (error) {
      console.error("Insert error:", error)
      return NextResponse.json({ error: "Failed to create guest" }, { status: 500 })
    }

    return NextResponse.json({ success: true, application: data })
  } catch (error) {
    console.error("Manual guest error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
