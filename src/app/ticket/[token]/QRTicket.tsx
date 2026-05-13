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
  ticketGeneratedAt: string | null
}

export default function QRTicket({ application, token, entryPrice, ticketGeneratedAt }: QRTicketProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [isGenerated, setIsGenerated] = useState<boolean>(!!ticketGeneratedAt)
  const [isCancelled, setIsCancelled] = useState<boolean>(application.status === "cancelled")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    if (!isGenerated) return
    const ticketUrl = `${window.location.origin}/ticket/${token}`
    QRCode.toDataURL(ticketUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: "#FFFFFF",
        light: "#000000"
      }
    }).then(setQrDataUrl).catch(console.error)
  }, [token, isGenerated])

  const handleGenerateTicket = async () => {
    setIsGenerating(true)
    setError("")
    try {
      const res = await fetch("/api/generate-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        return
      }
      setIsGenerated(true)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCancelTicket = async () => {
    setIsCancelling(true)
    setError("")
    try {
      const res = await fetch("/api/cancel-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Something went wrong")
        return
      }
      setIsCancelled(true)
      setShowCancelConfirm(false)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setIsCancelling(false)
    }
  }

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
              {isCancelled ? "Cancelled" : "Your Ticket"}
            </span>
          </h1>
          <div className="h-px w-16 mx-auto bg-gradient-to-r from-transparent via-white/30 to-transparent mt-4" />
        </div>

        {/* Cancellation confirmed screen */}
        {isCancelled ? (
          <div className="w-full max-w-sm border border-neutral-800 bg-neutral-950/80 backdrop-blur-sm rounded-2xl overflow-hidden">
            <div className="px-8 py-12 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full border border-neutral-700 flex items-center justify-center mb-6">
                <span className="text-neutral-400 text-xl">✕</span>
              </div>
              <p className="text-white font-light text-lg">Spot Cancelled</p>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Your spot for this event has been cancelled. We hope to see you at a future Night Vision event.
              </p>
            </div>
          </div>
        ) : (
          <>
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

              {isGenerated ? (
                <>
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
                  <div className="px-8 pb-4 text-center space-y-3">
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
                  <div className="px-8 pb-6 text-center border-t border-neutral-800 pt-5 space-y-1">
                    <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-600">Entry Fee</p>
                    <p className="text-xl font-light text-white">{priceLabel}</p>
                    <p className="text-[10px] tracking-[0.15em] text-neutral-700 uppercase mt-2">
                      Present this QR code at the entrance
                    </p>
                  </div>

                  {/* Can't Attend — smaller link after ticket is generated */}
                  {!application.checked_in && (
                    <div className="px-8 pb-7 text-center border-t border-neutral-800/50 pt-4">
                      <button
                        onClick={() => setShowCancelConfirm(true)}
                        className="text-[11px] tracking-[0.2em] uppercase text-neutral-600 hover:text-red-400 transition-colors"
                      >
                        Can&apos;t Attend Anymore?
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Pre-generate state: warning + buttons */}
                  <div className="px-8 py-6 border-b border-neutral-800/50">
                    <div className="border border-amber-400/20 bg-amber-400/5 rounded-lg px-4 py-3 text-center space-y-1">
                      <p className="text-amber-400 text-[10px] tracking-[0.2em] uppercase font-light mb-2">Please note</p>
                      <p className="text-neutral-400 text-xs leading-relaxed">
                        If you cannot attend, please cancel your spot below. Guests who don&apos;t show up and don&apos;t cancel will be <span className="text-amber-300">blacklisted for 2 future events.</span>
                      </p>
                    </div>
                  </div>

                  <div className="px-8 py-6 space-y-3">
                    <button
                      onClick={handleGenerateTicket}
                      disabled={isGenerating}
                      className="w-full py-3 px-4 border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40 text-white text-sm tracking-[0.2em] uppercase font-light rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? "Generating..." : "Generate Ticket"}
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      disabled={isCancelling}
                      className="w-full py-3 px-4 border border-red-400/20 bg-red-400/5 hover:bg-red-400/10 hover:border-red-400/40 text-red-400 text-sm tracking-[0.2em] uppercase font-light rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Can&apos;t Attend
                    </button>
                    {error && (
                      <p className="text-red-400 text-xs text-center tracking-[0.1em]">{error}</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Cancel confirmation overlay */}
            {showCancelConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCancelConfirm(false)} />
                <div className="relative w-full max-w-sm border border-neutral-700 bg-neutral-950 rounded-2xl p-8 space-y-5 text-center">
                  <p className="text-white font-light text-lg">Are you sure?</p>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    Your ticket will be <span className="text-red-400">invalidated</span> and your spot will be released. This cannot be undone.
                  </p>
                  {error && (
                    <p className="text-red-400 text-xs tracking-[0.1em]">{error}</p>
                  )}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="flex-1 py-2.5 border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 text-xs tracking-[0.2em] uppercase rounded-lg transition-all"
                    >
                      Go Back
                    </button>
                    <button
                      onClick={handleCancelTicket}
                      disabled={isCancelling}
                      className="flex-1 py-2.5 border border-red-400/30 bg-red-400/10 text-red-400 hover:bg-red-400/20 hover:border-red-400/50 text-xs tracking-[0.2em] uppercase rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCancelling ? "Cancelling..." : "Yes, Cancel"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

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
