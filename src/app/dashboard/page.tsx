"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Application {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  email: string
  instagram: string
  intro: string
  status: string
  no_show_count: number
  created_at: string
  event_id: string
}

interface Event {
  id: string
  name: string
  date: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [eventName, setEventName] = useState("Event")
  const [eventDate, setEventDate] = useState("")

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/applications")

      if (!res.ok) {
        throw new Error("Failed to fetch applications")
      }

      const data = await res.json()
      setApplications(data || [])

      // Extract event info from first application (you can adjust this based on your needs)
      if (data && data.length > 0) {
        // Fetch event details if you have an event API
        // For now, we'll use a placeholder
        setEventName(process.env.NEXT_PUBLIC_EVENT_NAME || "Event")
        setEventDate(process.env.NEXT_PUBLIC_EVENT_DATE || "")
      }
    } catch (err) {
      setMessage("Error fetching applications")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (id: string, action: "approve" | "reject" | "waitlist") => {
    try {
      const res = await fetch("/api/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      })

      if (!res.ok) {
        throw new Error("Failed to update status")
      }

      setMessage("Status updated successfully")
      setTimeout(() => setMessage(""), 3000)
      fetchApplications()
    } catch (err) {
      console.error(err)
      setMessage("Error updating status")
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" })
      router.push("/admin")
    } catch (err) {
      console.error(err)
    }
  }

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.instagram.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === "all" || app.status === filterStatus

    return matchesSearch && matchesFilter
  })

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-emerald-400"
      case "rejected":
        return "text-red-400"
      case "waitlist":
        return "text-yellow-400"
      case "applied":
        return "text-neutral-400"
      default:
        return "text-neutral-400"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Animated gradient background */}
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-pulse">
              <p className="text-lg tracking-[0.2em] uppercase text-neutral-400">
                Loading applications
              </p>
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
            <div className="text-right">
              <div className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">
                {applications.length} Applications
              </div>
              {eventDate && (
                <div className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 font-light mt-1">
                  {eventDate}
                </div>
              )}
            </div>
            <button
              onClick={logout}
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
                {eventName}
              </span>
            </h1>
            <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
              Manage event applications
            </p>
            <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`mb-8 text-sm tracking-[0.15em] py-3 px-4 border ${
                message === "Status updated successfully"
                  ? "border-emerald-400/30 text-emerald-400 bg-emerald-400/5"
                  : "border-red-400/30 text-red-400 bg-red-400/5"
              }`}
            >
              {message}
            </div>
          )}

          {/* Search and Filter Controls */}
          <div className="mb-8 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Search by name, email, instagram..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="col-span-1 md:col-span-2 bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
              />

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent border-b border-neutral-800 px-0 py-3 text-white focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
              >
                <option value="all" className="bg-black">All Statuses</option>
                <option value="applied" className="bg-black">Applied</option>
                <option value="approved" className="bg-black">Approved</option>
                <option value="rejected" className="bg-black">Rejected</option>
                <option value="waitlist" className="bg-black">Waitlist</option>
              </select>
            </div>
          </div>

          {/* Applications List */}
          <div className="space-y-4">
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-500 text-sm tracking-[0.15em] uppercase">
                  {searchTerm || filterStatus !== "all" 
                    ? "No applications found" 
                    : "No applications yet"}
                </p>
              </div>
            ) : (
              filteredApplications.map((app) => (
                <div
                  key={app.id}
                  className="border border-neutral-800 hover:border-neutral-700 p-6 transition-all duration-300 group"
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
                    <div>
                      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">
                        Name
                      </p>
                      <p className="text-white font-light">
                        {app.first_name} {app.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">
                        Age / Email
                      </p>
                      <p className="text-white font-light text-sm mb-1">
                        {calculateAge(app.date_of_birth)} years old
                      </p>
                      <a
                        href={`mailto:${app.email}`}
                        className="text-blue-400 hover:text-blue-300 font-light text-sm break-all transition-colors duration-300"
                      >
                        {app.email}
                      </a>
                    </div>
                    <div>
                      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">
                        Instagram
                      </p>
                      {app.instagram ? (
                        <a
                          href={`https://instagram.com/${app.instagram.replace("@", "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 font-light text-sm transition-colors duration-300"
                        >
                          {app.instagram}
                        </a>
                      ) : (
                        <p className="text-neutral-600 font-light text-sm">-</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">
                        Status
                      </p>
                      <p
                        className={`font-light text-sm tracking-[0.15em] uppercase ${getStatusColor(
                          app.status
                        )}`}
                      >
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

                  {/* About Section */}
                  {app.intro && (
                    <div className="mb-6 pb-6 border-b border-neutral-800">
                      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">
                        About
                      </p>
                      <p className="text-neutral-300 font-light text-sm italic">
                        {app.intro}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {app.status === "applied" && (
                    <div className="border-t border-neutral-800 pt-4 flex gap-3">
                      <button
                        onClick={() => updateStatus(app.id, "approve")}
                        className="flex-1 group/btn relative px-4 py-2 text-xs tracking-[0.2em] uppercase text-emerald-400 border border-emerald-400/30 hover:border-emerald-400 hover:bg-emerald-400/5 transition-all duration-300"
                      >
                        <span className="font-light">Approve</span>
                      </button>
                      <button
                        onClick={() => updateStatus(app.id, "waitlist")}
                        className="flex-1 group/btn relative px-4 py-2 text-xs tracking-[0.2em] uppercase text-yellow-400 border border-yellow-400/30 hover:border-yellow-400 hover:bg-yellow-400/5 transition-all duration-300"
                      >
                        <span className="font-light">Waitlist</span>
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