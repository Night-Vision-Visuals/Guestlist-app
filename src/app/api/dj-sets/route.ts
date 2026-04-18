/**
 * @file /api/dj-sets/route.ts
 *
 * GET    /api/dj-sets?event_id=...   — list all sets for an event (with DJ info)
 * POST   /api/dj-sets                — create a set
 * PATCH  /api/dj-sets                — update a set
 * DELETE /api/dj-sets?id=...         — delete a set
 *
 * Table: dj_sets
 *   id              uuid primary key
 *   dj_profile_id   uuid references dj_profiles(id)
 *   event_id        uuid references events(id)
 *   start_time      text  (HH:MM, e.g. "23:00")
 *   end_time        text  (HH:MM, e.g. "01:00")
 *   set_type        text  (opening | warming_up | peak_time | closing | back2back | b3b | live_act)
 *   stage           text  (room/stage name)
 *   notes           text
 *   created_at      timestamptz
 *   updated_at      timestamptz
 */

import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const admin = await verifyAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const event_id = searchParams.get("event_id")

    let query = supabase
      .from("dj_sets")
      .select(`
        *,
        dj_profiles (
          id,
          application_id,
          genres,
          instagram,
          soundcloud,
          mixcloud,
          bio,
          applications (
            id,
            first_name,
            last_name,
            email,
            role_note
          )
        )
      `)
      .order("start_time", { ascending: true })

    if (event_id) {
      query = query.eq("event_id", event_id)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ sets: data ?? [] })
  } catch (err) {
    console.error("GET /api/dj-sets error:", err)
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
    const { dj_profile_id, event_id, start_time, end_time, set_type, stage, notes } = body

    if (!dj_profile_id || !event_id) {
      return NextResponse.json(
        { error: "dj_profile_id and event_id are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("dj_sets")
      .insert({
        dj_profile_id,
        event_id,
        start_time: start_time ?? null,
        end_time: end_time ?? null,
        set_type: set_type ?? null,
        stage: stage ?? null,
        notes: notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ set: data })
  } catch (err) {
    console.error("POST /api/dj-sets error:", err)
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
    const { id, start_time, end_time, set_type, stage, notes } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("dj_sets")
      .update({
        start_time: start_time ?? null,
        end_time: end_time ?? null,
        set_type: set_type ?? null,
        stage: stage ?? null,
        notes: notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ set: data })
  } catch (err) {
    console.error("PATCH /api/dj-sets error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const admin = await verifyAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const { error } = await supabase.from("dj_sets").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("DELETE /api/dj-sets error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
