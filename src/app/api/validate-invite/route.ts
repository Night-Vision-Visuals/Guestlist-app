import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  const { code } = await req.json()

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("invite_codes")
    .select("*")

  if (error || !data) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }

  for (const invite of data) {
    const valid = await bcrypt.compare(code, invite.code_hash)

    if (valid) {
      return NextResponse.json({ success: true })
    }
  }

  return NextResponse.json({ error: "Invalid code" }, { status: 401 })
}