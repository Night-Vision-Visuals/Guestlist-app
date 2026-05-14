"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

// ─── BirthDatePicker (same as login page) ────────────────────────────────────
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const MONTHS_LONG  = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

function BirthDatePicker({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  const today   = new Date()
  const maxYear = today.getFullYear() - 16
  const minYear = 1930

  const initial = value ? new Date(value + "T12:00:00") : null
  const [viewYear,  setViewYear]  = useState(() => initial ? initial.getFullYear() : maxYear)
  const [viewMonth, setViewMonth] = useState(() => initial ? initial.getMonth() : 0)
  const [mode,      setMode]      = useState<"day" | "month" | "year">("day")

  useEffect(() => {
    if (!value) return
    const d = new Date(value + "T12:00:00")
    if (isNaN(d.getTime())) return
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }, [value])

  const firstDay   = new Date(viewYear, viewMonth, 1).getDay()
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

  const [yearPage, setYearPage] = useState(() => Math.floor((maxYear - minYear) / 12))
  const totalYearPages = Math.ceil((maxYear - minYear + 1) / 12)
  const yearStart = minYear + yearPage * 12
  const yearList  = Array.from({ length: 12 }, (_, i) => yearStart + i).filter(y => y <= maxYear)

  return (
    <div className="border border-neutral-800 bg-neutral-950 rounded-lg select-none w-full">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-neutral-800">
        <button type="button" onClick={prevMonth} className="p-1 text-neutral-500 hover:text-white transition-colors">‹</button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMode(mode === "month" ? "day" : "month")} className="text-xs tracking-[0.15em] text-white hover:text-neutral-300 transition-colors font-light">
            {MONTHS_SHORT[viewMonth]}
          </button>
          <button type="button" onClick={() => setMode(mode === "year" ? "day" : "year")} className="text-xs tracking-[0.15em] text-white hover:text-neutral-300 transition-colors font-light">
            {viewYear}
          </button>
        </div>
        <button type="button" onClick={nextMonth} className="p-1 text-neutral-500 hover:text-white transition-colors">›</button>
      </div>

      {mode === "year" && (
        <div className="p-3">
          <div className="grid grid-cols-4 gap-1 mb-2">
            {yearList.map(y => (
              <button key={y} type="button" onClick={() => { setViewYear(y); setMode("day") }}
                className={`py-1.5 text-xs rounded transition-all ${y === viewYear ? "bg-white text-black font-medium" : "text-neutral-300 hover:bg-neutral-800"}`}>
                {y}
              </button>
            ))}
          </div>
          <div className="flex justify-between pt-1 border-t border-neutral-800">
            <button type="button" disabled={yearPage === 0} onClick={() => setYearPage(p => p - 1)} className="text-[10px] text-neutral-500 hover:text-white disabled:opacity-30 px-2 py-1 transition-colors">← Older</button>
            <button type="button" disabled={yearPage >= totalYearPages - 1} onClick={() => setYearPage(p => p + 1)} className="text-[10px] text-neutral-500 hover:text-white disabled:opacity-30 px-2 py-1 transition-colors">Newer →</button>
          </div>
        </div>
      )}

      {mode === "month" && (
        <div className="p-3 grid grid-cols-3 gap-1">
          {MONTHS_LONG.map((m, i) => (
            <button key={m} type="button" onClick={() => { setViewMonth(i); setMode("day") }}
              className={`py-2 text-xs rounded transition-all ${i === viewMonth ? "bg-white text-black font-medium" : "text-neutral-300 hover:bg-neutral-800"}`}>
              {MONTHS_SHORT[i]}
            </button>
          ))}
        </div>
      )}

      {mode === "day" && (
        <div className="p-3">
          <div className="grid grid-cols-7 mb-1">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
              <div key={d} className="text-center text-[10px] tracking-[0.1em] uppercase text-neutral-600 py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => (
              <div key={i} className="flex items-center justify-center">
                {day === null ? null : (
                  <button type="button" onClick={() => select(day)} disabled={isDisabledDay(day)}
                    className={`w-7 h-7 text-xs rounded transition-all ${
                      isSelected(day) ? "bg-white text-black font-medium"
                        : isDisabledDay(day) ? "text-neutral-700 cursor-not-allowed"
                        : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                    }`}>
                    {day}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {value && (
        <div className="px-4 pb-3 pt-2 border-t border-neutral-800 text-center">
          <span className="text-xs text-neutral-400 tracking-[0.1em]">
            {new Date(value + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
        </div>
      )}
    </div>
  )
}

// ─── Staff roles ──────────────────────────────────────────────────────────────
const STAFF_ROLES = [
  { value: "dj",            label: "DJ" },
  { value: "security",      label: "Security" },
  { value: "bar_staff",     label: "Bar Staff" },
  { value: "general_staff", label: "General Staff" },
  { value: "awareness",     label: "Awareness" },
  { value: "other",         label: "Other" },
]

const ROLE_BADGE: Record<string, string> = {
  dj:            "text-purple-400 border-purple-400/40",
  security:      "text-red-400 border-red-400/40",
  bar_staff:     "text-amber-400 border-amber-400/40",
  general_staff: "text-blue-400 border-blue-400/40",
  awareness:     "text-green-400 border-green-400/40",
  other:         "text-neutral-400 border-neutral-600",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

type Step = "code" | "register" | "done"

interface EventData {
  name: string
  event_date: string
  description: string | null
  poster_url: string | null
}

export default function StaffPage() {
  return (
    <Suspense>
      <StaffPageInner />
    </Suspense>
  )
}

function StaffPageInner() {
  const searchParams = useSearchParams()
  const prefilledCode = searchParams.get("code")?.toUpperCase() ?? ""
  const [step,      setStep]      = useState<Step>("code")
  const [isLoading, setIsLoading] = useState(false)
  const [message,   setMessage]   = useState("")

  // Code entry — pre-fill from ?code= query param if present
  const [code,      setCode]      = useState(() => {
    const chars = prefilledCode.slice(0, 6).split("")
    while (chars.length < 6) chars.push("")
    return chars
  })
  const [eventData, setEventData] = useState<EventData | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-submit if we arrive with a full code in the URL
  useEffect(() => {
    if (prefilledCode.length === 6) {
      handleCodeSubmit(prefilledCode.slice(0, 6).split(""))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Registration form
  const [form, setForm] = useState({
    first_name:          "",
    last_name:           "",
    date_of_birth:       "",
    email:               "",
    gender:              "",
    role:                "general_staff",
    role_note:           "",
    datenschutz_accepted: false,
  })

  // ─── Code entry ─────────────────────────────────────────────────────────────
  const handleCodeChange = (index: number, value: string) => {
    if (!/^[a-zA-Z0-9]?$/.test(value)) return
    const newCode = [...code]
    newCode[index] = value.toUpperCase()
    setCode(newCode)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
    if (newCode.every(d => d !== "")) handleCodeSubmit(newCode)
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\s/g, "").toUpperCase()
    if (!/^[A-Z0-9]+$/.test(pasted)) return
    const chars   = pasted.slice(0, 6).split("")
    const newCode = ["", "", "", "", "", ""]
    chars.forEach((c, i) => { newCode[i] = c })
    setCode(newCode)
    const nextEmpty = newCode.findIndex(c => c === "")
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus()
    if (newCode.every(d => d !== "")) handleCodeSubmit(newCode)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) inputRefs.current[index - 1]?.focus()
  }

  const handleCodeSubmit = async (codeArray: string[] = code) => {
    const fullCode = codeArray.join("")
    if (fullCode.length !== 6) return
    setIsLoading(true)
    setMessage("")
    try {
      const res  = await fetch("/api/validate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: fullCode }),
      })
      const data = await res.json()
      if (data.success) {
        setEventData(data.event || null)
        setStep("register")
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

  // ─── Registration submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setMessage("Please fill in your first and last name.")
      return
    }
    if (!form.date_of_birth) {
      setMessage("Please select your date of birth.")
      return
    }
    if (!form.email.trim()) {
      setMessage("Please enter your email address.")
      return
    }
    if (!isValidEmail(form.email.trim())) {
      setMessage("Please enter a valid email address.")
      return
    }
    if (!form.gender) {
      setMessage("Please select your gender.")
      return
    }
    if (!form.datenschutz_accepted) {
      setMessage("Please accept the privacy policy to continue.")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name:          form.first_name.trim(),
          last_name:           form.last_name.trim(),
          date_of_birth:       form.date_of_birth,
          email:               form.email.trim(),
          gender:              form.gender,
          heard_about_us:      "friend", // always "friend" for staff
          datenschutz_accepted: form.datenschutz_accepted,
          instagram:           null,
          intro:               null,
          role:                form.role,
          role_note:           form.role_note.trim() || null,
          code:                code.join(""),
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStep("done")
      } else {
        setMessage(data.error || "Submission failed. Please try again.")
      }
    } catch {
      setMessage("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col justify-between px-6 md:px-16 py-12">

        {/* Top nav */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light"><span style={{ fontFamily: "Futures, sans-serif" }}>Night Vision</span></div>
            <div className="h-px w-12 bg-gradient-to-r from-white to-transparent" />
          </div>
          <div className="text-xs tracking-[0.3em] uppercase text-yellow-400/60 font-light tracking-widest">Staff</div>
        </div>

        {/* Main */}
        <div className="flex items-center justify-center flex-1 py-12">
          <div className="w-full max-w-md">

            {/* ── DONE ── */}
            {step === "done" && (
              <div className="space-y-8 text-center">
                <div className="space-y-4">
                  <h1 className="text-7xl md:text-8xl font-light tracking-tight leading-none mb-6">
                    <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                      WELCOME
                    </span>
                  </h1>
                  <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">Registration complete</p>
                  <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20 mx-auto" />
                </div>
                <div className="space-y-4 py-8">
                  <p className="text-neutral-300 font-light text-sm leading-relaxed">
                    You&apos;re registered as staff for{" "}
                    <span className="text-white">{eventData?.name || "the event"}</span>.
                  </p>
                  <p className="text-neutral-400 font-light text-sm leading-relaxed">
                    Your entry ticket has been generated. Check your email for details — or show up and we&apos;ll find you on the list.
                  </p>
                </div>
                <div className="pt-4 space-y-2">
                  <p className="text-xs tracking-[0.15em] uppercase text-neutral-500">Registered as</p>
                  <p className="text-sm text-neutral-300">{form.first_name} {form.last_name}</p>
                  <p className="text-sm text-neutral-400">{form.email}</p>
                  <p className="text-xs text-yellow-400/80 tracking-[0.15em] uppercase mt-1">
                    {STAFF_ROLES.find(r => r.value === form.role)?.label ?? form.role}
                  </p>
                </div>
              </div>
            )}

            {/* ── CODE ── */}
            {step === "code" && (
              <>
                <div className="mb-16 space-y-4">
                  <h1 className="text-8xl md:text-9xl font-light tracking-tight leading-none mb-6">
                    <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                      STAFF
                    </span>
                  </h1>
                  <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
                    Enter your staff code to continue
                  </p>
                  <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
                </div>

                <form onSubmit={e => e.preventDefault()} className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500">Staff Code</label>
                    <div className="flex gap-3 justify-center md:justify-start">
                      {code.map((digit, index) => (
                        <input
                          key={index}
                          ref={el => { inputRefs.current[index] = el }}
                          type="text"
                          inputMode="text"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleCodeChange(index, e.target.value)}
                          onKeyDown={e => handleKeyDown(index, e)}
                          onPaste={handlePaste}
                          disabled={isLoading}
                          className={`w-14 h-16 bg-transparent text-white text-center text-2xl font-light border-b-2 focus:outline-none transition-all duration-500 ${
                            digit ? "border-white shadow-[0_1px_0_0_rgba(255,255,255,0.3)]" : "border-neutral-800 hover:border-neutral-700"
                          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                        />
                      ))}
                    </div>
                  </div>

                  {message && <p className="text-sm tracking-[0.15em] text-center text-red-400">{message}</p>}
                  {isLoading && <p className="text-xs tracking-[0.3em] uppercase text-neutral-400 text-center">Verifying...</p>}
                </form>

                <div className="mt-12 text-center">
                  <p className="text-xs text-neutral-700 tracking-[0.15em]">
                    Looking for the guest list?{" "}
                    <Link href="/login" className="text-neutral-500 hover:text-white transition-colors">
                      Enter here
                    </Link>
                  </p>
                </div>
              </>
            )}

            {/* ── REGISTER ── */}
            {step === "register" && (
              <>
                <div className="mb-12 space-y-4">
                  <h1 className="text-6xl md:text-7xl font-light tracking-tight leading-none mb-4">
                    <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                      REGISTER
                    </span>
                  </h1>
                  {eventData?.name && (
                    <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
                      {eventData.name}
                      {eventData.event_date ? ` — ${new Date(eventData.event_date.slice(0, 10) + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}` : ""}
                    </p>
                  )}
                  <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">

                  {/* Role selection — shown first so staff know what they're signing up as */}
                  <div className="space-y-3">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500">Your Role *</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {STAFF_ROLES.map(r => (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, role: r.value }))}
                          className={`px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase border rounded transition-all duration-150 ${
                            form.role === r.value
                              ? `${ROLE_BADGE[r.value]} bg-white/5`
                              : "border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300"
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Role note */}
                  <div className="space-y-3 group">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors">
                      Note <span className="text-neutral-700">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={form.role_note}
                      onChange={e => setForm(f => ({ ...f, role_note: e.target.value }))}
                      placeholder="e.g. playing 02:00–04:00, door only..."
                      className="w-full bg-transparent text-white placeholder:text-neutral-600 border-b-2 border-neutral-800 hover:border-neutral-700 pb-3 focus:outline-none focus:border-white transition-all duration-500"
                    />
                  </div>

                  <div className="h-px bg-neutral-900" />

                  {/* First Name */}
                  <div className="space-y-3 group">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors">First Name *</label>
                    <input
                      type="text"
                      value={form.first_name}
                      onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                      required
                      placeholder="Your first name"
                      className="w-full bg-transparent text-white placeholder:text-neutral-600 border-b-2 border-neutral-800 hover:border-neutral-700 pb-4 focus:outline-none focus:border-white transition-all duration-500"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="space-y-3 group">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors">Last Name *</label>
                    <input
                      type="text"
                      value={form.last_name}
                      onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                      required
                      placeholder="Your last name"
                      className="w-full bg-transparent text-white placeholder:text-neutral-600 border-b-2 border-neutral-800 hover:border-neutral-700 pb-4 focus:outline-none focus:border-white transition-all duration-500"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-3">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500">Date of Birth *</label>
                    <BirthDatePicker value={form.date_of_birth} onChange={date => setForm(f => ({ ...f, date_of_birth: date }))} />
                  </div>

                  {/* Email */}
                  <div className="space-y-3 group">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      required
                      placeholder="name@domain.com"
                      className="w-full bg-transparent text-white placeholder:text-neutral-600 border-b-2 border-neutral-800 hover:border-neutral-700 pb-4 focus:outline-none focus:border-white transition-all duration-500"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-3 group">
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors">Gender *</label>
                    <select
                      value={form.gender}
                      onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                      required
                      className={`w-full bg-transparent border-b-2 border-neutral-800 hover:border-neutral-700 pb-4 focus:outline-none focus:border-white transition-all duration-500 appearance-none cursor-pointer ${form.gender === "" ? "text-neutral-600" : "text-white"}`}
                    >
                      <option value="" disabled className="bg-black text-neutral-600">Select gender</option>
                      <option value="male"    className="bg-black text-white">Male</option>
                      <option value="female"  className="bg-black text-white">Female</option>
                      <option value="diverse" className="bg-black text-white">Diverse / Non-binary</option>
                    </select>
                  </div>

                  {/* Privacy policy */}
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative mt-0.5 flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={form.datenschutz_accepted}
                          onChange={e => setForm(f => ({ ...f, datenschutz_accepted: e.target.checked }))}
                          required
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 border transition-all duration-300 flex items-center justify-center ${
                          form.datenschutz_accepted ? "border-white bg-white" : "border-neutral-600 group-hover:border-neutral-400"
                        }`}>
                          {form.datenschutz_accepted && (
                            <svg className="w-2.5 h-2.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <span className="text-xs tracking-[0.1em] text-neutral-500 group-hover:text-neutral-300 transition-colors leading-relaxed">
                        Ich habe die{" "}
                        <Link href="/datenschutz" target="_blank" className="text-white underline underline-offset-2 hover:text-neutral-300 transition-colors">
                          Datenschutzerklärung
                        </Link>
                        {" "}gelesen und stimme der Verarbeitung meiner personenbezogenen Daten zu. *
                      </span>
                    </label>
                  </div>

                  {message && (
                    <p className="text-sm tracking-[0.15em] text-red-400">{message}</p>
                  )}

                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group relative flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-neutral-300 hover:text-white transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="font-light">{isLoading ? "Submitting" : "Register"}</span>
                      <span className={`text-lg transition-all duration-500 ${isLoading ? "translate-x-2 opacity-0" : "group-hover:translate-x-1 opacity-100"}`}>→</span>
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
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">Staff Access</div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">© 2026</div>
        </div>

      </div>
    </div>
  )
}
