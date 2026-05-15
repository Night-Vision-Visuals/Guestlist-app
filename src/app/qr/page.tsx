/**
 * @file /qr/page.tsx
 *
 * QR code redirect page.
 * Logs the scan then redirects to the appropriate destination.
 *
 * Poster QR:  https://nightvision-events.com/qr?source=poster  → /login
 * Sticker QR: https://nightvision-events.com/qr?source=sticker → Instagram
 */
import { headers } from "next/headers"
import { redirect } from "next/navigation"

const DESTINATIONS: Record<string, string> = {
  poster:  "/login",
  sticker: "https://www.instagram.com/nightvision_raw",
}

export default async function QrRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>
}) {
  const { source } = await searchParams
  const qr_source = source === "sticker" ? "sticker" : "poster"
  const destination = DESTINATIONS[qr_source]

  // Fire-and-forget scan log — we don't block the redirect on it
  try {
    const headersList = await headers()
    const host = headersList.get("host") ?? "nightvision-events.com"
    const proto = headersList.get("x-forwarded-proto") ?? "https"
    const baseUrl = `${proto}://${host}`

    // Forward IP + user-agent from the incoming request
    const ip = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip") ?? ""
    const ua = headersList.get("user-agent") ?? ""

    await fetch(`${baseUrl}/api/qr-scan`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "user-agent": ua,
      },
      body: JSON.stringify({
        qr_source,
        // Pass Vercel geo from the real user request — these headers are only
        // correct here on the /qr edge request, not on the internal API fetch
        geo: {
          country:  headersList.get("x-vercel-ip-country")   ?? null,
          city:     headersList.get("x-vercel-ip-city")      ?? null,
          lat:      headersList.get("x-vercel-ip-latitude")  ?? null,
          lng:      headersList.get("x-vercel-ip-longitude") ?? null,
        },
      }),
    })
  } catch {
    // Never block the redirect because of a logging failure
  }

  redirect(destination)
}
