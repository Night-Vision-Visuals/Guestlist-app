/**
 * @file /api/qr-scan/route.ts
 * POST /api/qr-scan
 *
 * Public endpoint — no auth required.
 * Logs a QR code scan to the qr_scans table.
 *
 * Body: { qr_source: "poster" | "sticker" }
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// ── User-Agent parsing ────────────────────────────────────────────────────────

function parseUserAgent(ua: string): { device_type: string; os: string; browser: string } {
  const device_type = /mobile|android|iphone|ipad|tablet/i.test(ua)
    ? /tablet|ipad/i.test(ua) ? "tablet" : "mobile"
    : "desktop"

  let os = "Unknown"
  if      (/iphone|ipad|ipod/i.test(ua)) os = "iOS"
  else if (/android/i.test(ua))          os = "Android"
  else if (/windows/i.test(ua))          os = "Windows"
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS"
  else if (/linux/i.test(ua))            os = "Linux"

  let browser = "Unknown"
  if      (/edg\//i.test(ua))            browser = "Edge"
  else if (/firefox/i.test(ua))          browser = "Firefox"
  else if (/opr\//i.test(ua))            browser = "Opera"
  else if (/chrome/i.test(ua))           browser = "Chrome"
  else if (/safari/i.test(ua))           browser = "Safari"
  else if (/msie|trident/i.test(ua))     browser = "IE"

  return { device_type, os, browser }
}

// ── Geo lookup via ip-api.com (free, no key, 100 req/min) ────────────────────

async function lookupGeo(ip: string): Promise<{ country: string; city: string; lat: number | null; lng: number | null }> {
  // Skip for local/private IPs
  if (!ip || /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|localhost)/.test(ip)) {
    return { country: "Local", city: "Local", lat: null, lng: null }
  }
  try {
    const res = await fetch(`https://ip-api.com/json/${ip}?fields=country,city,lat,lon,status`, {
      signal: AbortSignal.timeout(2000),
    })
    if (!res.ok) return { country: "Unknown", city: "Unknown", lat: null, lng: null }
    const data = await res.json()
    console.log("[lookupGeo] ip-api response:", JSON.stringify(data))
    if (data.status !== "success") return { country: "Unknown", city: "Unknown", lat: null, lng: null }
    return {
      country: data.country || "Unknown",
      city: data.city || "Unknown",
      lat: typeof data.lat === "number" ? data.lat : null,
      lng: typeof data.lon === "number" ? data.lon : null,
    }
  } catch {
    return { country: "Unknown", city: "Unknown", lat: null, lng: null }
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const qr_source: string = body.qr_source === "sticker" ? "sticker" : "poster"

    // Extract IP — respect forwarded headers (Vercel/proxy)
    const forwarded = req.headers.get("x-forwarded-for")
    const ip_address = forwarded ? forwarded.split(",")[0].trim() : (req.headers.get("x-real-ip") ?? "")

    const user_agent = req.headers.get("user-agent") ?? ""
    const { device_type, os, browser } = parseUserAgent(user_agent)
    const { country, city, lat, lng } = await lookupGeo(ip_address)
    console.log("[qr-scan] geo result:", { ip_address, country, city, lat, lng })

    const { error } = await supabase.from("qr_scans").insert({
      qr_source,
      ip_address: ip_address || null,
      country,
      city,
      lat,
      lng,
      device_type,
      os,
      browser,
      user_agent: user_agent || null,
    })

    if (error) {
      console.error("qr-scan insert error:", error)
      return NextResponse.json({ error: "Failed to log scan" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("qr-scan error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
