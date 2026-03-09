import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    console.log("Fetching invitations list")

    // Check if admin is authenticated
    const admin = await verifyAdminSession()

    if (!admin) {
      console.log("Not authenticated")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("Admin authenticated:", admin.username)

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get("eventId")

    // Fetch invitation codes with admin info, optionally filtered by event
    let query = supabase
      .from("invite_codes")
      .select(`
        *,
        admin:created_by_admin_id (
          id,
          username
        )
      `)
      .order("created_at", { ascending: false })

    if (eventId) {
      query = query.eq("event_id", eventId)
    }

    const { data: invites, error } = await query

    if (error) {
      console.error("Database fetch error:", error)
      return NextResponse.json(
        { error: "Failed to fetch invitation codes" },
        { status: 500 }
      )
    }

    console.log("Invites fetched:", invites?.length || 0)
    return NextResponse.json(invites || [])
  } catch (error) {
    console.error("Invite list error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}