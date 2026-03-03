import { jwtVerify } from "jose"
import { cookies } from "next/headers"

// Get JWT secret from environment
const secret = new TextEncoder().encode(process.env.JWT_SECRET || "")

export interface AdminSession {
  adminId: string
  username: string
  iat: number
  exp: number
}

/**
 * Verify the admin session from the admin_token cookie
 * Returns the decoded admin object if valid, null if invalid
 */
export async function verifyAdminSession(): Promise<AdminSession | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value

    if (!token) {
      console.log("No admin_token cookie found")
      return null
    }

    // Verify JWT token
    const verified = await jwtVerify(token, secret)
    
    if (!verified.payload) {
      console.log("JWT verification failed - no payload")
      return null
    }

    const admin = verified.payload as AdminSession
    
    console.log("Admin session verified:", admin.username)
    return admin
  } catch (error) {
    console.error("Auth verification error:", error)
    return null
  }
}

/**
 * Get current admin session (alias for verifyAdminSession)
 */
export async function getCurrentAdmin(): Promise<AdminSession | null> {
  return verifyAdminSession()
}