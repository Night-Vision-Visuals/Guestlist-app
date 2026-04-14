"use client"

import { useState, useRef } from "react"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [accessGranted, setAccessGranted] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  
  const [applicationData, setApplicationData] = useState({
    full_name: "",
    email: "",
    phone: "",
    age_confirmed: false,
    intro: ""
  })

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits and letters
    if (!/^[a-zA-Z0-9]?$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.toUpperCase()
    setCode(newCode)

    // Auto-focus to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits are filled
    if (newCode.every(digit => digit !== "")) {
      handleCodeSubmit(newCode)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace - move to previous input
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
        setAccessGranted(true)
        setMessage("")
      } else {
        setMessage("Invalid code")
        setCode(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      setMessage("An error occurred")
      setCode(["", "", "", "", "", ""])
    } finally {
      setIsLoading(false)
    }
  }

  const handleApplicationSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!applicationData.full_name.trim() || !applicationData.email.trim()) {
      setMessage("Please fill in all required fields.")
      return
    }

    if (!applicationData.age_confirmed) {
      setMessage("You must confirm you are 18+")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(applicationData),
      })

      const data = await res.json()

      if (data.success) {
        setMessage("Application submitted successfully.")
        setApplicationData({
          full_name: "",
          email: "",
          phone: "",
          age_confirmed: false,
          intro: ""
        })
      } else {
        setMessage("Submission failed. Please try again.")
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col justify-between px-6 md:px-16 py-12">
        
        {/* Top Navigation */}
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <div className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">
              Night Vision
            </div>
            <div className="h-px w-12 bg-gradient-to-r from-white to-transparent" />
          </div>
          <div className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">
            Vienna
          </div>
        </div>

        {/* Center - Main Login Section */}
        <div className="flex items-center justify-center flex-1">
          <div className="w-full max-w-md">
            
            {/* Header */}
            <div className="mb-16 space-y-4">
              <h1 className="text-8xl md:text-9xl font-light tracking-tight leading-none mb-6">
                <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                  ACCESS
                </span>
              </h1>
              <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
                {accessGranted ? "Complete your profile" : "Invitation only experience"}
              </p>
              <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
            </div>

            {!accessGranted ? (
              /* Code Verification Form */
              <form onSubmit={(e) => { e.preventDefault() }} className="space-y-8">
                
                {/* Security Code Field */}
                <div className="space-y-3">
                  <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 transition-colors duration-300">
                    Security Code
                  </label>
                  <div className="flex gap-3 justify-center md:justify-start">
                    {code.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          inputRefs.current[index] = el
                        }}
                        type="text"
                        inputMode="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        disabled={isLoading}
                        className={`w-14 h-16 bg-transparent text-white text-center text-2xl font-light border-b-2 focus:outline-none transition-all duration-500 ${
                          digit
                            ? "border-white shadow-[0_1px_0_0_rgba(255,255,255,0.3)]"
                            : "border-neutral-800 hover:border-neutral-700"
                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Message Display */}
                {message && (
                  <div className={`text-sm tracking-[0.15em] py-3 transition-all duration-300 text-center ${
                    message === "Access granted"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}>
                    {message}
                  </div>
                )}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="text-center">
                    <p className="text-xs tracking-[0.3em] uppercase text-neutral-400">
                      Verifying...
                    </p>
                  </div>
                )}

              </form>
            ) : (
              /* Application Form */
              <form onSubmit={handleApplicationSubmit} className="space-y-8">
                
                {/* Full Name Field */}
                <div className="space-y-3 group">
                  <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors duration-300">
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={applicationData.full_name}
                      onChange={(e) => setApplicationData({ ...applicationData, full_name: e.target.value })}
                      onFocus={() => setFocused("full_name")}
                      onBlur={() => setFocused(null)}
                      required
                      placeholder="Your name"
                      className={`w-full bg-transparent text-white placeholder:text-neutral-600 border-b-2 pb-4 focus:outline-none transition-all duration-500 ${
                        focused === "full_name"
                          ? "border-white shadow-[0_1px_0_0_rgba(255,255,255,0.3)]"
                          : "border-neutral-800 hover:border-neutral-700"
                      }`}
                    />
                    {focused === "full_name" && (
                      <div className="absolute -bottom-1 left-0 w-20 h-px bg-gradient-to-r from-white via-white to-transparent" />
                    )}
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-3 group">
                  <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors duration-300">
                    Email
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
                          : "border-neutral-800 hover:border-neutral-700"
                      }`}
                    />
                    {focused === "email" && (
                      <div className="absolute -bottom-1 left-0 w-20 h-px bg-gradient-to-r from-white via-white to-transparent" />
                    )}
                  </div>
                </div>

                {/* Phone Field */}
                <div className="space-y-3 group">
                  <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors duration-300">
                    Phone (optional)
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={applicationData.phone}
                      onChange={(e) => setApplicationData({ ...applicationData, phone: e.target.value })}
                      onFocus={() => setFocused("phone")}
                      onBlur={() => setFocused(null)}
                      placeholder="+1 (555) 123-4567"
                      className={`w-full bg-transparent text-white placeholder:text-neutral-600 border-b-2 pb-4 focus:outline-none transition-all duration-500 ${
                        focused === "phone"
                          ? "border-white shadow-[0_1px_0_0_rgba(255,255,255,0.3)]"
                          : "border-neutral-800 hover:border-neutral-700"
                      }`}
                    />
                    {focused === "phone" && (
                      <div className="absolute -bottom-1 left-0 w-20 h-px bg-gradient-to-r from-white via-white to-transparent" />
                    )}
                  </div>
                </div>

                {/* Age Confirmation */}
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={applicationData.age_confirmed}
                      onChange={(e) => setApplicationData({ ...applicationData, age_confirmed: e.target.checked })}
                      className="w-5 h-5 rounded border border-neutral-600 bg-transparent cursor-pointer accent-white"
                      required
                    />
                    <span className="text-xs tracking-[0.15em] uppercase text-neutral-400 group-hover:text-white transition-colors duration-300">
                      I confirm I am 18+
                    </span>
                  </label>
                </div>

                {/* Intro Field */}
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
                      placeholder="Tell us about yourself..."
                      rows={4}
                      className={`w-full bg-transparent text-white placeholder:text-neutral-600 border-b-2 pb-4 focus:outline-none transition-all duration-500 resize-none ${
                        focused === "intro"
                          ? "border-white shadow-[0_1px_0_0_rgba(255,255,255,0.3)]"
                          : "border-neutral-800 hover:border-neutral-700"
                      }`}
                    />
                    {focused === "intro" && (
                      <div className="absolute -bottom-1 left-0 w-20 h-px bg-gradient-to-r from-white via-white to-transparent" />
                    )}
                  </div>
                </div>

                {/* Message Display */}
                {message && (
                  <div className={`text-sm tracking-[0.15em] py-3 transition-all duration-300 ${
                    message.includes("success")
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}>
                    {message}
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-8">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative flex items-center gap-3 text-xs tracking-[0.3em] uppercase text-neutral-300 hover:text-white transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="font-light">
                      {isLoading ? "Submitting" : "Submit"}
                    </span>
                    <span className={`text-lg transition-all duration-500 ${
                      isLoading 
                        ? "translate-x-2 opacity-0" 
                        : "group-hover:translate-x-1 opacity-100"
                    }`}>
                      →
                    </span>
                  </button>
                  <div className="h-px w-16 bg-gradient-to-r from-neutral-700 to-transparent mt-3 group-hover:from-white transition-all duration-500" />
                </div>

              </form>
            )}

            {/* Divider */}
            <div className="my-12 h-px bg-gradient-to-r from-neutral-800 via-neutral-800 to-transparent" />

            {/* Links */}
            {!accessGranted && (
              <div className="flex justify-between text-xs text-neutral-600 tracking-[0.15em] uppercase">
                <button className="hover:text-white transition-colors duration-300">
                  Resend Code
                </button>
                <button className="hover:text-white transition-colors duration-300">
                  Request Access
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-end">
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">
            Invitation Only
          </div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">
            © 2026
          </div>
        </div>

      </div>
    </div>
  )
}