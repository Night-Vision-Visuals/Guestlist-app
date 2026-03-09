import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const admin = await verifyAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: "Application ID is required" }, { status: 400 })
    }

    // Fetch the application
    const { data: application, error: fetchError } = await supabase
      .from("applications")
      .select("id, first_name, last_name, status, checked_in")
      .eq("id", id)
      .single()

    if (fetchError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    if (application.status !== "approved") {
      return NextResponse.json(
        { error: "Only approved guests can be checked in" },
        { status: 400 }
      )
    }

    if (application.checked_in) {
      return NextResponse.json({ error: "Guest is already checked in" }, { status: 409 })
    }

    const checkinTime = new Date().toISOString()
    const { error: updateError } = await supabase
      .from("applications")
      .update({ checked_in: true, checked_in_at: checkinTime })
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to check in guest" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${application.first_name} ${application.last_name} checked in successfully`,
      checked_in_at: checkinTime
    })
  } catch (error) {
    console.error("Manual check-in error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
