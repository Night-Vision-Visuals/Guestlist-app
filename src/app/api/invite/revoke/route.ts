import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"

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

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json(
        { error: "Invitation code ID is required" },
        { status: 400 }
      )
    }

    // Revoke the invitation code
    const { error } = await supabase
      .from("invitation_codes")
      .update({ redeemed: true, revoked_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("Database update error:", error)
      return NextResponse.json(
        { error: "Failed to revoke invitation code" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: "Invitation code revoked" })
  } catch (error) {
    console.error("Invite revoke error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}