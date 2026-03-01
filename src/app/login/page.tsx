"use client"

import { useState, useRef } from "react"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
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
      handleSubmit(newCode)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace - move to previous input
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (codeArray: string[] = code) => {
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
        setMessage("Access granted")
      } else {
        setMessage("Invalid code")
      }
    } catch (error) {
      setMessage("An error occurred")
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
                <span className="bg-gradient-to-b from-white via-grey to-neutral-500 bg-clip-text text-transparent">
                  ACCESS
                </span>
              </h1>
              <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
                Invitation only experience
              </p>
              <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
            </div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault() }} className="space-y-8">
              
              {/* Security Code Field */}
              <div className="space-y-3">
                <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 transition-colors duration-300">
                  Invitation Code
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

            {/* Divider */}
            <div className="my-12 h-px bg-gradient-to-r from-neutral-800 via-neutral-800 to-transparent" />

            {/* Links */}
            <div className="flex justify-between text-xs text-neutral-600 tracking-[0.15em] uppercase">
              <button className="hover:text-white transition-colors duration-300 uppercase">
                Contact us for access
              </button>
            </div>

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