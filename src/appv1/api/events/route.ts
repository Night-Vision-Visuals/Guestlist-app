import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"

export async function GET() {
  try {
    console.log("Fetching events")

    // Check if admin is authenticated
    const admin = await verifyAdminSession()

    if (!admin) {
      console.log("Not authenticated")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    console.log("Admin authenticated:", admin.username)

    // Fetch all events ordered by date (most recent first)
    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false })

    if (error) {
      console.error("Database fetch error:", error)
      return NextResponse.json(
        { error: "Failed to fetch events" },
        { status: 500 }
      )
    }

    console.log("Events fetched:", events?.length || 0)
    return NextResponse.json(events || [])
  } catch (error) {
    console.error("Events fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}