import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

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

    const { error } = await supabase
      .from("applications")
      .update(updateData)
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 })
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