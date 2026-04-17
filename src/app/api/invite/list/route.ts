/**
 * @file /api/invite/list/route.ts
 * GET /api/invite/list?eventId=<uuid>
 *
 * Returns all invite codes, optionally filtered to a specific event.
 * Each row is joined with the `admins` table to include the `username` of the
 * admin who created the code (used for the "Created By" column in the UI).
 * Results are sorted newest-first.
 *
 * The `invite_type` column (guestlist | friend | vip | instagram | etc.) is
 * included so the UI can display the appropriate label/icon per code.
 *
 * Auth: admin JWT cookie required.
 */
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
        admins:created_by_admin_id (
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