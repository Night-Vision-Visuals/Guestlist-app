/**
 * @file /api/invite/revoke/route.ts
 * POST /api/invite/revoke
 *
 * Revokes an invite code so it can no longer be used, while preserving the
 * row and its usage history in the database.
 *
 * Sets both:
 *   - `redeemed = true`            — blocks further use in validate/apply routes
 *   - `revoked_at = <timestamp>`   — distinguishes "revoked" from "fully used" in the UI
 *
 * Body: { id: string } — the UUID of the invite_codes row to revoke.
 *
 * Status display logic (in the Invitations UI):
 *   revoked_at IS NOT NULL  → "Revoked" (red)
 *   redeemed = true         → "Fully Used" (yellow)
 *   current_uses >= max_uses → "Exhausted" (orange)
 *   otherwise               → "Active" (green)
 *
 * Auth: admin JWT cookie required.
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    console.log("Revoke invitation endpoint called")

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

    const { id } = await req.json()

    if (!id) {
      return NextResponse.json(
        { error: "Invitation code ID is required" },
        { status: 400 }
      )
    }

    console.log("Revoking invitation:", id)

    const { error } = await supabase
      .from("invite_codes")
      .update({ 
        redeemed: true,
        revoked_at: new Date().toISOString()
      })
      .eq("id", id)

    if (error) {
      console.error("Database update error:", error)
      return NextResponse.json(
        { error: "Failed to revoke invitation code: " + error.message },
        { status: 500 }
      )
    }

    console.log("Invitation revoked successfully")

    return NextResponse.json({ 
      success: true, 
      message: "Invitation code revoked" 
    })
  } catch (error) {
    console.error("Invite revoke error:", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : "unknown") },
      { status: 500 }
    )
  }
}