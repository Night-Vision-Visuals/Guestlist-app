/**
 * @file /api/events/schedule-email/route.ts
 * POST /api/events/schedule-email
 *
 * Sets or clears the scheduled_email_send_at datetime on an event.
 * When this time is reached, the cron route will auto-fire the batch send.
 *
 * Body: { eventId: string, scheduledAt: string | null }
 *   scheduledAt — ISO 8601 datetime string, or null to clear the schedule
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

    const { eventId, scheduledAt } = await req.json()
    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("events")
      .update({ scheduled_email_send_at: scheduledAt || null })
      .eq("id", eventId)

    if (error) {
      return NextResponse.json(
        { error: "Failed to update schedule: " + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Schedule email error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
