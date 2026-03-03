import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { code } = await req.json()

    console.log("Validating code:", code)

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 })
    }

    // Fetch all invitation codes
    const { data: invitations, error: fetchError } = await supabase
      .from("invite_codes")
      .select("id, code_hash, redeemed, current_uses, max_uses")

    if (fetchError) {
      console.error("Error fetching invitations:", fetchError)
      return NextResponse.json({ error: "Server error" }, { status: 500 })
    }

    if (!invitations || invitations.length === 0) {
      console.log("No invitations found in database")
      return NextResponse.json({ error: "Invalid code" }, { status: 401 })
    }

    console.log(`Found ${invitations.length} invitations to check`)

    // Find matching code hash
    let matchedInvitation = null
    for (const invite of invitations) {
      try {
        const valid = await bcrypt.compare(code, invite.code_hash)
        if (valid) {
          matchedInvitation = invite
          console.log("Code matched:", { id: invite.id, redeemed: invite.redeemed, current_uses: invite.current_uses, max_uses: invite.max_uses })
          break
        }
      } catch (bcryptError) {
        console.error("Bcrypt comparison error:", bcryptError)
        continue
      }
    }

    // Code not found
    if (!matchedInvitation) {
      console.log("No matching code found")
      return NextResponse.json({ error: "Invalid code" }, { status: 401 })
    }

    // Check if code is already redeemed (all uses consumed)
    if (matchedInvitation.redeemed) {
      console.log("Code already redeemed")
      return NextResponse.json(
        { error: "This invitation code has already been fully redeemed" },
        { status: 400 }
      )
    }

    // Check if code has reached max uses
    if (matchedInvitation.current_uses >= matchedInvitation.max_uses) {
      console.log("Max uses reached, marking as redeemed")
      // Mark as redeemed since max uses reached
      const { error: updateError } = await supabase
        .from("invite_codes")
        .update({ redeemed: true })
        .eq("id", matchedInvitation.id)

      if (updateError) {
        console.error("Error updating invitation code:", updateError)
      }

      return NextResponse.json(
        { error: "This invitation code has reached its maximum uses" },
        { status: 400 }
      )
    }

    // Code is valid and has uses remaining
    console.log("Code valid, uses remaining")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Validate invite error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}