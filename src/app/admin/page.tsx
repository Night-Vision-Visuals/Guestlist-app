"use client"

import { useEffect, useState } from "react"

export default function AdminPage() {
  const [applications, setApplications] = useState<any[]>([])
  const [secret, setSecret] = useState("")
  const [authenticated, setAuthenticated] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  const login = () => {
    if (secret === process.env.NEXT_PUBLIC_ADMIN_SECRET) {
      setAuthenticated(true)
      setMessage("")
    } else {
      setMessage("Invalid credentials")
    }
  }

  useEffect(() => {
    if (authenticated) {
      fetchApplications()
    }
  }, [authenticated])

  const fetchApplications = async () => {
    try {
      const res = await fetch("/api/applications")
      const data = await res.json()
      setApplications(data)
    } catch (error) {
      setMessage("Error fetching applications")
    }
  }

  const updateStatus = async (id: string, action: string) => {
    try {
      const res = await fetch("/api/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      })

      if (res.ok) {
        setMessage("Status updated successfully")
        setTimeout(() => setMessage(""), 3000)
        fetchApplications()
      } else {
        setMessage("Failed to update status")
      }
    } catch (error) {
      setMessage("An error occurred")
    }
  }

  const handleLoginSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    
    setTimeout(() => {
      login()
      setIsLoading(false)
    }, 300)
  }

  if (!authenticated) {
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
                NIGHT VISION
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
                    CREW
                  </span>
                </h1>
                <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
                  Admin Access
                </p>
                <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
              </div>

              {/* Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-8">
                
                {/* Password Field */}
                <div className="space-y-3 group">
                  <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 group-focus-within:text-white transition-colors duration-300">
                    Admin Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
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
                    message === "Status updated successfully"
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

            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-end">
            <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">
              Admin
            </div>
            <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">
              © 2026
            </div>
          </div>

        </div>
      </div>
    )
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
      <div className="relative z-10">
        {/* Top Navigation */}
        <div className="flex justify-between items-center px-6 md:px-16 py-12 border-b border-neutral-800">
          <div className="space-y-1">
            <div className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">
              NIGHT VISION
            </div>
            <div className="h-px w-12 bg-gradient-to-r from-white to-transparent" />
          </div>
          <div className="flex items-center gap-8">
            <div className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">
              {applications.length} Applications
            </div>
            <button
              onClick={() => setAuthenticated(false)}
              className="text-xs tracking-[0.2em] uppercase text-neutral-500 hover:text-white transition-colors duration-300"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 md:px-16 py-12">
          
          {/* Header */}
          <div className="mb-12 space-y-4">
            <h1 className="text-5xl md:text-6xl font-light tracking-tight">
              <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                Applications
              </span>
            </h1>
            <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
              Manage event applications
            </p>
            <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
          </div>

          {/* Message Display */}
          {message && (
            <div className={`mb-8 text-sm tracking-[0.15em] py-3 px-4 border ${
              message === "Status updated successfully"
                ? "border-emerald-400/30 text-emerald-400 bg-emerald-400/5"
                : "border-red-400/30 text-red-400 bg-red-400/5"
            }`}>
              {message}
            </div>
          )}

          {/* Applications List */}
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-500 text-sm tracking-[0.15em] uppercase">
                  No applications found
                </p>
              </div>
            ) : (
              applications.map((app) => (
                <div
                  key={app.id}
                  className="border border-neutral-800 hover:border-neutral-700 p-6 transition-all duration-300 group"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div>
                      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">
                        Name
                      </p>
                      <p className="text-white font-light">
                        {app.full_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">
                        Email
                      </p>
                      <p className="text-white font-light break-all">
                        {app.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">
                        Status
                      </p>
                      <p className={`font-light text-sm tracking-[0.15em] uppercase ${
                        app.status === "approved"
                          ? "text-emerald-400"
                          : app.status === "rejected"
                          ? "text-red-400"
                          : app.status === "waitlist"
                          ? "text-yellow-400"
                          : "text-neutral-400"
                      }`}>
                        {app.status}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">
                        Applied
                      </p>
                      <p className="text-white font-light text-sm">
                        {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {app.status === "applied" && (
                    <div className="border-t border-neutral-800 pt-4 flex gap-3">
                      <button
                        onClick={() => updateStatus(app.id, "approve")}
                        className="flex-1 group/btn relative px-4 py-2 text-xs tracking-[0.2em] uppercase text-emerald-400 border border-emerald-400/30 hover:border-emerald-400 hover:bg-emerald-400/5 transition-all duration-300"
                      >
                        <span className="font-light">Approve</span>
                      </button>
                      <button
                        onClick={() => updateStatus(app.id, "reject")}
                        className="flex-1 group/btn relative px-4 py-2 text-xs tracking-[0.2em] uppercase text-red-400 border border-red-400/30 hover:border-red-400 hover:bg-red-400/5 transition-all duration-300"
                      >
                        <span className="font-light">Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 md:px-16 py-12 border-t border-neutral-800">
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">
            Admin Dashboard
          </div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">
            © 2026
          </div>
        </div>

      </div>
    </div>
  )
}