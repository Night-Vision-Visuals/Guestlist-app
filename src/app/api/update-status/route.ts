import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(req: Request) {
  const { id, action } = await req.json()

  if (!id || !action) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  let newStatus = ""

  if (action === "approve") {
    // Count approved
    const { count } = await supabase
      .from("applications")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")

    if (count && count >= 130) {
      newStatus = "waitlist"
    } else {
      newStatus = "approved"
    }
  }

  if (action === "reject") {
    newStatus = "rejected"
  }

  const { error } = await supabase
    .from("applications")
    .update({ status: newStatus })
    .eq("id", id)

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}