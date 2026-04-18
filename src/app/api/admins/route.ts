/**
 * @file /api/admins/route.ts
 * GET /api/admins
 *
 * Returns a list of all admin accounts (id + username only).
 * Used by the dashboard filter panel to populate the "Admin" filter.
 *
 * Auth: admin JWT cookie required.
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

    const { data, error } = await supabase
      .from("admins")
      .select("id, username")
      .order("username", { ascending: true })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (err) {
    console.error("Admins route error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
