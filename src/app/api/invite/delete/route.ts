/**
 * @file /api/invite/delete/route.ts
 * POST /api/invite/delete
 *
 * Permanently removes an invite code record from the database.
 * Unlike revoking (which preserves the row and sets `revoked_at`), deletion
 * is irreversible and removes all history for that code.
 *
 * Body: { id: string } — the UUID of the invite_codes row to delete.
 *
 * Auth: admin JWT cookie required.
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const admin = await verifyAdminSession()

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json({ error: "Invitation code ID is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("invite_codes")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete invitation code: " + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: "Invitation code deleted" })
  } catch (error) {
    console.error("Invite delete error:", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : "unknown") },
      { status: 500 }
    )
  }
}
