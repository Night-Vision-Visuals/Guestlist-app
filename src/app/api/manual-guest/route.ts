/**
 * @file /api/manual-guest/route.ts
 * POST /api/manual-guest
 *
 * Creates a manually-added guest or staff member for an event. Used by the
 * dashboard "Add Staff / Add Guest" modal. The record is inserted with
 * status "approved" and a generated QR token so the person can be scanned
 * at the door. The admin who added the record is stored in added_by_admin_id.
 *
 * Body:
 *   event_id      string   (required)
 *   first_name    string   (required)
 *   last_name     string   (required)
 *   email         string   (required)
 *   gender        string   (required)
 *   role          string   (required — "guest" | "dj" | "security" | "bar_staff" | "general_staff" | "awareness" | "other")
 *   role_note     string   (optional)
 *   date_of_birth string   (required for guests, optional for staff — defaults to 1990-01-01)
 *   invite_type   string   (optional — "guest" | "friendlist")
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
    const { event_id, first_name, last_name, email, gender, role, role_note = "", date_of_birth, invite_type } = body

    if (!event_id || !first_name || !last_name || !role) {
      return NextResponse.json(
        { error: "event_id, first_name, last_name and role are required" },
        { status: 400 }
      )
    }

    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    if (!gender || !gender.trim()) {
      return NextResponse.json({ error: "Gender is required" }, { status: 400 })
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
        email: email.trim(),
        gender,
        role,
        role_note: role_note || null,
        invite_type: invite_type || (role === "guest" ? "guest" : null),
        status: "approved",
        qr_token,
        checked_in: false,
        no_show_count: 0,
        date_of_birth: date_of_birth || "1990-01-01",
        age_flagged: false,
        added_by_admin_id: admin.adminId,
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
