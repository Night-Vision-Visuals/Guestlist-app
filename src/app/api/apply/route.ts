import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { first_name, last_name, date_of_birth, email, instagram, intro, code } = body

    console.log("Apply route called with:", { first_name, last_name, email, code })

    // Validate required fields
    if (!first_name || !last_name || !date_of_birth || !email || !code) {
      console.log("Missing required fields")
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Step 1: Find and validate the invitation code
    const { data: invitations, error: inviteError } = await supabase
      .from("invite_codes")
      .select("id, code_hash, redeemed, current_uses, max_uses")

    if (inviteError) {
      console.error("Error fetching invitations:", inviteError)
      return NextResponse.json(
        { error: "Server error" },
        { status: 500 }
      )
    }

    if (!invitations || invitations.length === 0) {
      console.log("No invitations found")
      return NextResponse.json(
        { error: "Invalid invitation code" },
        { status: 401 }
      )
    }

    console.log(`Found ${invitations.length} invitations`)

    // Find matching code hash
    let matchedInvitation = null
    for (const invite of invitations) {
      try {
        const valid = await bcrypt.compare(code, invite.code_hash)
        if (valid) {
          matchedInvitation = invite
          console.log("Code matched in apply:", { id: invite.id, redeemed: invite.redeemed, current_uses: invite.current_uses, max_uses: invite.max_uses })
          break
        }
      } catch (bcryptError) {
        console.error("Bcrypt error:", bcryptError)
        continue
      }
    }

    if (!matchedInvitation) {
      console.log("No matching invitation found")
      return NextResponse.json(
        { error: "Invalid invitation code" },
        { status: 401 }
      )
    }

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
    console.log("Creating application...")
    const { data: application, error: appError } = await supabase
      .from("applications")
      .insert([
        {
          event_id: process.env.NEXT_PUBLIC_EVENT_ID || null,
          invitation_code_id: matchedInvitation.id,
          first_name,
          last_name,
          date_of_birth,
          email,
          instagram: instagram || null,
          intro: intro || null,
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