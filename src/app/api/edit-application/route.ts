import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: Request) {
  try {
    const admin = await verifyAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, email, status } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 })
    }

    const validStatuses = ["applied", "approved", "rejected", "waitlist", "cancelled"]
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Build update object
    const updateData: Record<string, string | null> = {}
    if (email) updateData.email = email
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

    return NextResponse.json({ success: true, message: "Application updated successfully" })
  } catch (error) {
    console.error("Edit application error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
