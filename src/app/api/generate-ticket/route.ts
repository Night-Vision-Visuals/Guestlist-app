/**
 * POST /api/generate-ticket
 * Called when a guest clicks "Generate Ticket" on their ticket page.
 * Sets ticket_generated_at = now() on the application so the dashboard
 * can track that the guest has viewed and generated their ticket.
 *
 * Body: { token: string }  — the qr_token from the ticket URL
 * Auth: none (public route — token acts as the secret)
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { token } = await req.json()

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Missing token" }, { status: 400 })
    }

    // Find the application by QR token
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select("id, status, ticket_generated_at")
      .eq("qr_token", token)
      .single()

    if (fetchError || !application) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    if (application.status !== "approved") {
      return NextResponse.json({ error: "Ticket is not valid" }, { status: 400 })
    }

    // Already generated — idempotent, just return success
    if (application.ticket_generated_at) {
      return NextResponse.json({ success: true, alreadyGenerated: true })
    }

    // Mark ticket as generated
    const { error: updateError } = await supabase
      .from("applications")
      .update({ ticket_generated_at: new Date().toISOString() })
      .eq("id", application.id)

    if (updateError) {
      console.error("Failed to update ticket_generated_at:", updateError)
      return NextResponse.json({ error: "Failed to generate ticket" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("generate-ticket error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
