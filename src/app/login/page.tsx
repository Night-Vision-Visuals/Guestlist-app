"use client"


import { useState } from "react"

<div className="bg-red-500 text-white text-4xl">
  TAILWIND TEST
</div>
export default function LoginPage() {
  const [focused, setFocused] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [formData, setFormData] = useState({ email: "", password: "" })

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        setMessage("Access granted")
      } else {
        setMessage("Invalid credentials")
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
              Private Event
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
                  Access
                </span>
              </h1>
              <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
                Invitation only experience
              </p>
              <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Email Field */}
              <div className="space-y-3 group">
                <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors duration-300">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

              {/* Password Field */}
              <div className="space-y-3 group">
                <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors duration-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    onFocus={() => setFocused("password")}
                    onBlur={() => setFocused(null)}
                    required
                    placeholder="••••••••"
                    className={`w-full bg-transparent text-white placeholder:text-neutral-600 border-b-2 pb-4 focus:outline-none transition-all duration-500 ${
                      focused === "password"
                        ? "border-white shadow-[0_1px_0_0_rgba(255,255,255,0.3)]"
                        : "border-neutral-800 hover:border-neutral-700"
                    }`}
                  />
                  {focused === "password" && (
                    <div className="absolute -bottom-1 left-0 w-20 h-px bg-gradient-to-r from-white via-white to-transparent" />
                  )}
                </div>
              </div>

              {/* Message Display */}
              {message && (
                <div className={`text-sm tracking-[0.15em] py-3 transition-all duration-300 ${
                  message === "Access granted"
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
                    {isLoading ? "Authenticating" : "Enter"}
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

            {/* Divider */}
            <div className="my-12 h-px bg-gradient-to-r from-neutral-800 via-neutral-800 to-transparent" />

            {/* Links */}
            <div className="flex justify-between text-xs text-neutral-600 tracking-[0.15em] uppercase">
              <button className="hover:text-white transition-colors duration-300">
                Forgot Password
              </button>
              <button className="hover:text-white transition-colors duration-300">
                Request Access
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
          <div className="bg-red-500 text-white text-4xl">
             TAILWIND TEST
          </div>
        </div>

      </div>
    </div>
  )
}