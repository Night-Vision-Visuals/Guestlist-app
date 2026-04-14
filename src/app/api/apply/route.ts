/**
 * @file /api/apply/route.ts
 * POST /api/apply
 *
 * Public endpoint — no admin auth required. Called when a guest submits the
 * application form on `/login` after entering a valid invite code.
 *
 * Flow:
 *  1. Validate all required fields (name, DOB, email, gender, heard-about-us,
 *     GDPR consent, invite code).
 *  2. Look up the invite code in `invite_codes` by plain-text match.
 *     - Reject if the code is revoked (`revoked_at IS NOT NULL`).
 *     - Reject if the code has no uses remaining.
 *  3. Insert a new row in `applications` with status `applied`.
 *  4. Increment `invite_codes.current_uses`; mark as `redeemed` when max reached.
 *  5. Return `{ success, applicationId, usesRemaining }`.
 *
 * Error codes:
 *   400 — validation failure or exhausted/revoked code
 *   401 — code not found
 *   500 — database error
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { first_name, last_name, date_of_birth, email, instagram, intro, code, gender, heard_about_us, datenschutz_accepted } = body

    console.log("Apply route called with:", { first_name, last_name, email, code })

    // Validate required fields
    if (!first_name || !last_name || !date_of_birth || !email || !code) {
      console.log("Missing required fields")
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!gender) {
      return NextResponse.json(
        { error: "Please select your gender" },
        { status: 400 }
      )
    }

    if (!heard_about_us) {
      return NextResponse.json(
        { error: "Please tell us how you heard about the party" },
        { status: 400 }
      )
    }

    if (!datenschutz_accepted) {
      return NextResponse.json(
        { error: "You must accept the privacy policy" },
        { status: 400 }
      )
    }

    // Step 1: Find and validate the invitation code using plain text comparison
    const { data: matchedInvitation, error: inviteError } = await supabase
      .from("invite_codes")
      .select("id, code_hash, redeemed, current_uses, max_uses, event_id")
      .eq("code_hash", code.toUpperCase())
      .single()

    if (inviteError || !matchedInvitation) {
      console.log("No matching invitation found")
      return NextResponse.json(
        { error: "Invalid invitation code" },
        { status: 401 }
      )
    }

    console.log("Code matched in apply:", { id: matchedInvitation.id, redeemed: matchedInvitation.redeemed, current_uses: matchedInvitation.current_uses, max_uses: matchedInvitation.max_uses })

    // Check if invitation is already redeemed (all uses consumed)
    if (matchedInvitation.redeemed) {
      console.log("Invitation already redeemed")
      return NextResponse.json(
        { error: "This invitation code has been fully redeemed" },
        { status: 400 }
      )
    }

    // Check if invitation has reached max uses
    if (matchedInvitation.current_uses >= matchedInvitation.max_uses) {
      console.log("Max uses reached")
      return NextResponse.json(
        { error: "This invitation code has reached its maximum uses" },
        { status: 400 }
      )
    }

    // Step 2: Create application record
    // Use the event_id from the invite code so the guest is attached to the
    // correct event, not a hardcoded env variable.
    console.log("Creating application...")
    const { data: application, error: appError } = await supabase
      .from("applications")
      .insert([
        {
          event_id: matchedInvitation.event_id ?? null,
          invitation_code_id: matchedInvitation.id,
          first_name,
          last_name,
          date_of_birth,
          email,
          instagram: instagram || null,
          intro: intro || null,
          gender: gender || null,
          heard_about_us: heard_about_us || null,
          datenschutz_accepted: datenschutz_accepted || false,
          status: "applied"
        }
      ])
      .select()

    if (appError) {
      console.error("Error creating application:", appError)
      return NextResponse.json(
        { error: "Failed to create application" },
        { status: 500 }
      )
    }

    if (!application || application.length === 0) {
      console.error("Application not returned from insert")
      return NextResponse.json(
        { error: "Failed to create application" },
        { status: 500 }
      )
    }

    console.log("Application created:", application[0].id)

    // Step 3: Update invitation code usage
    const newCurrentUses = matchedInvitation.current_uses + 1
    const isNowRedeemed = newCurrentUses >= matchedInvitation.max_uses

    console.log("Updating invitation code:", { newCurrentUses, isNowRedeemed, maxUses: matchedInvitation.max_uses })

    const { error: updateError } = await supabase
      .from("invite_codes")
      .update({
        current_uses: newCurrentUses,
        redeemed: isNowRedeemed,
        redeemed_at: isNowRedeemed ? new Date().toISOString() : null,
        redeemed_by_guest_id: application[0].id
      })
      .eq("id", matchedInvitation.id)

    if (updateError) {
      console.error("Error updating invitation code:", updateError)
    } else {
      console.log("Invitation code updated successfully")
    }

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      applicationId: application[0].id,
      usesRemaining: matchedInvitation.max_uses - newCurrentUses
    })
  } catch (error) {
    console.error("Apply error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}