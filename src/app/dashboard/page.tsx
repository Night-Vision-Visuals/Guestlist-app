"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useEventContext } from "@/lib/EventContext"
import { QrCode } from "lucide-react"

interface Application {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  email: string
  instagram: string
  intro: string
  gender: string | null
  heard_about_us: string | null
  status: string
  no_show_count: number
  created_at: string
  event_id: string
  qr_token: string | null
  checked_in: boolean | null
  checked_in_at: string | null
}

export default function DashboardPage() {
  const router = useRouter()
  const { currentEvent, isLoading: eventsLoading } = useEventContext()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")

  useEffect(() => {
    if (currentEvent) {
      fetchApplications(currentEvent.id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEvent])

  const fetchApplications = async (eventId?: string) => {
    try {
      setIsLoading(true)
      const url = eventId
        ? `/api/applications?eventId=${eventId}`
        : "/api/applications"
      const res = await fetch(url, {
        method: "GET",
        credentials: "include"
      })

      // If 401 or 403, user is not authenticated
      if (res.status === 401 || res.status === 403) {
        console.log("Unauthorized access, redirecting to admin")
        router.push("/admin")
        return
      }

      if (!res.ok) {
        throw new Error("Failed to fetch applications")
      }

      const data = await res.json()
      setApplications(data || [])
      setError("")
    } catch (err) {
      console.error("Fetch error:", err)
      setError("Error fetching applications")
      router.push("/admin")
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
        credentials: "include"
      })

      if (res.status === 401 || res.status === 403) {
        router.push("/admin")
        return
      }

      if (!res.ok) {
        throw new Error("Failed to update status")
      }

      // Refresh applications
      fetchApplications(currentEvent?.id)
    } catch (err) {
      console.error(err)
      setError("Error updating status")
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

  // If not authenticated, show loading screen
  if (eventsLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
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
    <div className="min-h-screen bg-black text-white">
      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Top Header */}
        <div className="flex justify-between items-center px-6 md:px-16 py-12 border-b border-neutral-800">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-light tracking-tight">
              <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                Applications
              </span>
            </h1>
            <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light mt-2">
              {currentEvent?.name} - {currentEvent ? new Date(currentEvent.date).toLocaleDateString() : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">
              {applications.length} Total
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 md:px-16 py-12">
          {/* Error Message */}
          {error && (
            <div className="mb-8 text-sm tracking-[0.15em] py-3 px-4 border border-red-400/30 text-red-400 bg-red-400/5">
              {error}
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

          {/* Refresh Button */}
          <button
            onClick={() => fetchApplications(currentEvent?.id)}
            className="mb-8 px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 transition-all duration-300 text-xs tracking-[0.2em] uppercase rounded"
          >
            Refresh
          </button>

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

                  {/* Additional Info */}
                  {(app.gender || app.heard_about_us) && (
                    <div className="mb-6 pb-6 border-b border-neutral-800 grid grid-cols-2 gap-4">
                      {app.gender && (
                        <div>
                          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-1">Gender</p>
                          <p className="text-neutral-300 font-light text-sm capitalize">{app.gender}</p>
                        </div>
                      )}
                      {app.heard_about_us && (
                        <div>
                          <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-1">Heard via</p>
                          <p className="text-neutral-300 font-light text-sm capitalize">{app.heard_about_us.replace("_", " ")}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* QR Code for approved guests */}
                  {app.status === "approved" && app.qr_token && (
                    <div className="mb-6 pb-6 border-b border-neutral-800">
                      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">
                        Ticket QR Code
                        {app.checked_in && <span className="ml-2 text-yellow-400">— Checked In ✓</span>}
                      </p>
                      <div className="flex items-center gap-4">
                        <a
                          href={`/ticket/${app.qr_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 text-xs tracking-[0.2em] uppercase text-emerald-400 border border-emerald-400/30 hover:border-emerald-400 hover:bg-emerald-400/5 transition-all duration-300 rounded"
                        >
                          <QrCode size={14} />
                          View Ticket
                        </a>
                        {app.checked_in_at && (
                          <p className="text-neutral-600 text-xs">
                            Checked in: {new Date(app.checked_in_at).toLocaleString()}
                          </p>
                        )}
                      </div>
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
            Applications
          </div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">
            © 2026
          </div>
        </div>
      </div>
    </div>
  )
}