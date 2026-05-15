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

async function lookupGeo(req: Request, bodyGeo?: { country: string | null; city: string | null; lat: string | null; lng: string | null }): Promise<{ country: string; city: string; lat: number | null; lng: number | null }> {
  // Prefer geo passed in the body (set by /qr page from the real user request)
  if (bodyGeo?.lat && bodyGeo?.lng) {
    const lat = parseFloat(bodyGeo.lat)
    const lng = parseFloat(bodyGeo.lng)
    if (!isNaN(lat) && !isNaN(lng)) {
      const result = {
        country: bodyGeo.country || "Unknown",
        city:    bodyGeo.city    || "Unknown",
        lat,
        lng,
      }
      console.log("[lookupGeo] using body geo:", result)
      return result
    }
  }
  // Fallback: read Vercel headers directly (works when API is called directly)
  const country = req.headers.get("x-vercel-ip-country") || "Unknown"
  const city    = req.headers.get("x-vercel-ip-city")    || "Unknown"
  const latStr  = req.headers.get("x-vercel-ip-latitude")
  const lngStr  = req.headers.get("x-vercel-ip-longitude")
  const lat = latStr ? parseFloat(latStr) : null
  const lng = lngStr ? parseFloat(lngStr) : null
  console.log("[lookupGeo] vercel headers:", { country, city, lat, lng })
  return { country, city, lat, lng }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const qr_source: string = body.qr_source === "sticker" ? "sticker" : "poster"

    const forwarded = req.headers.get("x-forwarded-for")
    const ip_address = forwarded ? forwarded.split(",")[0].trim() : (req.headers.get("x-real-ip") ?? "")

    const user_agent = req.headers.get("user-agent") ?? ""
    const { device_type, os, browser } = parseUserAgent(user_agent)
    const { country, city, lat, lng } = await lookupGeo(req, body.geo)
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
