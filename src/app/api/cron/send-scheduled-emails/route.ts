/**
 * @file /api/cron/send-scheduled-emails/route.ts
 * GET /api/cron/send-scheduled-emails
 *
 * Checks for events where:
 *   - scheduled_email_send_at <= NOW()
 *   - batch_email_sent = false (or null)
 *
 * For each such event, fires sendPendingEmails() and marks batch_email_sent = true.
 *
 * This route is called:
 *   1. Silently on dashboard load (client-side fetch with credentials)
 *   2. Optionally by an external cron/scheduler pointing to this URL
 *
 * Protected by CRON_SECRET header to prevent public abuse.
 * The dashboard calls this with the admin cookie, which also satisfies auth.
 *
 * Auth: admin JWT cookie OR X-Cron-Secret header matching CRON_SECRET env var.
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"
import { sendPendingEmails, markBatchSent } from "@/lib/sendEmails"

export async function GET(req: Request) {
  try {
    // Allow either admin session OR cron secret header
    const cronSecret = process.env.CRON_SECRET
    const headerSecret = req.headers.get("x-cron-secret")

    const isAdminAuthed = await verifyAdminSession().catch(() => null)
    const isCronAuthed = cronSecret && headerSecret === cronSecret

    if (!isAdminAuthed && !isCronAuthed) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date().toISOString()

    // Find events that have a scheduled send time that has passed and batch not yet sent
    const { data: events, error } = await supabase
      .from("events")
      .select("id, name")
      .lte("scheduled_email_send_at", now)
      .eq("batch_email_sent", false)

    if (error) {
      return NextResponse.json({ error: "DB error: " + error.message }, { status: 500 })
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ success: true, processed: 0 })
    }

    const results: Record<string, unknown> = {}

    for (const event of events) {
      const result = await sendPendingEmails(event.id)
      await markBatchSent(event.id)
      results[event.name] = result
    }

    return NextResponse.json({ success: true, processed: events.length, results })
  } catch (error) {
    console.error("Cron send error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
