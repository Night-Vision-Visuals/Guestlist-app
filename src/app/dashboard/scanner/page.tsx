"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser"
import { DecodeHintType, BarcodeFormat } from "@zxing/library"

interface CheckInResult {
  success?: boolean
  error?: string
  alreadyCheckedIn?: boolean
  guest?: {
    id: string
    name: string
    email: string
    checked_in_at?: string
  }
}

function errMsg(err: unknown): string {
  try {
    if (err == null) return ""
    if (typeof err === "string") return err.toLowerCase()
    if (typeof err === "number" || typeof err === "boolean") return String(err).toLowerCase()
    if (err instanceof Error) return (err.message ?? err.name ?? String(err)).toLowerCase()
    if (typeof err === "object") {
      const o = err as Record<string, unknown>
      if (typeof o["message"] === "string") return o["message"].toLowerCase()
      if (typeof o["name"] === "string") return o["name"].toLowerCase()
      if (typeof o["type"] === "string") return o["type"].toLowerCase()
      try {
        const s = JSON.stringify(err)
        if (s && s !== "{}") return s.toLowerCase()
      } catch { /* ignore circular refs */ }
    }
    return String(err).toLowerCase()
  } catch {
    return "unknown error"
  }
}

export default function ScannerPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const invertLoopRef = useRef<number | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")

  // Refs for deduplication — never state, avoids stale closure inside camera callback
  const processingRef = useRef(false)
  const lastScannedRef = useRef<string>("")

  // ── Core check-in logic ────────────────────────────────────────────────────
  const runCheckin = useCallback(async (rawText: string) => {
    if (!rawText.trim()) return

    let token = rawText.trim()
    if (token.includes("/ticket/")) {
      token = token.split("/ticket/")[1]?.split("?")[0] || token
    }

    setIsProcessing(true)
    setResult(null)

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        credentials: "include",
      })

      const data: CheckInResult = await res.json()
      setResult(data)

      setTimeout(() => {
        setResult(null)
        lastScannedRef.current = ""
        processingRef.current = false
      }, 5000)
    } catch {
      setResult({ error: "Network error. Please try again." })
      setTimeout(() => {
        setResult(null)
        lastScannedRef.current = ""
        processingRef.current = false
      }, 3000)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // ── Camera QR callback ─────────────────────────────────────────────────────
  const processQrCode = useCallback(
    (text: string) => {
      if (processingRef.current) return
      if (text === lastScannedRef.current) return
      processingRef.current = true
      lastScannedRef.current = text
      runCheckin(text)
    },
    [runCheckin],
  )

  // ── Inverted-frame reader loop ─────────────────────────────────────────────
  // @zxing/library in this version has no ALSO_INVERTED hint, so we manually
  // draw each video frame onto a hidden canvas, invert its pixels, then run a
  // second BrowserQRCodeReader decode attempt on that canvas image.
  const startInvertLoop = useCallback(
    (invertReader: BrowserQRCodeReader) => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return

      const ctx = canvas.getContext("2d", { willReadFrequently: true })
      if (!ctx) return

      const tick = async () => {
        if (!processingRef.current && video.readyState >= 2) {
          const w = video.videoWidth || 640
          const h = video.videoHeight || 480
          canvas.width = w
          canvas.height = h

          // Draw current frame
          ctx.drawImage(video, 0, 0, w, h)

          // Invert pixels
          const imageData = ctx.getImageData(0, 0, w, h)
          const data = imageData.data
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i]         // R
            data[i + 1] = 255 - data[i + 1] // G
            data[i + 2] = 255 - data[i + 2] // B
            // alpha unchanged
          }
          ctx.putImageData(imageData, 0, 0)

          // Try to decode the inverted frame
          try {
            const result = await invertReader.decodeFromCanvas(canvas)
            if (result) processQrCode(result.getText())
          } catch {
            // NotFoundException fires on every frame with no code — normal, ignore
          }
        }

        invertLoopRef.current = requestAnimationFrame(tick)
      }

      invertLoopRef.current = requestAnimationFrame(tick)
    },
    [processQrCode],
  )

  // ── Start camera ───────────────────────────────────────────────────────────
  const startScanner = useCallback(async () => {
    if (!videoRef.current) return
    setError("")

    try {
      // Primary reader: normal (black on white) QR codes with TRY_HARDER
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE])
      hints.set(DecodeHintType.TRY_HARDER, true)

      const codeReader = new BrowserQRCodeReader(hints)

      // Secondary reader: used only for the inverted-pixel canvas frames
      const invertHints = new Map()
      invertHints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE])
      invertHints.set(DecodeHintType.TRY_HARDER, true)
      const invertReader = new BrowserQRCodeReader(invertHints)

      let deviceId: string | undefined
      try {
        const devices = await BrowserQRCodeReader.listVideoInputDevices()
        const rear = devices.find((d) => /back|rear|environment/i.test(d.label ?? ""))
        deviceId = rear?.deviceId ?? devices[0]?.deviceId
      } catch {
        // Permission not yet granted — fall through
      }

      const controls = await codeReader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (res, err) => {
          if (res) processQrCode(res.getText())
          if (err) {
            const msg = errMsg(err)
            if (!msg.includes("notfound") && !msg.includes("exception")) {
              console.warn("Scanner decode warning:", err)
            }
          }
        },
      )

      controlsRef.current = controls
      setScanning(true)

      // Start the parallel inverted-frame loop
      startInvertLoop(invertReader)
    } catch (err) {
      console.error("Scanner start error:", err)
      const message = errMsg(err)

      if (message.includes("permission") || message.includes("denied") || message.includes("notallowed")) {
        setError("Camera permission denied. Please allow camera access in your browser settings and try again.")
      } else if (message.includes("notfound") || message.includes("no camera") || message.includes("devicenotfound")) {
        setError("No camera found on this device.")
      } else if (message.includes("notreadable") || message.includes("in use") || message.includes("already in use")) {
        setError("Camera is already in use by another app. Please close it and try again.")
      } else if (message.includes("https") || message.includes("secure")) {
        setError("Camera access requires HTTPS. Please open this page over a secure connection.")
      } else {
        setError(`Could not start camera. Please ensure camera access is allowed${message ? ` (${message})` : ""}.`)
      }
    }
  }, [processQrCode, startInvertLoop])

  // ── Stop camera ────────────────────────────────────────────────────────────
  const stopScanner = useCallback(() => {
    if (invertLoopRef.current !== null) {
      cancelAnimationFrame(invertLoopRef.current)
      invertLoopRef.current = null
    }
    if (controlsRef.current) {
      try { controlsRef.current.stop() } catch { /* ignore */ }
      controlsRef.current = null
    }
    setScanning(false)
    setResult(null)
    lastScannedRef.current = ""
    processingRef.current = false
  }, [])

  useEffect(() => {
    return () => { stopScanner() }
  }, [stopScanner])

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hidden canvas used for inverted-frame decoding */}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center px-6 md:px-16 py-12 border-b border-neutral-800">
          <div className="space-y-1">
            <div className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">NIGHT VISION</div>
            <div className="h-px w-12 bg-gradient-to-r from-white to-transparent" />
          </div>
          <div className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">Door Scanner</div>
        </div>

        <div className="px-6 md:px-16 py-12 max-w-2xl mx-auto">
          {/* Title */}
          <div className="mb-12 space-y-4">
            <h1 className="text-5xl md:text-6xl font-light tracking-tight">
              <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                Scanner
              </span>
            </h1>
            <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
              Scan guest QR codes to check them in
            </p>
            <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
          </div>

          {/* Camera error */}
          {error && (
            <div className="mb-8 text-sm tracking-[0.15em] py-3 px-4 border border-red-400/30 text-red-400 bg-red-400/5 rounded">
              {error}
            </div>
          )}

          {/* Camera View */}
          <div className="mb-8">
            <div
              className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                scanning
                  ? result?.success
                    ? "border-emerald-400"
                    : result?.alreadyCheckedIn
                    ? "border-yellow-400"
                    : result?.error
                    ? "border-red-400"
                    : "border-neutral-700"
                  : "border-neutral-800"
              }`}
            >
              <video
                ref={videoRef}
                className="w-full aspect-square object-cover"
                playsInline
                muted
                autoPlay
              />

              {/* Scanning overlay */}
              {scanning && !isProcessing && !result && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-48 relative">
                    <div className="absolute inset-0 border-2 border-white/40 rounded-lg" />
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-white/60 to-transparent animate-pulse" />
                    </div>
                  </div>
                </div>
              )}

              {/* Processing overlay */}
              {isProcessing && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                  <p className="text-white text-xs tracking-[0.3em] uppercase animate-pulse">Processing...</p>
                </div>
              )}

              {/* Not scanning placeholder */}
              {!scanning && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-950">
                  <p className="text-neutral-600 text-xs tracking-[0.2em] uppercase">Camera off</p>
                </div>
              )}
            </div>
          </div>

          {/* Result Display */}
          {result && (
            <div
              className={`mb-8 p-6 border rounded-xl transition-all duration-300 ${
                result.success
                  ? "border-emerald-400/50 bg-emerald-400/5"
                  : result.alreadyCheckedIn
                  ? "border-yellow-400/50 bg-yellow-400/5"
                  : "border-red-400/50 bg-red-400/5"
              }`}
            >
              {result.success && result.guest && (
                <div className="space-y-2">
                  <p className="text-emerald-400 text-sm tracking-[0.2em] uppercase font-light">Check-in Successful</p>
                  <p className="text-white text-xl font-light">{result.guest.name}</p>
                  <p className="text-neutral-400 text-sm">{result.guest.email}</p>
                  <p className="text-neutral-600 text-xs tracking-[0.1em] uppercase">{new Date().toLocaleTimeString()}</p>
                </div>
              )}

              {result.alreadyCheckedIn && result.guest && (
                <div className="space-y-2">
                  <p className="text-yellow-400 text-sm tracking-[0.2em] uppercase font-light">Already Checked In</p>
                  <p className="text-white text-xl font-light">{result.guest.name}</p>
                  <p className="text-neutral-400 text-sm">{result.guest.email}</p>
                  {result.guest.checked_in_at && (
                    <p className="text-neutral-600 text-xs tracking-[0.1em]">
                      Checked in at: {new Date(result.guest.checked_in_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {result.error && !result.alreadyCheckedIn && (
                <div className="space-y-2">
                  <p className="text-red-400 text-sm tracking-[0.2em] uppercase font-light">Check-in Failed</p>
                  <p className="text-neutral-300 text-sm">{result.error}</p>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-4">
            {!scanning ? (
              <button
                onClick={startScanner}
                className="flex-1 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm tracking-[0.2em] uppercase rounded-lg transition-all duration-300"
              >
                Start Scanner
              </button>
            ) : (
              <button
                onClick={stopScanner}
                className="flex-1 px-6 py-4 bg-neutral-900 border border-neutral-700 hover:border-red-400/50 text-neutral-300 hover:text-red-400 text-sm tracking-[0.2em] uppercase rounded-lg transition-all duration-300"
              >
                Stop Scanner
              </button>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 space-y-2">
            <p className="text-xs tracking-[0.2em] uppercase text-neutral-600">How to use</p>
            <ul className="text-sm text-neutral-500 space-y-1 font-light">
              <li>1. Click &quot;Start Scanner&quot; and allow camera access</li>
              <li>2. Point camera at guest&apos;s QR code ticket</li>
              <li>3. The guest will be automatically checked in</li>
              <li>4. Green = success, Yellow = already checked in, Red = invalid</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 md:px-16 py-12 border-t border-neutral-800">
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">Door Scanner</div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">© 2026</div>
        </div>
      </div>
    </div>
  )
}
