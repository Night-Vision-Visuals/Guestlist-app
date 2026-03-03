import { NextResponse } from "next/server"

export async function POST() {
  try {
    console.log("Logout endpoint called")
    
    const response = NextResponse.json(
      { success: true, message: "Logout successful" },
      { status: 200 }
    )

    // Clear the admin_token cookie by setting it to empty with maxAge 0
    response.cookies.set({
      name: "admin_token",
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 0
    })

    console.log("Cookie cleared")
    return response
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}