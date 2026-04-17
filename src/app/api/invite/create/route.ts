/**
 * @file /api/invite/create/route.ts
 * POST /api/invite/create
 *
 * Generates a new random 6-character uppercase hex invite code and stores it
 * in `invite_codes`.
 *
 * Body parameters:
 *   tier      {string}  guest | friendlist | crew  (required)
 *   max_uses  {number}  1–100  — only respected for "guest" tier;
 *                               friendlist and crew are locked to max_uses = 1
 *   comment   {string}  optional admin-facing note
 *   event_id  {string}  optional UUID of the event
 *
 * Auth: admin JWT cookie required.
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"
import crypto from "crypto"

const VALID_TIERS = ["guest", "friendlist", "crew"]

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

    // Enforce max_uses = 1 for friendlist and crew
    if (resolvedTier === "friendlist" || resolvedTier === "crew") {
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
