import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { jwtVerify } from "jose"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "")

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/invite"]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // If not a protected route, allow it
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  // This is a protected route - check for token
  const token = request.cookies.get("admin_token")?.value

  console.log("Middleware check:", {
    pathname,
    hasToken: !!token,
    tokenValue: token ? token.substring(0, 20) + "..." : "none"
  })

  // No token found
  if (!token) {
    console.log("No token found, redirecting to /admin")
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  try {
    // Verify the token
    const verified = await jwtVerify(token, secret)
    console.log("Token verified successfully for:", verified.payload)
    
    // Token is valid, allow the request
    return NextResponse.next()
  } catch (error) {
    console.error("Token verification failed:", error)
    
    // Token is invalid or expired
    return NextResponse.redirect(new URL("/admin", request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}