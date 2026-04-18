/**
 * @file /api/djs/route.ts
 *
 * GET  /api/djs          — list all DJ profiles (joined with application data)
 * POST /api/djs          — create a new DJ profile for a given application_id
 * PATCH /api/djs         — update an existing DJ profile
 * DELETE /api/djs        — delete a DJ profile
 *
 * DJ profiles are stored in the `dj_profiles` table and are linked to a
 * staff application record (application_id) in the `applications` table
 * where role = 'dj'.
 *
 * Table: dj_profiles
 *   id              uuid primary key
 *   application_id  uuid references applications(id)
 *   genres          text[]   (array of genre tags)
 *   instagram       text
 *   soundcloud      text
 *   mixcloud        text
 *   bio             text
 *   created_at      timestamptz
 *   updated_at      timestamptz
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

    // Fetch all applications with role = 'dj', joined with their dj_profile (if any)
    const { data: djApps, error: appError } = await supabase
      .from("applications")
      .select("id, first_name, last_name, email, role, role_note, checked_in, checked_in_at, event_id, created_at, gender")
      .eq("role", "dj")
      .order("first_name", { ascending: true })

    if (appError) {
      return NextResponse.json({ error: appError.message }, { status: 500 })
    }

    // Fetch all dj_profiles
    const { data: profiles, error: profileError } = await supabase
      .from("dj_profiles")
      .select("*")

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Merge profiles into DJ application records
    const profileMap = new Map((profiles ?? []).map((p) => [p.application_id, p]))

    const djs = (djApps ?? []).map((app) => ({
      ...app,
      profile: profileMap.get(app.id) ?? null,
    }))

    return NextResponse.json({ djs })
  } catch (err) {
    console.error("GET /api/djs error:", err)
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
    const { application_id, genres, instagram, soundcloud, mixcloud, bio } = body

    if (!application_id) {
      return NextResponse.json({ error: "application_id is required" }, { status: 400 })
    }

    // Upsert: if a profile already exists for this application, update it
    const { data, error } = await supabase
      .from("dj_profiles")
      .upsert(
        {
          application_id,
          genres: genres ?? [],
          instagram: instagram ?? null,
          soundcloud: soundcloud ?? null,
          mixcloud: mixcloud ?? null,
          bio: bio ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "application_id" }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (err) {
    console.error("POST /api/djs error:", err)
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
    const { id, genres, instagram, soundcloud, mixcloud, bio } = body

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("dj_profiles")
      .update({
        genres: genres ?? [],
        instagram: instagram ?? null,
        soundcloud: soundcloud ?? null,
        mixcloud: mixcloud ?? null,
        bio: bio ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ profile: data })
  } catch (err) {
    console.error("PATCH /api/djs error:", err)
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

    const { error } = await supabase.from("dj_profiles").delete().eq("id", id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("DELETE /api/djs error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
