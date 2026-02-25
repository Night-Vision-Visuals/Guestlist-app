import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  const body = await req.json()

  const { full_name, email, phone, age_confirmed, intro } = body

  if (!full_name || !email || !age_confirmed) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  const { error } = await supabase.from("applications").insert([
    {
      event_id: process.env.NEXT_PUBLIC_EVENT_ID,
      full_name,
      email,
      phone,
      age_confirmed,
      intro,
      status: "applied"
    }
  ])

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}