"use client"

import { useEffect, useState } from "react"
import QRCode from "qrcode"

interface Application {
  id: string
  first_name: string
  last_name: string
  email: string
  status: string
  qr_token: string
  event_id: string | null
  checked_in: boolean | null
  checked_in_at: string | null
  role: string | null
}

interface CrewTicketProps {
  application: Application
  token: string
  eventName: string
  eventDate: string
}

const ROLE_LABEL: Record<string, string> = {
  dj: "DJ",
  security: "Security",
  bar_staff: "Bar Staff",
  general_staff: "General Staff",
  awareness: "Awareness",
  other: "Crew",
}

function formatRole(role: string | null): string {
  if (!role) return "Crew"
  return ROLE_LABEL[role] ?? role.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

export default function CrewTicket({ application, token, eventName, eventDate }: CrewTicketProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const roleLabel = formatRole(application.role)

  useEffect(() => {
    const ticketUrl = `${window.location.origin}/ticket/${token}`
    QRCode.toDataURL(ticketUrl, {
      width: 280,
      margin: 2,
      color: { dark: "#FFFFFF", light: "#000000" },
    }).then(setQrDataUrl).catch(console.error)
  }, [token])

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-black to-black" />
        <div className="absolute top-[-10%] left-[-10%] w-[70vw] h-[70vw] max-w-2xl max-h-2xl rounded-full bg-white/5 blur-[120px] opacity-30" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] max-w-xl max-h-xl rounded-full bg-neutral-500/10 blur-[100px] opacity-20" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-16">

        {/* Top label */}
        <div className="text-center mb-10 space-y-3">
          <p className="text-[10px] tracking-[0.5em] uppercase text-neutral-600 font-light">
            <span style={{ fontFamily: "Futures, sans-serif" }}>Night Vision</span>
          </p>
          <h1 className="text-4xl font-extralight tracking-tight text-white">
            Crew Access
          </h1>
          <div className="h-px w-12 mx-auto bg-gradient-to-r from-transparent via-neutral-500 to-transparent" />
        </div>

        {/* Main card */}
        <div className="w-full max-w-sm">

          {/* Role badge — above the card */}
          <div className="flex justify-center mb-4">
            <span className="px-4 py-1.5 text-[10px] tracking-[0.3em] uppercase font-mono border border-neutral-600 text-neutral-300 bg-neutral-900">
              {roleLabel}
            </span>
          </div>

          <div className="border border-neutral-800 bg-neutral-950/80 backdrop-blur-sm rounded-2xl overflow-hidden">

            {/* Name block */}
            <div className="px-8 pt-8 pb-6 text-center border-b border-neutral-800 space-y-1">
              <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-600 mb-3">
                {eventName}
              </p>
              <p className="text-2xl font-light text-white">
                {application.first_name} {application.last_name}
              </p>
              <p className="text-sm text-neutral-500">{application.email}</p>
            </div>

            {/* QR Code */}
            <div className="flex items-center justify-center p-8 bg-black/40">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="Crew QR Code"
                  className="w-52 h-52"
                />
              ) : (
                <div className="w-52 h-52 flex items-center justify-center">
                  <p className="text-neutral-700 text-[10px] tracking-[0.2em] uppercase">Loading…</p>
                </div>
              )}
            </div>

            {/* Status + date */}
            <div className="px-8 pb-6 pt-4 space-y-3 border-t border-neutral-800">
              {application.checked_in ? (
                <div className="py-2 px-4 border border-yellow-400/30 bg-yellow-400/5 rounded text-center">
                  <p className="text-yellow-400 text-[10px] tracking-[0.2em] uppercase">
                    ✓ Already Checked In
                  </p>
                  {application.checked_in_at && (
                    <p className="text-neutral-600 text-[10px] tracking-[0.1em] mt-1">
                      {new Date(application.checked_in_at).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <div className="py-2 px-4 border border-neutral-700 bg-neutral-900/50 rounded text-center">
                  <p className="text-neutral-300 text-[10px] tracking-[0.2em] uppercase">
                    Present at the entrance
                  </p>
                </div>
              )}
              <p className="text-center text-[10px] tracking-[0.15em] text-neutral-700 uppercase">
                {eventDate}
              </p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-800">
            <span style={{ fontFamily: "Futures, sans-serif" }}>Night Vision</span> Visuals — Vienna
          </p>
        </div>

      </div>
    </div>
  )
}
