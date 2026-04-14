/**
 * @file /api/me/route.ts
 * GET /api/me
 *
 * Returns the username and ID of the currently authenticated admin, decoded
 * from the JWT cookie. Used by the Events page to determine whether the caller
 * has the elevated "Admin" username required to delete events.
 *
 * Auth: admin JWT cookie required.
 */
import { NextResponse } from "next/server"
import { verifyAdminSession } from "@/lib/auth"

export async function GET() {
  try {
    const admin = await verifyAdminSession()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ username: admin.username, adminId: admin.adminId })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
