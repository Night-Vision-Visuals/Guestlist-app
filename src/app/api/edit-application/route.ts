/**
 * @file /api/edit-application/route.ts
 * POST /api/edit-application
 *
 * Allows admins to directly edit an existing application's email address or
 * status from the Applications dashboard tab (pencil icon → inline form).
 *
 * Accepted status values: applied | approved | rejected | waitlist | cancelled
 *
 * Special behaviour when setting status to "approved":
 *   - If the application doesn't already have a `qr_token`, one is generated
 *     (UUID v4). This token powers the `/ticket/[token]` QR ticket page.
 *
 * Email behaviour:
 *   If the event's batch_email_sent flag is true (batch was already sent),
 *   newly approved or rejected guests receive their email immediately.
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
    const admin = await verifyAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, email, status, first_name, last_name, role, role_note, gender } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 })
    }

    const validStatuses = ["applied", "approved", "rejected", "waitlist", "cancelled"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Build update object
    const updateData: Record<string, string | null> = {}
    if (email !== undefined) updateData.email = email
    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name
    if (role !== undefined) updateData.role = role
    if (role_note !== undefined) updateData.role_note = role_note
    if (status) {
      updateData.status = status
      // If newly approving, generate QR token if not already present
      if (status === "approved") {
        const { data: existing } = await supabase
          .from("applications")
          .select("qr_token")
          .eq("id", id)
          .single()
        if (!existing?.qr_token) {
          updateData.qr_token = uuidv4()
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from("applications")
      .update(updateData)
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update application: " + updateError.message }, { status: 500 })
    }

    // If setting to approved or rejected, check if batch was already sent
    if (status === "approved" || status === "rejected") {
      const { data: appRow } = await supabase
        .from("applications")
        .select("event_id")
        .eq("id", id)
        .single()

      if (appRow?.event_id) {
        const batchAlreadySent = await isBatchSent(appRow.event_id)
        if (batchAlreadySent) {
          sendSingleEmail(id).catch((err) =>
            console.error("Immediate email send failed for", id, err)
          )
        }
      }
    }

    return NextResponse.json({ success: true, message: "Application updated successfully" })
  } catch (error) {
    console.error("Edit application error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
