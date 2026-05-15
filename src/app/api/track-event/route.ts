/**
 * @file /api/track-event/route.ts
 * POST /api/track-event
 *
 * Public endpoint — no auth required.
 * Logs a user interaction (button/link click) to the interaction_events table.
 *
 * Body: { event_type: string, page: string }
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

function parseUserAgent(ua: string): { device_type: string; os: string } {
  const device_type = /mobile|android|iphone|ipad|tablet/i.test(ua)
    ? /tablet|ipad/i.test(ua) ? "tablet" : "mobile"
    : "desktop"

  let os = "Unknown"
  if      (/iphone|ipad|ipod/i.test(ua)) os = "iOS"
  else if (/android/i.test(ua))          os = "Android"
  else if (/windows/i.test(ua))          os = "Windows"
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS"
  else if (/linux/i.test(ua))            os = "Linux"

  return { device_type, os }
}

const VALID_EVENT_TYPES = new Set([
  "instagram_follow_nav",
  "instagram_follow_hero",
  "instagram_follow_footer",
  "whatsapp_join_footer",
  "access_now_click",
  "request_key_click",
  "post_decline_instagram",
])

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const event_type: string = body.event_type || ""
    const page: string = body.page || ""

    // Only accept known event types
    if (!VALID_EVENT_TYPES.has(event_type)) {
      return NextResponse.json({ error: "Invalid event_type" }, { status: 400 })
    }

    const forwarded = req.headers.get("x-forwarded-for")
    const ip_address = forwarded ? forwarded.split(",")[0].trim() : (req.headers.get("x-real-ip") ?? "")
    const user_agent = req.headers.get("user-agent") ?? ""
    const { device_type, os } = parseUserAgent(user_agent)

    const { error } = await supabase.from("interaction_events").insert({
      event_type,
      page: page || null,
      ip_address: ip_address || null,
      device_type,
      os,
      user_agent: user_agent || null,
    })

    if (error) {
      console.error("track-event insert error:", error)
      return NextResponse.json({ error: "Failed to log event" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("track-event error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
