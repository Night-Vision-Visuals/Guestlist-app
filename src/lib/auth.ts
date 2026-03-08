import { jwtVerify } from "jose"
import { cookies } from "next/headers"

export interface AdminSession {
  adminId: string
  username: string
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "")

export async function verifyAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value

    if (!token) {
      console.log("No admin_token cookie found")
      return null
    }

    console.log("Token found, verifying...")

    // Verify JWT token
    const verified = await jwtVerify(token, secret)
    
    if (!verified.payload) {
      console.log("JWT verification failed: no payload")
      return null
    }

    // Cast to unknown first, then to AdminSession
    const admin = verified.payload as unknown as AdminSession
    
    console.log("Admin session verified:", admin.username)
    return admin
  } catch (error) {
    console.error("Auth verification error:", error)
    return null
  }
}