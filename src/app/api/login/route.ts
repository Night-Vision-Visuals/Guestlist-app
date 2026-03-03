import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()

    console.log("Login attempt:", username)

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      )
    }

    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not set in environment variables")
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      )
    }

    // Fetch admin from database
    const { data: admin, error: dbError } = await supabase
      .from("admins")
      .select("id, username, password_hash")
      .eq("username", username)
      .single()

    if (dbError) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      )
    }

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      )
    }

    // Compare password with bcrypt hash
    let passwordMatch = false
    try {
      passwordMatch = await bcrypt.compare(password, admin.password_hash)
    } catch (bcryptError) {
      console.error("Bcrypt comparison error:", bcryptError)
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      )
    }

    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      )
    }

    // Generate JWT token
    try {
      const token = jwt.sign(
        {
          adminId: admin.id,
          username: admin.username,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      )

      console.log("Token generated for:", admin.username)

      // Create response with success message
      const response = NextResponse.json(
        { success: true, message: "Login successful" },
        { status: 200 }
      )

      // Set HTTP-only cookie with explicit settings
      response.cookies.set({
        name: "admin_token",
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 86400 // 1 day in seconds
      })

      console.log("Cookie set successfully")
      return response
    } catch (jwtError) {
      console.error("JWT signing error:", jwtError)
      return NextResponse.json(
        { error: "Authentication error" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}