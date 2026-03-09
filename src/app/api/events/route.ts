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

export async function POST(req: Request) {
  try {
    const admin = await verifyAdminSession()

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, event_date, location, description, guest_limit, poster_url } = body

    if (!name || !event_date) {
      return NextResponse.json(
        { error: "Event name and date are required" },
        { status: 400 }
      )
    }

    const insertData: Record<string, string | number | null> = {
      name,
      event_date,
      location: location || null,
      description: description || null,
      guest_limit: guest_limit ? parseInt(guest_limit) : null,
      poster_url: poster_url || null,
    }

    const { data: event, error } = await supabase
      .from("events")
      .insert([insertData])
      .select()

    if (error) {
      console.error("Event insert error:", error)
      return NextResponse.json(
        { error: "Failed to create event: " + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, event: event?.[0] })
  } catch (error) {
    console.error("Event creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}