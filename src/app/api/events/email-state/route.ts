/**
 * @file /api/events/email-state/route.ts
 * GET /api/events/email-state?eventId=...
 *
 * Returns the email dispatch state for a given event:
 *   - batch_email_sent: boolean
 *   - scheduled_email_send_at: string | null
 *
 * Used by the dashboard to display the Email Dispatch panel state.
 *
 * Auth: admin JWT cookie required.
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const admin = await verifyAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get("eventId")

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("events")
      .select("batch_email_sent, scheduled_email_send_at")
      .eq("id", eventId)
      .single()

    if (error) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({
      batch_email_sent: data.batch_email_sent ?? false,
      scheduled_email_send_at: data.scheduled_email_send_at ?? null,
    })
  } catch (error) {
    console.error("Email state fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
