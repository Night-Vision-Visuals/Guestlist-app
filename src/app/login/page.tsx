"use client"

import { useState, useRef } from "react"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [accessGranted, setAccessGranted] = useState(false)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  
  const [applicationData, setApplicationData] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    email: "",
    instagram: "",
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
        // Store code for later use when submitting application
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

    if (!applicationData.first_name.trim() || !applicationData.last_name.trim() || !applicationData.email.trim() || !applicationData.date_of_birth) {
      setMessage("Please fill in all required fields.")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...applicationData,
          code: code.join("") // Send the verification code
        }),
      })

      const data = await res.json()

      if (data.success) {
        setApplicationSubmitted(true)
        setApplicationData({
          first_name: "",
          last_name: "",
          date_of_birth: "",
          email: "",
          instagram: "",
          intro: ""
        })
      } else {
        setMessage(data.error || "Submission failed. Please try again.")
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

        {/* Center - Main Content Section */}
        <div className="flex items-center justify-center flex-1">
          <div className="w-full max-w-md">
            
            {applicationSubmitted ? (
              /* Success/Confirmation Screen */
              <div className="space-y-8 text-center">
                {/* Header */}
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

                {/* Confirmation Message */}
                <div className="space-y-4 py-8">
                  <p className="text-neutral-300 font-light text-sm leading-relaxed">
                    We have received your application for CREW Vienna.
                  </p>
                  <p className="text-neutral-400 font-light text-sm leading-relaxed">
                    Our team is carefully reviewing all submissions. We will be in touch soon with a decision.
                  </p>
                  <div className="pt-4 space-y-2">
                    <p className="text-xs tracking-[0.15em] uppercase text-neutral-500">
                      Application Details
                    </p>
                    <p className="text-sm text-neutral-300">
                      {applicationData.first_name} {applicationData.last_name}
                    </p>
                    <p className="text-sm text-neutral-400">
                      {applicationData.email}
                    </p>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="space-y-4 pt-8">
                  <p className="text-xs tracking-[0.15em] uppercase text-neutral-500">
                    Next Steps
                  </p>
                  <ul className="text-sm text-neutral-300 space-y-2 font-light">
                    <li>✓ Check your email for updates</li>
                    <li>✓ Follow us on Instagram for announcements</li>
                    <li>✓ We'll contact you by {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</li>
                  </ul>
                </div>

                {/* Footer Message */}
                <div className="pt-12 space-y-4">
                  <div className="h-px bg-gradient-to-r from-neutral-800 via-neutral-800 to-transparent" />
                  <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600">
                    See you soon
                  </p>
                </div>
              </div>
            ) : (
              <>
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
                    
                    {/* First Name Field */}
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
                              : "border-neutral-800 hover:border-neutral-700"
                          }`}
                        />
                        {focused === "first_name" && (
                          <div className="absolute -bottom-1 left-0 w-20 h-px bg-gradient-to-r from-white via-white to-transparent" />
                        )}
                      </div>
                    </div>

                    {/* Last Name Field */}
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
                              : "border-neutral-800 hover:border-neutral-700"
                          }`}
                        />
                        {focused === "last_name" && (
                          <div className="absolute -bottom-1 left-0 w-20 h-px bg-gradient-to-r from-white via-white to-transparent" />
                        )}
                      </div>
                    </div>

                    {/* Date of Birth Field */}
                    <div className="space-y-3 group">
                      <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors duration-300">
                        Date of Birth *
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          value={applicationData.date_of_birth}
                          onChange={(e) => setApplicationData({ ...applicationData, date_of_birth: e.target.value })}
                          onFocus={() => setFocused("date_of_birth")}
                          onBlur={() => setFocused(null)}
                          required
                          className={`w-full bg-transparent text-white placeholder:text-neutral-600 border-b-2 pb-4 focus:outline-none transition-all duration-500 ${
                            focused === "date_of_birth"
                              ? "border-white shadow-[0_1px_0_0_rgba(255,255,255,0.3)]"
                              : "border-neutral-800 hover:border-neutral-700"
                          }`}
                        />
                        {focused === "date_of_birth" && (
                          <div className="absolute -bottom-1 left-0 w-20 h-px bg-gradient-to-r from-white via-white to-transparent" />
                        )}
                      </div>
                    </div>

                    {/* Email Field */}
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
                              : "border-neutral-800 hover:border-neutral-700"
                          }`}
                        />
                        {focused === "email" && (
                          <div className="absolute -bottom-1 left-0 w-20 h-px bg-gradient-to-r from-white via-white to-transparent" />
                        )}
                      </div>
                    </div>

                    {/* Instagram Field */}
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
                              : "border-neutral-800 hover:border-neutral-700"
                          }`}
                        />
                        {focused === "instagram" && (
                          <div className="absolute -bottom-1 left-0 w-20 h-px bg-gradient-to-r from-white via-white to-transparent" />
                        )}
                      </div>
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
                          placeholder="Tell us something interesting about yourself..."
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
              </>
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