/**
 * @file /api/update-status/route.ts
 * POST /api/update-status
 *
 * Primary status-change endpoint used by the Applications tab action buttons
 * (Approve, Reject, Waitlist, Cancel).
 *
 * Body: { id: string, action: "approve" | "reject" | "waitlist" | "cancelled" }
 *
 * Action behaviour:
 *   "approve"   — checks current approved count; if < 130 sets status "approved"
 *                 and generates a UUID QR token stored in `qr_token`. If ≥ 130,
 *                 auto-moves to "waitlist" instead. The QR token powers the
 *                 /ticket/[token] page the guest uses for door entry.
 *   "reject"    — sets status "rejected"
 *   "waitlist"  — sets status "waitlist"
 *   "cancelled" — sets status "cancelled" (guest-initiated; not treated as no-show)
 *
 * Email behaviour:
 *   If the event's batch_email_sent flag is true (batch was already sent),
 *   newly approved or rejected guests receive their email immediately.
 *   Otherwise they are queued and will be included in the next batch send.
 *
 * The 130-guest cap is hardcoded here. Adjust it if the venue capacity changes.
 *
 * Returns { success: true, qr_token? } on success.
 *
 * Auth: admin JWT cookie required.
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"
import { isBatchSent, sendSingleEmail } from "@/lib/sendEmails"

export async function POST(req: Request) {
  try {
    // Check if admin is authenticated
    const admin = await verifyAdminSession()

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id, action } = await req.json()

    if (!id || !action) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    let newStatus = ""
    let qrToken: string | null = null

    if (action === "cancelled") {
      newStatus = "cancelled"
    }

    if (action === "approve") {
      // Count approved
      const { count } = await supabase
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved")

      if (count && count >= 130) {
        newStatus = "waitlist"
      } else {
        newStatus = "approved"
        // Generate a unique QR token for approved guests
        qrToken = uuidv4()
      }
    }

    if (action === "reject") {
      newStatus = "rejected"
    }

    if (action === "waitlist") {
      newStatus = "waitlist"
    }

    const updateData: Record<string, string | null> = { status: newStatus }
    if (qrToken) {
      updateData.qr_token = qrToken
    }

    const { data: appRow, error: fetchError } = await supabase
      .from("applications")
      .select("event_id")
      .eq("id", id)
      .single()

    if (fetchError || !appRow) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    const { error } = await supabase
      .from("applications")
      .update(updateData)
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 })
    }

    // If batch has already been sent, email this guest immediately
    if (newStatus === "approved" || newStatus === "rejected") {
      const batchAlreadySent = await isBatchSent(appRow.event_id)
      if (batchAlreadySent) {
        // Fire-and-forget — don't block the response on email delivery
        sendSingleEmail(id).catch((err) =>
          console.error("Immediate email send failed for", id, err)
        )
      }
    }

    return NextResponse.json({ success: true, qr_token: qrToken })
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}