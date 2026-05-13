/**
 * @file /api/events/admin-quotas/route.ts
 *
 * Manage per-admin friendlist quotas for a specific event.
 * Only the super-admin (username === "Admin") may write to these.
 * Any authenticated admin may read them (so the invites page can show usage).
 *
 * GET  /api/events/admin-quotas?eventId=<uuid>
 *   Returns: Array of { admin_id, username, friendlist_quota,
 *                       codes_used, codes_remaining }
 *
 * POST /api/events/admin-quotas
 *   Body: { event_id: string, quotas: { admin_id: string, friendlist_quota: number }[] }
 *   Upserts rows in event_admin_settings.
 *   Super-admin only.
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const admin = await verifyAdminSession()
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get("eventId")
    if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 })

    // Fetch all admins
    const { data: admins, error: adminsError } = await supabase
      .from("admins")
      .select("id, username")
    if (adminsError || !admins) {
      return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 })
    }

    // Fetch existing quota rows for this event
    const { data: quotaRows, error: quotaError } = await supabase
      .from("event_admin_settings")
      .select("admin_id, friendlist_quota")
      .eq("event_id", eventId)
    if (quotaError) {
      return NextResponse.json({ error: "Failed to fetch quotas" }, { status: 500 })
    }
    const quotaMap = new Map((quotaRows || []).map(r => [r.admin_id, r.friendlist_quota]))

    // Count manually-generated (non-staff-plus-one) friendlist codes per admin for this event
    const { data: codeCounts, error: codeError } = await supabase
      .from("invite_codes")
      .select("created_by_admin_id")
      .eq("event_id", eventId)
      .eq("tier", "friendlist")
      .eq("is_staff_plus_one", false)
    if (codeError) {
      return NextResponse.json({ error: "Failed to fetch code counts" }, { status: 500 })
    }
    const usageMap = new Map<string, number>()
    for (const row of codeCounts || []) {
      usageMap.set(row.created_by_admin_id, (usageMap.get(row.created_by_admin_id) || 0) + 1)
    }

    // Count total non-staff-plus-one friendlist codes for the event
    const totalUsed = codeCounts?.length ?? 0

    // Fetch event total limit
    const { data: eventRow } = await supabase
      .from("events")
      .select("friendlist_total_limit")
      .eq("id", eventId)
      .single()
    const friendlistTotalLimit = eventRow?.friendlist_total_limit ?? null

    const result = admins.map(a => {
      const quota = quotaMap.get(a.id) ?? null
      const used = usageMap.get(a.id) ?? 0
      return {
        admin_id: a.id,
        username: a.username,
        friendlist_quota: quota,
        codes_used: used,
        codes_remaining: quota !== null ? Math.max(0, quota - used) : null,
      }
    })

    return NextResponse.json({
      quotas: result,
      total_used: totalUsed,
      total_limit: friendlistTotalLimit,
    })
  } catch (err) {
    console.error("admin-quotas GET error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdminSession()
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    if (admin.username !== "Admin") {
      return NextResponse.json({ error: "Only Admin can set per-admin quotas" }, { status: 403 })
    }

    const body = await req.json()
    const { event_id, quotas } = body

    if (!event_id || !Array.isArray(quotas)) {
      return NextResponse.json({ error: "event_id and quotas array are required" }, { status: 400 })
    }

    const upsertRows = quotas.map((q: { admin_id: string; friendlist_quota: number }) => ({
      event_id,
      admin_id: q.admin_id,
      friendlist_quota: Math.max(0, parseInt(String(q.friendlist_quota)) || 0),
    }))

    const { error } = await supabase
      .from("event_admin_settings")
      .upsert(upsertRows, { onConflict: "event_id,admin_id" })

    if (error) {
      return NextResponse.json({ error: "Failed to save quotas: " + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("admin-quotas POST error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
