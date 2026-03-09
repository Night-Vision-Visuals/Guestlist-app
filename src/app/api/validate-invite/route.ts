import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  try {
    const { code } = await req.json()

    console.log("Validating code:", code)

    if (!code) {
      return NextResponse.json({ error: "No code provided" }, { status: 400 })
    }

    // Find the invitation code using plain text comparison
    const { data: matchedInvitation, error: fetchError } = await supabase
      .from("invite_codes")
      .select("id, code_hash, redeemed, current_uses, max_uses")
      .eq("code_hash", code.toUpperCase())
      .single()

    if (fetchError || !matchedInvitation) {
      console.log("No matching code found")
      return NextResponse.json({ error: "Invalid code" }, { status: 401 })
    }

    console.log("Code matched:", { id: matchedInvitation.id, redeemed: matchedInvitation.redeemed, current_uses: matchedInvitation.current_uses, max_uses: matchedInvitation.max_uses })

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
      await supabase
        .from("invite_codes")
        .update({ redeemed: true })
        .eq("id", matchedInvitation.id)

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