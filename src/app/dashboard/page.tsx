"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useEventContext } from "@/lib/EventContext"
import { QrCode, Pencil, X, Check, LogIn, UserX, LayoutList, LayoutGrid } from "lucide-react"

interface Application {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  email: string
  instagram: string | null
  intro: string | null
  gender: string | null
  heard_about_us: string | null
  status: string
  no_show_count: number
  created_at: string
  event_id: string
  qr_token: string | null
  checked_in: boolean | null
  checked_in_at: string | null
  invite_type: string | null
  age_flagged: boolean | null
}

interface EditForm {
  email: string
  status: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { currentEvent, isLoading: eventsLoading } = useEventContext()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [viewMode, setViewMode] = useState<"overview" | "detailed">("overview")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ email: "", status: "" })
  const [checkingInId, setCheckingInId] = useState<string | null>(null)

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
      const res = await fetch(url, { method: "GET", credentials: "include" })

      if (res.status === 401 || res.status === 403) {
        router.push("/admin")
        return
      }
      if (!res.ok) throw new Error("Failed to fetch applications")

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

  const updateStatus = async (id: string, action: "approve" | "reject" | "waitlist" | "cancelled") => {
    try {
      const res = await fetch("/api/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
        credentials: "include"
      })
      if (res.status === 401 || res.status === 403) { router.push("/admin"); return }
      if (!res.ok) throw new Error("Failed to update status")
      fetchApplications(currentEvent?.id)
    } catch (err) {
      console.error(err)
      setError("Error updating status")
    }
  }

  const handleManualCheckIn = async (id: string) => {
    setCheckingInId(id)
    try {
      const res = await fetch("/api/manual-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "include"
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to check in guest")
        return
      }
      fetchApplications(currentEvent?.id)
    } catch (err) {
      console.error(err)
      setError("Error checking in guest")
    } finally {
      setCheckingInId(null)
    }
  }

  const handleEditSave = async (id: string) => {
    try {
      const res = await fetch("/api/edit-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email: editForm.email, status: editForm.status }),
        credentials: "include"
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to update application")
        return
      }
      setEditingId(null)
      fetchApplications(currentEvent?.id)
    } catch (err) {
      console.error(err)
      setError("Error updating application")
    }
  }

  const startEdit = (app: Application) => {
    setEditingId(app.id)
    setEditForm({ email: app.email, status: app.status })
  }

  const filteredApplications = applications.filter((app) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      app.first_name.toLowerCase().includes(q) ||
      app.last_name.toLowerCase().includes(q) ||
      app.email.toLowerCase().includes(q) ||
      (app.instagram ?? "").toLowerCase().includes(q)
    const matchesFilter = filterStatus === "all" || app.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved": return "bg-emerald-400/10 text-emerald-400 border-emerald-400/30"
      case "rejected": return "bg-red-400/10 text-red-400 border-red-400/30"
      case "waitlist": return "bg-yellow-400/10 text-yellow-400 border-yellow-400/30"
      case "cancelled": return "bg-neutral-800 text-neutral-500 border-neutral-700"
      case "applied": return "bg-cyan-400/10 text-cyan-400 border-cyan-400/30"
      default: return "bg-neutral-800 text-neutral-400 border-neutral-700"
    }
  }

  const getInviteTypeBadge = (type: string | null) => {
    if (!type) return null
    switch (type) {
      case "vip": return { label: "💎 VIP", cls: "text-purple-400 border-purple-400/30 bg-purple-400/10" }
      case "friend": return { label: "🤝 Friend", cls: "text-orange-400 border-orange-400/30 bg-orange-400/10" }
      case "guestlist": return { label: "📋 Guestlist", cls: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10" }
      case "instagram": return { label: "📸 Instagram", cls: "text-pink-400 border-pink-400/30 bg-pink-400/10" }
      case "whatsapp": return { label: "💬 WhatsApp", cls: "text-green-400 border-green-400/30 bg-green-400/10" }
      default: return { label: type, cls: "text-neutral-400 border-neutral-700 bg-neutral-800" }
    }
  }

  if (eventsLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <p className="text-lg tracking-[0.2em] uppercase text-neutral-400 animate-pulse">Loading applications</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
      </div>

      <div className="relative z-10">
        <div className="px-6 md:px-16 py-12">
          {/* Header — consistent with analytics style */}
          <div className="mb-12 space-y-4">
            <h1 className="text-5xl md:text-6xl font-light tracking-tight">
              <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                Applications
              </span>
            </h1>
            <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
              {currentEvent?.name} — {currentEvent ? new Date(currentEvent.date).toLocaleDateString() : ""}
            </p>
            <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
          </div>

          {error && (
            <div className="mb-8 text-sm tracking-[0.15em] py-3 px-4 border border-red-400/30 text-red-400 bg-red-400/5">
              {error}
            </div>
          )}

          {/* Controls */}
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
                <option value="cancelled" className="bg-black">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => fetchApplications(currentEvent?.id)}
                className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 transition-all duration-300 text-xs tracking-[0.2em] uppercase rounded"
              >
                Refresh
              </button>
              <div className="flex items-center border border-neutral-800 rounded overflow-hidden">
                <button
                  onClick={() => setViewMode("overview")}
                  className={`p-2 transition-all duration-200 ${viewMode === "overview" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"}`}
                  title="Overview"
                >
                  <LayoutList size={14} />
                </button>
                <button
                  onClick={() => setViewMode("detailed")}
                  className={`p-2 transition-all duration-200 ${viewMode === "detailed" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"}`}
                  title="Detailed"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
              <p className="text-xs tracking-[0.2em] uppercase text-neutral-600">
                {filteredApplications.length} / {applications.length} guests
              </p>
            </div>
          </div>

          {/* Applications */}
          <div className="space-y-1">
            {filteredApplications.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-500 text-sm tracking-[0.15em] uppercase">
                  {searchTerm || filterStatus !== "all" ? "No applications found" : "No applications yet"}
                </p>
              </div>
            ) : (
              filteredApplications.map((app) => {
                const badge = getInviteTypeBadge(app.invite_type)
                return (
                  <div
                    key={app.id}
                    className={`border transition-all duration-300 ${
                      app.age_flagged
                        ? "border-orange-800/60 hover:border-orange-700/60"
                        : "border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    {/* Compact Row */}
                    <div className={`px-4 py-3 ${viewMode === "detailed" ? "border-b border-neutral-800/50" : ""}`}>
                      <div className="flex items-center gap-3 flex-wrap">
                        {badge && (
                          <span className={`text-[10px] px-2 py-0.5 rounded border tracking-[0.1em] font-mono ${badge.cls}`}>
                            {badge.label}
                          </span>
                        )}
                        {app.age_flagged && (
                          <span className="text-[10px] px-2 py-0.5 rounded border text-orange-400 border-orange-400/30 bg-orange-400/10">
                            ⚠ Age
                          </span>
                        )}

                        <span className="text-white font-light text-sm min-w-[140px]">
                          {app.first_name} {app.last_name}
                        </span>
                        <span className="text-neutral-500 text-xs w-8 text-center">{calculateAge(app.date_of_birth)}y</span>
                        <span className="text-neutral-500 text-xs capitalize min-w-[55px]">{app.gender || "—"}</span>
                        <a href={`mailto:${app.email}`} className="text-neutral-400 hover:text-blue-400 text-xs transition-colors flex-1 min-w-[150px] truncate">
                          {app.email}
                        </a>
                        <span className={`text-[10px] px-2 py-0.5 rounded border tracking-[0.15em] uppercase font-light whitespace-nowrap ${getStatusBadge(app.status)}`}>
                          {app.status}{app.checked_in ? " ✓" : ""}
                        </span>
                        <span className="text-neutral-600 text-xs hidden md:block">{new Date(app.created_at).toLocaleDateString()}</span>

                        {/* Action icons */}
                        <div className="flex items-center gap-1 ml-auto">
                          {app.status === "approved" && !app.checked_in && (
                            <button
                              onClick={() => handleManualCheckIn(app.id)}
                              disabled={checkingInId === app.id}
                              title="Manual Check-in"
                              className="p-1.5 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded transition-all duration-200 disabled:opacity-50"
                            >
                              <LogIn size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => editingId === app.id ? setEditingId(null) : startEdit(app)}
                            title="Edit"
                            className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-all"
                          >
                            <Pencil size={14} />
                          </button>
                          {app.status !== "cancelled" && app.status !== "rejected" && (
                            <button
                              onClick={() => {
                                if (confirm("Mark this guest as cancelled? (They won't be flagged as a no-show)")) {
                                  updateStatus(app.id, "cancelled")
                                }
                              }}
                              title="Mark Cancelled"
                              className="p-1.5 text-neutral-500 hover:text-orange-400 hover:bg-orange-400/10 rounded transition-all"
                            >
                              <UserX size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Edit form */}
                    {editingId === app.id && (
                      <div className="px-4 py-3 bg-neutral-900/50 border-b border-neutral-800">
                        <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">Edit Application</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1 block">Email</label>
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              className="w-full bg-transparent border-b border-neutral-700 py-2 text-white text-sm focus:outline-none focus:border-neutral-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1 block">Status</label>
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="w-full bg-neutral-900 border-b border-neutral-700 py-2 text-white text-sm focus:outline-none"
                            >
                              <option value="applied" className="bg-black">Applied</option>
                              <option value="approved" className="bg-black">Approved</option>
                              <option value="rejected" className="bg-black">Rejected</option>
                              <option value="waitlist" className="bg-black">Waitlist</option>
                              <option value="cancelled" className="bg-black">Cancelled</option>
                            </select>
                          </div>
                          <div className="flex items-end gap-2">
                            <button
                              onClick={() => handleEditSave(app.id)}
                              className="flex items-center gap-1 px-3 py-2 text-xs tracking-[0.1em] uppercase text-emerald-400 border border-emerald-400/30 hover:border-emerald-400 hover:bg-emerald-400/5 transition-all rounded"
                            >
                              <Check size={12} /> Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex items-center gap-1 px-3 py-2 text-xs tracking-[0.1em] uppercase text-neutral-400 border border-neutral-700 hover:border-neutral-500 transition-all rounded"
                            >
                              <X size={12} /> Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Detailed view */}
                    {viewMode === "detailed" && (
                      <div className="px-4 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1">Instagram</p>
                            {app.instagram ? (
                              <a href={`https://instagram.com/${app.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm">
                                {app.instagram}
                              </a>
                            ) : <p className="text-neutral-600 text-sm">—</p>}
                          </div>
                          <div>
                            <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1">Heard via</p>
                            <p className="text-neutral-300 text-sm capitalize">{app.heard_about_us?.replace("_"," ") || "—"}</p>
                          </div>
                          {app.checked_in_at && (
                            <div>
                              <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1">Checked In</p>
                              <p className="text-emerald-400 text-sm">{new Date(app.checked_in_at).toLocaleString()}</p>
                            </div>
                          )}
                          {app.qr_token && (
                            <div>
                              <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1">Ticket</p>
                              <a href={`/ticket/${app.qr_token}`} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                                <QrCode size={12} /> View QR
                              </a>
                            </div>
                          )}
                        </div>
                        {app.intro && (
                          <p className="text-neutral-500 text-sm italic mb-3">&quot;{app.intro}&quot;</p>
                        )}
                        {app.status === "applied" && (
                          <div className="pt-3 border-t border-neutral-800/50 flex gap-2">
                            <button onClick={() => updateStatus(app.id, "approve")} className="px-3 py-1.5 text-xs tracking-[0.15em] uppercase text-emerald-400 border border-emerald-400/30 hover:border-emerald-400 hover:bg-emerald-400/5 transition-all rounded">Approve</button>
                            <button onClick={() => updateStatus(app.id, "waitlist")} className="px-3 py-1.5 text-xs tracking-[0.15em] uppercase text-yellow-400 border border-yellow-400/30 hover:border-yellow-400 hover:bg-yellow-400/5 transition-all rounded">Waitlist</button>
                            <button onClick={() => updateStatus(app.id, "reject")} className="px-3 py-1.5 text-xs tracking-[0.15em] uppercase text-red-400 border border-red-400/30 hover:border-red-400 hover:bg-red-400/5 transition-all rounded">Reject</button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Overview quick actions for applied */}
                    {viewMode === "overview" && app.status === "applied" && (
                      <div className="px-4 py-2 border-t border-neutral-800/30 flex gap-2">
                        <button onClick={() => updateStatus(app.id, "approve")} className="px-3 py-1 text-[10px] tracking-[0.1em] uppercase text-emerald-400 border border-emerald-400/20 hover:border-emerald-400 hover:bg-emerald-400/5 transition-all rounded">Approve</button>
                        <button onClick={() => updateStatus(app.id, "waitlist")} className="px-3 py-1 text-[10px] tracking-[0.1em] uppercase text-yellow-400 border border-yellow-400/20 hover:border-yellow-400 hover:bg-yellow-400/5 transition-all rounded">Waitlist</button>
                        <button onClick={() => updateStatus(app.id, "reject")} className="px-3 py-1 text-[10px] tracking-[0.1em] uppercase text-red-400 border border-red-400/20 hover:border-red-400 hover:bg-red-400/5 transition-all rounded">Reject</button>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="flex justify-between items-center px-6 md:px-16 py-12 border-t border-neutral-800">
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">Applications</div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">© 2026</div>
        </div>
      </div>
    </div>
  )
}
