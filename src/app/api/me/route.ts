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
