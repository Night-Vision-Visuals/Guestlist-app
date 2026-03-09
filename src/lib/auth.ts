/**
 * @file auth.ts
 * Admin session verification using JWT stored in an HTTP-only cookie.
 *
 * How it works:
 * - The `/api/login` route signs a JWT with `JWT_SECRET` and stores it in the
 *   `admin_token` cookie (HTTP-only, SameSite=Strict, 24 h TTL).
 * - Every protected API route and the Next.js middleware call `verifyAdminSession()`
 *   to decode the cookie and confirm the session is valid.
 * - On success it returns `{ adminId, username }` so the caller knows who is acting.
 * - On failure (no cookie, expired, tampered) it returns `null` and the caller
 *   should respond with 401 or redirect to `/admin`.
 */
import { jwtVerify } from "jose"
import { cookies } from "next/headers"

/**
 * Shape of the decoded admin JWT payload.
 * Matches the object signed in `src/app/api/login/route.ts`.
 */
export interface AdminSession {
  /** UUID of the admin record in the `admins` table */
  adminId: string
  /** Login username (e.g. "Admin") */
  username: string
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "")

/**
 * Reads the `admin_token` cookie from the current request context and verifies
 * its JWT signature and expiry.
 *
 * @returns The decoded `AdminSession` if the token is valid, or `null` if the
 *          token is missing, expired, or has an invalid signature.
 *
 * @example
 * ```ts
 * const admin = await verifyAdminSession()
 * if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
 * ```
 */
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