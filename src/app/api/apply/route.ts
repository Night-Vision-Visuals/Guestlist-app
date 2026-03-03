import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { first_name, last_name, date_of_birth, email, instagram, intro, code } = body

    // Validate required fields
    if (!first_name || !last_name || !date_of_birth || !email || !code) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Step 1: Find and validate the invitation code
    const { data: invitations, error: inviteError } = await supabase
      .from("invite_codes")
      .select("id, code_hash, redeemed, current_uses, max_uses")
      .eq("redeemed", false)

    if (inviteError || !invitations) {
      console.error("Error fetching invitations:", inviteError)
      return NextResponse.json(
        { error: "Server error" },
        { status: 500 }
      )
    }

    // Find matching code hash
    let matchedInvitation = null
    for (const invite of invitations) {
      const valid = await bcrypt.compare(code, invite.code_hash)
      if (valid) {
        matchedInvitation = invite
        break
      }
    }

    if (!matchedInvitation) {
      return NextResponse.json(
        { error: "Invalid invitation code" },
        { status: 401 }
      )
    }

    // Check if invitation has reached max uses
    if (matchedInvitation.current_uses >= matchedInvitation.max_uses) {
      return NextResponse.json(
        { error: "This invitation code has reached its maximum uses" },
        { status: 400 }
      )
    }

    // Step 2: Create application record
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

    if (appError || !application) {
      console.error("Error creating application:", appError)
      return NextResponse.json(
        { error: "Failed to create application" },
        { status: 500 }
      )
    }

    // Step 3: Update invitation code as used
    const { error: updateError } = await supabase
      .from("invite_codes")
      .update({
        redeemed: true,
        redeemed_at: new Date().toISOString(),
        redeemed_by_guest_id: application[0].id,
        current_uses: matchedInvitation.current_uses + 1
      })
      .eq("id", matchedInvitation.id)

    if (updateError) {
      console.error("Error updating invitation code:", updateError)
      // Don't fail the request - application was created successfully
    }

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      applicationId: application[0].id
    })
  } catch (error) {
    console.error("Apply error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}