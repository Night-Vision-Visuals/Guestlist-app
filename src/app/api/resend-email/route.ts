/**
 * @file /api/resend-email/route.ts
 * POST /api/resend-email
 *
 * Force-resends the approval email to a single approved guest.
 * Works regardless of whether an email was previously sent.
 * Updates email_sent_at so the guest is counted as emailed.
 *
 * Body: { id: string }  — application ID
 * Returns: { success: true, sent: number, errors: string[] }
 *
 * Auth: admin JWT cookie required.
 */
import { NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/auth"
import { resendEmailForApplication } from "@/lib/sendEmails"

export async function POST(req: Request) {
  try {
    const admin = await verifyAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const result = await resendEmailForApplication(id)

    if (result.errors.length > 0 && result.sent === 0) {
      return NextResponse.json({ error: result.errors[0] }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      sent: result.sent,
      errors: result.errors,
    })
  } catch (error) {
    console.error("Resend email error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
