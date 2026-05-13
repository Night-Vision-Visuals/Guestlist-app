/**
 * @file /api/invite/staff-plus-one/route.ts
 * GET /api/invite/staff-plus-one?appId=<uuid>[&appId=<uuid>...]
 *
 * Returns the +1 invite code(s) linked to one or more staff application IDs.
 * Used by the dashboard staff tab to display and manage +1 codes.
 *
 * When called with a single appId, also returns `codeId` for revocation.
 *
 * Response:
 *   {
 *     codes: { [applicationId]: string | null },  // code_hash or null if none/revoked
 *     codeId?: string  // invite_codes.id — only when single appId provided
 *   }
 *
 * Auth: admin JWT cookie required.
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const admin = await verifyAdminSession()
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const appIds = searchParams.getAll("appId")

    if (appIds.length === 0) {
      return NextResponse.json({ codes: {} })
    }

    const { data: codes, error } = await supabase
      .from("invite_codes")
      .select("id, code_hash, linked_staff_application_id, revoked_at")
      .in("linked_staff_application_id", appIds)
      .eq("is_staff_plus_one", true)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch +1 codes" }, { status: 500 })
    }

    // Build map: application_id → active code_hash (null if revoked)
    const codesMap: Record<string, string | null> = {}
    let singleCodeId: string | undefined

    for (const appId of appIds) {
      // Find the most recently created non-revoked code for this application
      const match = (codes || [])
        .filter(c => c.linked_staff_application_id === appId)
        .sort((a, b) => (a.revoked_at ? 1 : 0) - (b.revoked_at ? 1 : 0))[0]

      if (!match) {
        codesMap[appId] = undefined as unknown as null // not set — don't show "no +1" for ineligible roles
      } else if (match.revoked_at) {
        codesMap[appId] = null // was revoked
        if (appIds.length === 1) singleCodeId = match.id
      } else {
        codesMap[appId] = match.code_hash
        if (appIds.length === 1) singleCodeId = match.id
      }
    }

    return NextResponse.json({ codes: codesMap, codeId: singleCodeId })
  } catch (err) {
    console.error("staff-plus-one GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
