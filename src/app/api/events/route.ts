/**
 * @file /api/events/route.ts
 * Full CRUD for the `events` table.
 *
 * GET    /api/events         — list all events, newest first
 * POST   /api/events         — create a new event
 * PATCH  /api/events         — update fields on an existing event
 * DELETE /api/events         — delete an event (restricted to username "Admin")
 *
 * Fields managed:
 *   name, event_date, description, guest_limit, poster_url,
 *   min_age (default 18), max_age (optional),
 *   friendlist_total_limit (optional), plus_one_eligible_roles (optional text[])
 *
 * The DELETE method performs an extra username check (admin.username === "Admin")
 * in addition to the standard JWT auth, so only the designated super-admin
 * account can permanently remove event records.
 *
 * Auth: admin JWT cookie required for all methods.
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"

export async function GET() {
  try {
    const admin = await verifyAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: events, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
    }

    return NextResponse.json(events || [])
  } catch (error) {
    console.error("Events fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, event_date, description, guest_limit, poster_url, min_age, max_age, entry_fee, friendlist_discount, friendlist_total_limit, plus_one_eligible_roles } = body

    if (!name || !event_date) {
      return NextResponse.json({ error: "Event name and date are required" }, { status: 400 })
    }

    const insertData: Record<string, string | number | boolean | null | string[]> = {
      name,
      event_date,
      description: description || null,
      guest_limit: guest_limit ? parseInt(guest_limit) : null,
      poster_url: poster_url || null,
      min_age: min_age ? parseInt(min_age) : 18,
      max_age: max_age ? parseInt(max_age) : null,
      entry_fee: entry_fee !== undefined && entry_fee !== "" ? parseFloat(entry_fee) : null,
      friendlist_discount: friendlist_discount !== undefined && friendlist_discount !== "" ? parseInt(friendlist_discount) : null,
      friendlist_total_limit: friendlist_total_limit !== undefined && friendlist_total_limit !== "" ? parseInt(friendlist_total_limit) : null,
      plus_one_eligible_roles: Array.isArray(plus_one_eligible_roles) && plus_one_eligible_roles.length > 0 ? plus_one_eligible_roles : null,
    }

    const { data: event, error } = await supabase
      .from("events")
      .insert([insertData])
      .select()

    if (error) {
      return NextResponse.json({ error: "Failed to create event: " + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, event: event?.[0] })
  } catch (error) {
    console.error("Event creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const admin = await verifyAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, name, event_date, description, guest_limit, poster_url, min_age, max_age, entry_fee, friendlist_discount, friendlist_total_limit, plus_one_eligible_roles } = body

    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const updateData: Record<string, string | number | boolean | null | string[]> = {}
    if (name !== undefined) updateData.name = name
    if (event_date !== undefined) updateData.event_date = event_date
    if (description !== undefined) updateData.description = description || null
    if (guest_limit !== undefined) updateData.guest_limit = guest_limit ? parseInt(guest_limit) : null
    if (poster_url !== undefined) updateData.poster_url = poster_url || null
    if (min_age !== undefined) updateData.min_age = min_age ? parseInt(min_age) : 18
    if (max_age !== undefined) updateData.max_age = max_age ? parseInt(max_age) : null
    if (entry_fee !== undefined) updateData.entry_fee = entry_fee !== "" ? parseFloat(entry_fee) : null
    if (friendlist_discount !== undefined) updateData.friendlist_discount = friendlist_discount !== "" ? parseInt(friendlist_discount) : null
    if (friendlist_total_limit !== undefined) updateData.friendlist_total_limit = friendlist_total_limit !== "" ? parseInt(friendlist_total_limit) : null
    if (plus_one_eligible_roles !== undefined) updateData.plus_one_eligible_roles = Array.isArray(plus_one_eligible_roles) && plus_one_eligible_roles.length > 0 ? plus_one_eligible_roles : null

    const { error } = await supabase
      .from("events")
      .update(updateData)
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Failed to update event: " + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Event update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await verifyAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Only Admin can delete events
    if (admin.username !== "Admin") {
      return NextResponse.json({ error: "Only Admin can delete events" }, { status: 403 })
    }

    const body = await req.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: "Event ID is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete event: " + error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Event delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
