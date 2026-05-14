"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import ReactMarkdown from "react-markdown"

// ─── BirthDatePicker ──────────────────────────────────────────────────────────
// Defined OUTSIDE page component to prevent remount on every render.

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function BirthDatePicker({
  value,
  onChange,
}: {
  value: string        // "YYYY-MM-DD" or ""
  onChange: (date: string) => void
}) {
  const today = new Date()
  const maxYear = today.getFullYear() - 18   // must be at least 18
  const minYear = 1930

  const initial = value ? new Date(value + "T12:00:00") : null
  const [viewYear, setViewYear] = useState(() => initial ? initial.getFullYear() : maxYear)
  const [viewMonth, setViewMonth] = useState(() => initial ? initial.getMonth() : 0)
  const [mode, setMode] = useState<"day" | "month" | "year">("day")

  // Sync view when value changes externally
  useEffect(() => {
    if (!value) return
    const d = new Date(value + "T12:00:00")
    if (isNaN(d.getTime())) return
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }, [value])

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const startOffset = (firstDay + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const isSelected = (day: number) => {
    if (!value) return false
    const d = new Date(value + "T12:00:00")
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day
  }

  const isDisabledDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day)
    return d > new Date(maxYear, today.getMonth(), today.getDate())
  }

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => Math.max(minYear, y - 1)) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => Math.min(maxYear, y + 1)) }
    else setViewMonth(m => m + 1)
  }

  const select = (day: number) => {
    if (isDisabledDay(day)) return
    const mm = String(viewMonth + 1).padStart(2, "0")
    const dd = String(day).padStart(2, "0")
    onChange(`${viewYear}-${mm}-${dd}`)
  }

  // Year range for year picker (show 12 years at a time)
  const [yearPage, setYearPage] = useState(() => Math.floor((maxYear - minYear) / 12))
  const totalYearPages = Math.ceil((maxYear - minYear + 1) / 12)
  const yearStart = minYear + yearPage * 12
  const yearList = Array.from({ length: 12 }, (_, i) => yearStart + i).filter(y => y <= maxYear)

  return (
    <div className="border border-orange-900 bg-neutral-950 rounded-lg select-none w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-orange-900">
        <button type="button" onClick={prevMonth} className="p-1 text-neutral-500 hover:text-white transition-colors">
          ‹
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode(mode === "month" ? "day" : "month")}
            className="text-xs tracking-[0.15em] text-white hover:text-neutral-300 transition-colors font-light"
          >
            {MONTHS_SHORT[viewMonth]}
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "year" ? "day" : "year")}
            className="text-xs tracking-[0.15em] text-white hover:text-neutral-300 transition-colors font-light"
          >
            {viewYear}
          </button>
        </div>
        <button type="button" onClick={nextMonth} className="p-1 text-neutral-500 hover:text-white transition-colors">
          ›
        </button>
      </div>

      {mode === "year" && (
        <div className="p-3">
          <div className="grid grid-cols-4 gap-1 mb-2">
            {yearList.map(y => (
              <button
                key={y}
                type="button"
                onClick={() => { setViewYear(y); setMode("day") }}
                className={`py-1.5 text-xs rounded transition-all ${
                  y === viewYear ? "bg-white text-black font-medium" : "text-neutral-300 hover:bg-neutral-800"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
          <div className="flex justify-between pt-1 border-t border-orange-900">
            <button
              type="button"
              disabled={yearPage === 0}
              onClick={() => setYearPage(p => p - 1)}
              className="text-[10px] text-neutral-500 hover:text-white disabled:opacity-30 px-2 py-1 transition-colors"
            >
              ← Older
            </button>
            <button
              type="button"
              disabled={yearPage >= totalYearPages - 1}
              onClick={() => setYearPage(p => p + 1)}
              className="text-[10px] text-neutral-500 hover:text-white disabled:opacity-30 px-2 py-1 transition-colors"
            >
              Newer →
            </button>
          </div>
        </div>
      )}

      {mode === "month" && (
        <div className="p-3 grid grid-cols-3 gap-1">
          {MONTHS_LONG.map((m, i) => (
            <button
              key={m}
              type="button"
              onClick={() => { setViewMonth(i); setMode("day") }}
              className={`py-2 text-xs rounded transition-all ${
                i === viewMonth ? "bg-white text-black font-medium" : "text-neutral-300 hover:bg-neutral-800"
              }`}
            >
              {MONTHS_SHORT[i]}
            </button>
          ))}
        </div>
      )}

      {mode === "day" && (
        <div className="p-3">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
              <div key={d} className="text-center text-[10px] tracking-[0.1em] uppercase text-neutral-600 py-1">{d}</div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => (
              <div key={i} className="flex items-center justify-center">
                {day === null ? null : (
                  <button
                    type="button"
                    onClick={() => select(day)}
                    disabled={isDisabledDay(day)}
                    className={`w-7 h-7 text-xs rounded transition-all ${
                      isSelected(day)
                        ? "bg-white text-black font-medium"
                        : isDisabledDay(day)
                        ? "text-neutral-700 cursor-not-allowed"
                        : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                    }`}
                  >
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected value display */}
      {value && (
        <div className="px-4 pb-3 pt-2 border-t border-orange-900 text-center">
          <span className="text-xs text-neutral-400 tracking-[0.1em]">
            {new Date(value + "T12:00:00").toLocaleDateString("en-GB", {
              weekday: "long", day: "numeric", month: "long", year: "numeric"
            })}
          </span>
        </div>
      )}
    </div>
  )
}

type Step = "code" | "event-info" | "register" | "done"

interface EventData {
  name: string
  event_date: string
  description: string | null
  poster_url: string | null
  guest_limit: number | null
  min_age: number | null
  max_age: number | null
}

const YES_NO_QUESTIONS = [
  "Are you over 18 years old?",
  "Do you have experience with this kind of party?",
  "Have you read and accepted the rules?",
  "Do you want to be part of this experience?",
]

export default function LoginPage() {
  const [step, setStep] = useState<Step>("code")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [answers, setAnswers] = useState<(boolean | null)[]>([null, null, null, null])
  const [showDeclineWarning, setShowDeclineWarning] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [applicationData, setApplicationData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    email: "",
    instagram: "",
    intro: "",
    gender: "",
    heard_about_us: "",
    datenschutz_accepted: false,
  })

  // ─── Code entry ────────────────────────────────────────────────────────────

  const handleCodeChange = (index: number, value: string) => {
    if (!/^[a-zA-Z0-9]?$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.toUpperCase()
    setCode(newCode)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
    if (newCode.every((d) => d !== "")) handleCodeSubmit(newCode)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\s/g, "").toUpperCase()
    if (!/^[A-Z0-9]+$/.test(pasted)) return
    const chars = pasted.slice(0, 6).split("")
    const newCode = ["", "", "", "", "", ""]
    chars.forEach((c, i) => { newCode[i] = c })
    setCode(newCode)
    const nextEmpty = newCode.findIndex((c) => c === "")
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus()
    if (newCode.every((d) => d !== "")) handleCodeSubmit(newCode)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleCodeSubmit = async (codeArray: string[] = code) => {
    const fullCode = codeArray.join("")
    if (fullCode.length !== 6) return
    setIsLoading(true)
    setMessage("")
    try {
      const res = await fetch("/api/validate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: fullCode }),
      })
      const data = await res.json()
      if (data.success) {
        // If this is a staff/crew code, redirect to the staff registration page
        if (data.tier === "staff" || data.tier === "crew") {
          window.location.href = `/staff?code=${encodeURIComponent(fullCode)}`
          return
        }
        setEventData(data.event || null)
        setStep("event-info")
        setMessage("")
      } else {
        setMessage(data.error || "Invalid code")
        setCode(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
      }
    } catch {
      setMessage("An error occurred. Please try again.")
      setCode(["", "", "", "", "", ""])
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Yes/No answers ─────────────────────────────────────────────────────────

  const allAnsweredYes = answers.every((a) => a === true)
  const anyAnsweredNo = answers.some((a) => a === false)

  const handleAnswer = (index: number, value: boolean) => {
    const next = [...answers]
    next[index] = value
    setAnswers(next)
  }

  // ─── Decline flow ───────────────────────────────────────────────────────────

  const handleConfirmDecline = async () => {
    setIsDeclining(true)
    try {
      await fetch("/api/decline-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.join("") }),
      })
    } catch {
      // best-effort — redirect regardless
    } finally {
      window.location.href = "https://www.instagram.com/nightvision_raw"
    }
  }

  // ─── Registration submit ────────────────────────────────────────────────────

  const handleApplicationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!applicationData.first_name.trim() || !applicationData.last_name.trim() || !applicationData.email.trim() || !applicationData.date_of_birth) {
      setMessage("Please fill in all required fields.")
      return
    }
    if (!applicationData.gender) {
      setMessage("Please select your gender.")
      return
    }
    if (!applicationData.heard_about_us) {
      setMessage("Please tell us how you heard about the party.")
      return
    }
    if (!applicationData.datenschutz_accepted) {
      setMessage("Please accept the privacy policy to continue.")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...applicationData, code: code.join("") }),
      })
      const data = await res.json()
      if (data.success) {
        setStep("done")
        setApplicationData({
          first_name: "",
          last_name: "",
          date_of_birth: "",
          email: "",
          instagram: "",
          intro: "",
          gender: "",
          heard_about_us: "",
          datenschutz_accepted: false,
        })
      } else {
        setMessage(data.error || "Submission failed. Please try again.")
      }
    } catch {
      setMessage("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        {/* Video — only visible on code step */}
        {step === "code" && (
          <>
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              src="/Video/bg.mp4"
            />
            <div className="absolute inset-0 bg-black/55" />
          </>
        )}
        <div className={`absolute inset-0 bg-gradient-to-br ${step === "code" ? "from-neutral-900/40 via-black/30 to-black/50" : "from-neutral-900 via-black to-black"}`} />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
      </div>

      {/* Decline Warning Modal */}
      {showDeclineWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative z-10 w-full max-w-md border border-orange-800 bg-neutral-950/95 p-10 space-y-8">
            <div className="space-y-3">
              <p className="text-xs tracking-[0.3em] uppercase text-red-400 font-light">Warning</p>
              <div className="h-px w-12 bg-gradient-to-r from-red-400/60 to-transparent" />
            </div>
            <p className="text-neutral-300 font-light text-sm leading-relaxed">
              If you decline, your invitation code will be{" "}
              <span className="text-white">permanently marked as used</span>{" "}
              and cannot be reused.
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={handleConfirmDecline}
                disabled={isDeclining}
                className="w-full py-3 border border-red-400/40 text-red-400 hover:border-red-400 hover:bg-red-400/5 text-xs tracking-[0.25em] uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeclining ? "Processing..." : "Confirm Decline"}
              </button>
              <button
                onClick={() => setShowDeclineWarning(false)}
                disabled={isDeclining}
                className="w-full py-3 border border-orange-900 text-neutral-400 hover:border-orange-700 hover:text-white text-xs tracking-[0.25em] uppercase transition-all duration-300 disabled:opacity-50"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-16 py-4 border-b border-orange-900/50 backdrop-blur-sm bg-black/60">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Night Vision"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <div className="h-px w-12 bg-gradient-to-r from-white to-transparent" />
        </div>
        <div className="flex items-center gap-6">
          <a
            href="https://instagram.com/nightvision_raw"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs tracking-[0.2em] uppercase text-neutral-500 hover:text-white transition-colors duration-300"
          >
            Follow
          </a>
          <Link
            href="/admin"
            className="text-xs tracking-[0.2em] uppercase text-neutral-500 hover:text-white transition-colors duration-300"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between px-6 md:px-16 py-20">

        {/* Main Content */}
        <div className="flex items-center justify-center flex-1 py-12">
          <div className={step === "code" ? "w-full flex items-center justify-center" : "w-full max-w-md"}>

            {/* ── STEP: DONE ── */}
            {step === "done" && (
              <div className="space-y-8 text-center">
                <div className="space-y-4">
                  <h1 className="text-8xl md:text-9xl font-light tracking-tight leading-none mb-6">
                    <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                      THANK YOU
                    </span>
                  </h1>
                  <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
                    Application received
                  </p>
                  <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20 mx-auto" />
                </div>
                <div className="space-y-4 py-8">
                  <p className="text-neutral-300 font-light text-sm leading-relaxed">
                    We have received your application for CREW Vienna.
                  </p>
                  <p className="text-neutral-400 font-light text-sm leading-relaxed">
                    Our team is carefully reviewing all submissions. We will be in touch soon with a decision.
                  </p>
                  <div className="pt-4 space-y-2">
                    <p className="text-xs tracking-[0.15em] uppercase text-neutral-500">Application Details</p>
                    <p className="text-sm text-neutral-300">{applicationData.first_name} {applicationData.last_name}</p>
                    <p className="text-sm text-neutral-400">{applicationData.email}</p>
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <p className="text-xs tracking-[0.15em] uppercase text-neutral-500">Next Steps</p>
                  <ul className="text-sm text-neutral-300 space-y-2 font-light">
                    <li>✓ Check your email for updates</li>
                    <li>✓ Follow us on Instagram for announcements</li>
                    <li>✓ We&apos;ll contact you by {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
                  </ul>
                </div>
                <div className="pt-12 space-y-4">
                  <div className="h-px bg-gradient-to-r from-neutral-800 via-neutral-800 to-transparent" />
                  <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600">See you soon</p>
                </div>
              </div>
            )}

            {/* ── STEP: CODE ── */}
            {step === "code" && (
              <div className="w-full max-w-md mx-auto bg-black/60 backdrop-blur-md border border-orange-900/60 rounded-lg px-12 py-14 flex flex-col items-center text-center space-y-8">

                {/* Headline */}
                <div className="space-y-3">
                  <h1 className="text-[10rem] font-light tracking-[0.15em] leading-none">
                    <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                      ACCESS
                    </span>
                  </h1>
                  <p className="text-neutral-400 text-sm tracking-[0.25em] uppercase font-light">
                    See what others can&apos;t
                  </p>
                  <div className="h-px bg-gradient-to-r from-transparent via-white/40 to-transparent w-24 mx-auto" />
                </div>

                {/* Input */}
                <div className="w-full space-y-4">
                  <label className="block text-sm tracking-[0.25em] uppercase text-neutral-400">
                    Access Key
                  </label>
                  <div className="flex gap-2.5 justify-center">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el }}
                        type="text"
                        inputMode="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onPaste={handlePaste}
                        disabled={isLoading}
                        className={`w-14 h-14 text-white text-center text-xl font-light rounded border focus:outline-none transition-all duration-500 backdrop-blur-sm ${
                          digit
                            ? "bg-white/15 border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                            : "bg-white/8 border-white/20 hover:bg-white/12 hover:border-white/30"
                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    ))}
                  </div>
                </div>

                {/* States */}
                {message && (
                  <p className="text-sm tracking-[0.15em] text-red-400">{message}</p>
                )}
                {isLoading && (
                  <p className="text-xs tracking-[0.3em] uppercase text-neutral-400">Verifying...</p>
                )}

                {/* Request Key */}
                <a
                  href="https://ig.me/m/nightvision_raw"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs tracking-[0.2em] uppercase text-neutral-600 hover:text-white transition-colors duration-300"
                >
                  Request Key
                </a>

              </div>
            )}

            {/* ── STEP: EVENT INFO ── */}
            {step === "event-info" && (
              <div className="space-y-12">

                {/* Event Details */}
                <div className="space-y-6">
                  {/* Poster */}
                  {eventData?.poster_url && (
                    <div className="w-full aspect-video overflow-hidden border border-orange-900">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={eventData.poster_url}
                        alt={eventData.name}
                        className="w-full h-full object-cover opacity-90"
                      />
                    </div>
                  )}

                  {/* Event name heading */}
                  <div className="space-y-3">
                    <p className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">You&apos;re invited to</p>
                    <h1 className="text-5xl md:text-6xl font-light tracking-tight leading-none">
                      <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                        {eventData?.name || "Night Vision"}
                      </span>
                    </h1>
                    <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
                  </div>

                  {/* Event meta */}
                  <div className="space-y-3">
                    {eventData?.event_date && (
                      <div className="flex items-start gap-4">
                        <span className="text-xs tracking-[0.2em] uppercase text-neutral-500 w-20 flex-shrink-0 pt-0.5">Date</span>
                        <span className="text-sm text-neutral-200 font-light">
                          {new Date(eventData.event_date.slice(0, 10) + "T12:00:00").toLocaleDateString("en-GB", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    )}
                    {(eventData?.min_age || eventData?.max_age) && (
                      <div className="flex items-start gap-4">
                        <span className="text-xs tracking-[0.2em] uppercase text-neutral-500 w-20 flex-shrink-0 pt-0.5">Age</span>
                        <span className="text-sm text-neutral-200 font-light">
                          {eventData.min_age && eventData.max_age
                            ? `${eventData.min_age} – ${eventData.max_age}`
                            : eventData.min_age
                            ? `${eventData.min_age}+`
                            : `Up to ${eventData.max_age}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {eventData?.description && (
                    <div className="border border-orange-900 bg-neutral-950/40 backdrop-blur-sm rounded-xl p-6 space-y-4">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <p className="text-sm text-neutral-300 font-light leading-relaxed">{children}</p>
                          ),
                          h1: ({ children }) => (
                            <h2 className="text-base text-white font-light tracking-[0.1em] uppercase mb-2">{children}</h2>
                          ),
                          h2: ({ children }) => (
                            <h3 className="text-sm text-white font-light tracking-[0.15em] uppercase mb-1">{children}</h3>
                          ),
                          ul: ({ children }) => (
                            <ul className="space-y-1.5 pl-1">{children}</ul>
                          ),
                          li: ({ children }) => (
                            <li className="flex items-start gap-2 text-sm text-neutral-400 font-light leading-relaxed">
                              <span className="text-neutral-600 mt-1.5 flex-shrink-0">·</span>
                              <span>{children}</span>
                            </li>
                          ),
                          strong: ({ children }) => (
                            <strong className="text-white font-normal">{children}</strong>
                          ),
                          em: ({ children }) => (
                            <em className="text-neutral-300 not-italic">{children}</em>
                          ),
                          hr: () => (
                            <div className="h-px bg-gradient-to-r from-neutral-800 via-neutral-700 to-transparent my-2" />
                          ),
                        }}
                      >
                        {eventData.description}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-neutral-800 via-neutral-700 to-transparent" />

                {/* Yes / No Questions */}
                <div className="space-y-8">
                  <div className="space-y-2">
                    <p className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">Before you continue</p>
                    <p className="text-sm text-neutral-400 font-light">Please answer all questions honestly.</p>
                  </div>

                  <div className="space-y-6">
                    {YES_NO_QUESTIONS.map((question, i) => (
                      <div key={i} className="space-y-3">
                        <p className="text-sm text-neutral-200 font-light leading-relaxed">{question}</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAnswer(i, true)}
                            className={`px-10 py-3 text-sm tracking-[0.25em] uppercase border transition-all duration-300 rounded ${
                              answers[i] === true
                                ? "border-white text-white bg-white/5"
                                : "border-orange-800 text-neutral-500 hover:border-orange-600 hover:text-neutral-300"
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => handleAnswer(i, false)}
                            className={`px-10 py-3 text-sm tracking-[0.25em] uppercase border transition-all duration-300 rounded ${
                              answers[i] === false
                                ? "border-red-400/70 text-red-400 bg-red-400/5"
                                : "border-orange-800 text-neutral-500 hover:border-orange-600 hover:text-neutral-300"
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Inline error if any NO */}
                  {anyAnsweredNo && (
                    <div className="text-sm text-red-400 tracking-[0.1em] py-3 border border-red-400/20 px-4 bg-red-400/5">
                      You must agree to all conditions to continue.
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-neutral-800 via-neutral-700 to-transparent" />

                {/* Final Confirmation */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">Final step</p>
                    <p className="text-sm text-neutral-300 font-light leading-relaxed">
                      Are you sure you want to register for this event?
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                     {/* YES */}
                     <button
                       onClick={() => { setMessage(""); setStep("register") }}
                       disabled={!allAnsweredYes}
                       className="w-full py-4 border border-white text-white bg-white/5 hover:bg-white/10 text-sm tracking-[0.25em] uppercase transition-all duration-300 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                     >
                       Yes, Register
                     </button>

                     {/* NO */}
                     <button
                       onClick={() => setShowDeclineWarning(true)}
                       className="w-full py-4 border border-orange-800 text-neutral-500 hover:border-red-400/40 hover:text-red-400 text-sm tracking-[0.25em] uppercase transition-all duration-300 rounded"
                     >
                       No, Decline
                     </button>
                  </div>

                  {!allAnsweredYes && !anyAnsweredNo && (
                    <p className="text-xs text-neutral-600 tracking-[0.1em]">
                      Answer all questions above to continue.
                    </p>
                  )}
                </div>

              </div>
            )}

            {/* ── STEP: REGISTER ── */}
            {step === "register" && (
              <>
                <div className="mb-16 space-y-4">
                  <h1 className="text-7xl md:text-8xl font-light tracking-tight leading-none mb-6">
                    <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                      REGISTER
                    </span>
                  </h1>
                  <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
                    Complete your profile
                  </p>
                  <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
                </div>

                <form onSubmit={handleApplicationSubmit} className="space-y-8">

                  {/* First Name */}
                  <div className="space-y-3 group">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors duration-300">
                      First Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={applicationData.first_name}
                        onChange={(e) => setApplicationData({ ...applicationData, first_name: e.target.value })}
                        onFocus={() => setFocused("first_name")}
                        onBlur={() => setFocused(null)}
                        required
                        placeholder="Your first name"
                        className={`w-full bg-transparent text-white placeholder:text-neutral-600 border-b-2 pb-4 focus:outline-none transition-all duration-500 ${
                          focused === "first_name"
                            ? "border-white shadow-[0_1px_0_0_rgba(255,255,255,0.3)]"
                            : "border-orange-900 hover:border-orange-800"
                        }`}
                      />
                      {focused === "first_name" && (
                        <div className="absolute -bottom-1 left-0 w-20 h-px bg-gradient-to-r from-white via-white to-transparent" />
                      )}
                    </div>
                  </div>

                  {/* Last Name */}
                  <div className="space-y-3 group">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors duration-300">
                      Last Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={applicationData.last_name}
                        onChange={(e) => setApplicationData({ ...applicationData, last_name: e.target.value })}
                        onFocus={() => setFocused("last_name")}
                        onBlur={() => setFocused(null)}
                        required
                        placeholder="Your last name"
                        className={`w-full bg-transparent text-white placeholder:text-neutral-600 border-b-2 pb-4 focus:outline-none transition-all duration-500 ${
                          focused === "last_name"
                            ? "border-white shadow-[0_1px_0_0_rgba(255,255,255,0.3)]"
                            : "border-orange-900 hover:border-orange-800"
                        }`}
                      />
                      {focused === "last_name" && (
                        <div className="absolute -bottom-1 left-0 w-20 h-px bg-gradient-to-r from-white via-white to-transparent" />
                      )}
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="space-y-3 group">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors duration-300">
                      Gender *
                    </label>
                    <div className="relative">
                      <select
                        value={applicationData.gender}
                        onChange={(e) => setApplicationData({ ...applicationData, gender: e.target.value })}
                        onFocus={() => setFocused("gender")}
                        onBlur={() => setFocused(null)}
                        required
                        className={`w-full bg-transparent text-white border-b-2 pb-4 focus:outline-none transition-all duration-500 appearance-none cursor-pointer ${
                          focused === "gender"
                            ? "border-white shadow-[0_1px_0_0_rgba(255,255,255,0.3)]"
                            : "border-orange-900 hover:border-orange-800"
                        } ${applicationData.gender === "" ? "text-neutral-600" : "text-white"}`}
                      >
                        <option value="" disabled className="bg-black text-neutral-600">Select gender</option>
                        <option value="male" className="bg-black text-white">Male</option>
                        <option value="female" className="bg-black text-white">Female</option>
                        <option value="diverse" className="bg-black text-white">Diverse / Non-binary</option>
                      </select>
                      {focused === "gender" && (
                        <div className="absolute -bottom-1 left-0 w-20 h-px bg-gradient-to-r from-white via-white to-transparent" />
                      )}
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-3 group">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors duration-300">
                      Date of Birth *
                    </label>
                    <BirthDatePicker
                      value={applicationData.date_of_birth}
                      onChange={(date) => setApplicationData({ ...applicationData, date_of_birth: date })}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-3 group">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors duration-300">
                      Email *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={applicationData.email}
                        onChange={(e) => setApplicationData({ ...applicationData, email: e.target.value })}
                        onFocus={() => setFocused("email")}
                        onBlur={() => setFocused(null)}
                        required
                        placeholder="name@domain.com"
                        className={`w-full bg-transparent text-white placeholder:text-neutral-600 border-b-2 pb-4 focus:outline-none transition-all duration-500 ${
                          focused === "email"
                            ? "border-white shadow-[0_1px_0_0_rgba(255,255,255,0.3)]"
                            : "border-orange-900 hover:border-orange-800"
                        }`}
                      />
                      {focused === "email" && (
                        <div className="absolute -bottom-1 left-0 w-20 h-px bg-gradient-to-r from-white via-white to-transparent" />
                      )}
                    </div>
                  </div>

                  {/* Instagram */}
                  <div className="space-y-3 group">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors duration-300">
                      Instagram (optional)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={applicationData.instagram}
                        onChange={(e) => setApplicationData({ ...applicationData, instagram: e.target.value })}
                        onFocus={() => setFocused("instagram")}
                        onBlur={() => setFocused(null)}
                        placeholder="@username"
                        className={`w-full bg-transparent text-white placeholder:text-neutral-600 border-b-2 pb-4 focus:outline-none transition-all duration-500 ${
                          focused === "instagram"
                            ? "border-white shadow-[0_1px_0_0_rgba(255,255,255,0.3)]"
                            : "border-orange-900 hover:border-orange-800"
                        }`}
                      />
                      {focused === "instagram" && (
                        <div className="absolute -bottom-1 left-0 w-20 h-px bg-gradient-to-r from-white via-white to-transparent" />
                      )}
                    </div>
                  </div>

                  {/* Heard About Us */}
                  <div className="space-y-3 group">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors duration-300">
                      How did you hear about us? *
                    </label>
                    <div className="relative">
                      <select
                        value={applicationData.heard_about_us}
                        onChange={(e) => setApplicationData({ ...applicationData, heard_about_us: e.target.value })}
                        onFocus={() => setFocused("heard_about_us")}
                        onBlur={() => setFocused(null)}
                        required
                        className={`w-full bg-transparent text-white border-b-2 pb-4 focus:outline-none transition-all duration-500 appearance-none cursor-pointer ${
                          focused === "heard_about_us"
                            ? "border-white shadow-[0_1px_0_0_rgba(255,255,255,0.3)]"
                            : "border-orange-900 hover:border-orange-800"
                        } ${applicationData.heard_about_us === "" ? "text-neutral-600" : "text-white"}`}
                      >
                        <option value="" disabled className="bg-black text-neutral-600">Select an option</option>
                        <option value="friend" className="bg-black text-white">From a friend / Word of mouth</option>
                        <option value="instagram" className="bg-black text-white">Instagram</option>
                        <option value="flyer" className="bg-black text-white">Flyer / Poster</option>
                        <option value="tiktok" className="bg-black text-white">TikTok</option>
                        <option value="other" className="bg-black text-white">Other</option>
                      </select>
                      {focused === "heard_about_us" && (
                        <div className="absolute -bottom-1 left-0 w-20 h-px bg-gradient-to-r from-white via-white to-transparent" />
                      )}
                    </div>
                  </div>

                  {/* Short Intro */}
                  <div className="space-y-3 group">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors duration-300">
                      Short Intro (optional)
                    </label>
                    <div className="relative">
                      <textarea
                        value={applicationData.intro}
                        onChange={(e) => setApplicationData({ ...applicationData, intro: e.target.value })}
                        onFocus={() => setFocused("intro")}
                        onBlur={() => setFocused(null)}
                        placeholder="Tell us something interesting about yourself..."
                        rows={4}
                        className={`w-full bg-transparent text-white placeholder:text-neutral-600 border-b-2 pb-4 focus:outline-none transition-all duration-500 resize-none ${
                          focused === "intro"
                            ? "border-white shadow-[0_1px_0_0_rgba(255,255,255,0.3)]"
                            : "border-orange-900 hover:border-orange-800"
                        }`}
                      />
                      {focused === "intro" && (
                        <div className="absolute -bottom-1 left-0 w-20 h-px bg-gradient-to-r from-white via-white to-transparent" />
                      )}
                    </div>
                  </div>

                  {/* Divider before consent */}
                  <div className="h-px bg-gradient-to-r from-neutral-800 via-neutral-700 to-transparent" />

                  {/* Datenschutz */}
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={applicationData.datenschutz_accepted}
                          onChange={(e) => setApplicationData({ ...applicationData, datenschutz_accepted: e.target.checked })}
                          required
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 border transition-all duration-300 flex items-center justify-center ${
                          applicationData.datenschutz_accepted
                            ? "border-white bg-white"
                            : "border-orange-700 group-hover:border-neutral-400"
                        }`}>
                          {applicationData.datenschutz_accepted && (
                            <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-xs tracking-[0.1em] text-neutral-500 group-hover:text-neutral-300 transition-colors duration-300 leading-relaxed">
                        Ich habe die{" "}
                        <Link href="/datenschutz" target="_blank" className="text-white underline underline-offset-2 hover:text-neutral-300 transition-colors duration-300">
                          Datenschutzerklärung
                        </Link>
                        {" "}gelesen und stimme der Verarbeitung meiner personenbezogenen Daten zu. *
                      </span>
                    </label>
                  </div>

                  {/* Message */}
                  {message && (
                    <div className="text-sm tracking-[0.15em] py-3 transition-all duration-300 text-red-400">
                      {message}
                    </div>
                  )}

                  {/* Submit */}
                  <div className="pt-8">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group relative flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-neutral-300 hover:text-white transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="font-light">{isLoading ? "Submitting" : "Submit"}</span>
                      <span className={`text-lg transition-all duration-500 ${
                        isLoading ? "translate-x-2 opacity-0" : "group-hover:translate-x-1 opacity-100"
                      }`}>→</span>
                    </button>
                    <div className="h-px w-16 bg-gradient-to-r from-neutral-700 to-transparent mt-3" />
                  </div>

                </form>
              </>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end">
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">Invitation Only</div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">© 2026</div>
        </div>

      </div>
    </div>
  )
}
