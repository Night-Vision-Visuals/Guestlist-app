/**
 * @file /api/invite/create/route.ts
 * POST /api/invite/create
 *
 * Generates a new random 6-character uppercase hex invite code and stores it
 * in `invite_codes`.
 *
 * Body parameters:
 *   tier      {string}  guest | friendlist | staff | crew  (required)
 *   max_uses  {number}  1–100  — only respected for "guest" tier;
 *                               friendlist and staff/crew are locked to max_uses = 1
 *   comment   {string}  optional admin-facing note
 *   event_id  {string}  optional UUID of the event
 *
 * Friendlist limits (only apply when tier === "friendlist" and event_id is set):
 *   - If the event has a `friendlist_total_limit`, the total number of manually-
 *     generated (non-staff-plus-one) friendlist codes for the event must be below
 *     that limit.
 *   - If the admin has a quota in `event_admin_settings`, their personal count
 *     of manually-generated codes must be below that quota.
 *   Staff +1 codes (is_staff_plus_one = true) are NOT counted against these limits.
 *
 * Auth: admin JWT cookie required.
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"
import crypto from "crypto"

const VALID_TIERS = ["guest", "friendlist", "staff", "crew"] // crew kept as legacy alias

export async function POST(req: Request) {
  try {
    const admin = await verifyAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { tier, comment, event_id } = body
    let { max_uses } = body

    // Validate tier
    const resolvedTier = VALID_TIERS.includes(tier) ? tier : "guest"

    // Enforce max_uses = 1 for friendlist and staff (crew is legacy alias for staff)
    if (resolvedTier === "friendlist" || resolvedTier === "staff" || resolvedTier === "crew") {
      max_uses = 1
    } else {
      max_uses = parseInt(max_uses)
      if (!max_uses || max_uses < 1 || max_uses > 100) {
        return NextResponse.json(
          { error: "max_uses must be between 1 and 100" },
          { status: 400 }
        )
      }
    }

    // ── Friendlist quota / cap checks ─────────────────────────────────────────
    // Only applies to manually-generated friendlist codes (not staff +1 auto-codes)
    if (resolvedTier === "friendlist" && event_id) {
      // Fetch event limits
      const { data: eventRow } = await supabase
        .from("events")
        .select("friendlist_total_limit")
        .eq("id", event_id)
        .single()

      const totalLimit = eventRow?.friendlist_total_limit ?? null

      // Count all manually-generated friendlist codes for this event
      const { count: totalCount, error: totalCountError } = await supabase
        .from("invite_codes")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event_id)
        .eq("tier", "friendlist")
        .eq("is_staff_plus_one", false)

      if (totalCountError) {
        return NextResponse.json({ error: "Failed to check friendlist cap" }, { status: 500 })
      }

      const usedTotal = totalCount ?? 0

      // Check event-wide total cap
      if (totalLimit !== null && usedTotal >= totalLimit) {
        return NextResponse.json(
          { error: `Event friendlist cap reached (${usedTotal}/${totalLimit})` },
          { status: 400 }
        )
      }

      // Check per-admin quota
      const { data: quotaRow } = await supabase
        .from("event_admin_settings")
        .select("friendlist_quota")
        .eq("event_id", event_id)
        .eq("admin_id", admin.adminId)
        .single()

      if (quotaRow && quotaRow.friendlist_quota !== null) {
        const adminQuota = quotaRow.friendlist_quota

        const { count: adminCount, error: adminCountError } = await supabase
          .from("invite_codes")
          .select("*", { count: "exact", head: true })
          .eq("event_id", event_id)
          .eq("tier", "friendlist")
          .eq("is_staff_plus_one", false)
          .eq("created_by_admin_id", admin.adminId)

        if (adminCountError) {
          return NextResponse.json({ error: "Failed to check your friendlist quota" }, { status: 500 })
        }

        const usedByAdmin = adminCount ?? 0

        if (usedByAdmin >= adminQuota) {
          return NextResponse.json(
            { error: `Your friendlist quota for this event is full (${usedByAdmin}/${adminQuota})` },
            { status: 400 }
          )
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Generate a random 6-character code (plain text)
    const rawCode = crypto.randomBytes(3).toString("hex").toUpperCase()

    const { data: invite, error: insertError } = await supabase
      .from("invite_codes")
      .insert([
        {
          code_hash: rawCode,
          max_uses,
          current_uses: 0,
          redeemed: false,
          created_by_admin_id: admin.adminId,
          tier: resolvedTier,
          comment: comment || null,
          is_staff_plus_one: false,
          ...(event_id ? { event_id } : {})
        }
      ])
      .select()

    if (insertError) {
      console.error("Database insert error:", insertError)
      return NextResponse.json(
        { error: "Failed to create invitation code: " + insertError.message },
        { status: 500 }
      )
    }

    if (!invite || invite.length === 0) {
      return NextResponse.json({ error: "Failed to create invitation code" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      code: rawCode,
      id: invite[0].id,
      tier: resolvedTier,
      max_uses: invite[0].max_uses,
      created_at: invite[0].created_at,
      message: "Code created successfully."
    })
  } catch (error) {
    console.error("Invite creation error:", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : "unknown") },
      { status: 500 }
    )
  }
}
