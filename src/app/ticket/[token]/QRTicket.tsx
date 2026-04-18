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
}

interface QRTicketProps {
  application: Application
  token: string
  entryPrice: number
}

export default function QRTicket({ application, token, entryPrice }: QRTicketProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("")

  useEffect(() => {
    const ticketUrl = `${window.location.origin}/ticket/${token}`
    QRCode.toDataURL(ticketUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: "#FFFFFF",
        light: "#000000"
      }
    }).then(setQrDataUrl).catch(console.error)
  }, [token])

  const priceLabel = entryPrice === 0
    ? "Free Entry"
    : `€${entryPrice % 1 === 0 ? entryPrice : entryPrice.toFixed(2)}`

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-10 animate-pulse" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12 space-y-2">
          <div className="text-xs tracking-[0.4em] uppercase text-neutral-500 font-light mb-4">
            Night Vision
          </div>
          <h1 className="text-5xl font-light tracking-tight">
            <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
              Your Ticket
            </span>
          </h1>
          <div className="h-px w-16 mx-auto bg-gradient-to-r from-transparent via-white/30 to-transparent mt-4" />
        </div>

        {/* Ticket Card */}
        <div className="w-full max-w-sm border border-neutral-800 bg-neutral-950/80 backdrop-blur-sm rounded-2xl overflow-hidden">
          {/* Guest Info */}
          <div className="px-8 pt-8 pb-6 text-center space-y-1 border-b border-neutral-800">
            <p className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-3">Approved Guest</p>
            <p className="text-2xl font-light text-white">
              {application.first_name} {application.last_name}
            </p>
            <p className="text-sm text-neutral-400">{application.email}</p>
          </div>

          {/* QR Code */}
          <div className="flex items-center justify-center p-8">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="QR Code"
                className="w-56 h-56"
              />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center">
                <p className="text-neutral-600 text-xs tracking-[0.2em] uppercase">Loading...</p>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="px-8 pb-6 text-center space-y-3">
            {application.checked_in ? (
              <div className="py-2 px-4 border border-yellow-400/30 bg-yellow-400/5 rounded">
                <p className="text-yellow-400 text-xs tracking-[0.2em] uppercase">
                  ✓ Already Checked In
                </p>
                {application.checked_in_at && (
                  <p className="text-neutral-500 text-[10px] tracking-[0.1em] mt-1">
                    {new Date(application.checked_in_at).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="py-2 px-4 border border-emerald-400/30 bg-emerald-400/5 rounded">
                <p className="text-emerald-400 text-xs tracking-[0.2em] uppercase">
                  ✓ Valid Ticket
                </p>
              </div>
            )}
          </div>

          {/* Entry Fee */}
          <div className="px-8 pb-8 text-center border-t border-neutral-800 pt-5 space-y-1">
            <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-600">Entry Fee</p>
            <p className="text-xl font-light text-white">{priceLabel}</p>
            <p className="text-[10px] tracking-[0.15em] text-neutral-700 uppercase mt-2">
              Present this QR code at the entrance
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center space-y-2">
          <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-700">
            Night Vision Visuals — Vienna
          </p>
        </div>
      </div>
    </div>
  )
}
