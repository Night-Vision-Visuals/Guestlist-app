/**
 * @file /api/send-emails/route.ts
 * POST /api/send-emails
 *
 * Manually triggers the batch email send for a given event.
 * Sends emails to all approved/rejected guests who have not yet received one.
 * After sending, marks the event's batch_email_sent flag as true.
 *
 * Body: { eventId: string }
 * Returns: { success: true, sent: number, failed: number, errors: string[] }
 *
 * Auth: admin JWT cookie required.
 */
import { NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/auth"
import { sendPendingEmails, markBatchSent } from "@/lib/sendEmails"

export async function POST(req: Request) {
  try {
    const admin = await verifyAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { eventId } = await req.json()
    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 })
    }

    const result = await sendPendingEmails(eventId)

    // Mark batch as sent even if some individual sends failed —
    // future approvals/rejections will trigger immediate sends.
    await markBatchSent(eventId)

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      skipped: result.skipped,
      errors: result.errors,
    })
  } catch (error) {
    console.error("Send emails error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
