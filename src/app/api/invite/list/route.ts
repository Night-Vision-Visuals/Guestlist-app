import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"

export async function GET() {
  try {
    // Check if admin is authenticated
    const admin = await verifyAdminSession()

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch all invitation codes
    const { data: invites, error } = await supabase
      .from("invitation_codes")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database fetch error:", error)
      return NextResponse.json(
        { error: "Failed to fetch invitation codes" },
        { status: 500 }
      )
    }

    return NextResponse.json(invites || [])
  } catch (error) {
    console.error("Invite list error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}