import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    console.log("Create invitation endpoint called")

    // Check if admin is authenticated
    const admin = await verifyAdminSession()

    if (!admin) {
      console.log("Not authenticated")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("Admin authenticated:", admin.username, "ID:", admin.adminId)

    const body = await req.json()
    const { max_uses, event_id } = body

    console.log("Create invitation with:", { max_uses, event_id })

    // Validate input
    if (!max_uses || max_uses < 1 || max_uses > 100) {
      return NextResponse.json(
        { error: "max_uses must be between 1 and 100" },
        { status: 400 }
      )
    }

    // Generate a random 6-character code (plain text)
    const rawCode = crypto.randomBytes(3).toString("hex").toUpperCase()
    
    console.log("Generated code:", rawCode)

    // Insert into database - store the code as plain text in code_hash column
    const { data: invite, error: insertError } = await supabase
      .from("invite_codes")
      .insert([
        {
          code_hash: rawCode,
          max_uses,
          current_uses: 0,
          redeemed: false,
          created_by_admin_id: admin.adminId,
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
      console.error("No invite returned from insert")
      return NextResponse.json(
        { error: "Failed to create invitation code" },
        { status: 500 }
      )
    }

    console.log("Invitation created:", invite[0].id)

    return NextResponse.json({
      success: true,
      code: rawCode,
      id: invite[0].id,
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