"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useEventContext } from "@/lib/EventContext"
import { Pencil, Trash2, Check, X, ChevronLeft, ChevronRight } from "lucide-react"

interface EventForm {
  name: string
  event_date: string
  description: string
  guest_limit: string
  poster_url: string
  min_age: string
  max_age: string
  entry_fee: string
  friendlist_discount: string
}

interface EventRecord {
  id: string
  name: string
  event_date: string
  description: string | null
  guest_limit: number | null
  poster_url: string | null
  min_age: number | null
  max_age: number | null
  entry_fee: number | null
  friendlist_discount: number | null
  created_at: string
}

const emptyForm: EventForm = {
  name: "",
  event_date: "",
  description: "",
  guest_limit: "",
  poster_url: "",
  min_age: "18",
  max_age: "",
  entry_fee: "",
  friendlist_discount: "",
}

// ─── Calendar picker ──────────────────────────────────────────────────────────
// Standalone component defined OUTSIDE the page so it never remounts on render.

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function CalendarPicker({
  value,
  onChange,
  minDate,
}: {
  value: string
  onChange: (date: string) => void
  minDate?: string
}) {
  const today = new Date()
  const initial = value ? new Date(value + "T12:00:00") : today
  const [viewYear, setViewYear] = useState(() => {
    const y = initial.getFullYear()
    return isNaN(y) ? today.getFullYear() : y
  })
  const [viewMonth, setViewMonth] = useState(() => {
    const m = initial.getMonth()
    return isNaN(m) ? today.getMonth() : m
  })

  // Sync view to value when it changes externally (e.g. switching between edit forms)
  useEffect(() => {
    if (!value) return
    const d = new Date(value + "T12:00:00")
    if (isNaN(d.getTime())) return
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }, [value])

  const minD = minDate ? new Date(minDate + "T00:00:00") : null

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  // Make Monday = 0
  const startOffset = (firstDay + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const isSelected = (day: number) => {
    if (!value) return false
    const d = new Date(value + "T12:00:00")
    return d.getFullYear() === viewYear && d.getMonth() === viewMonth && d.getDate() === day
  }

  const isDisabled = (day: number) => {
    if (!minD) return false
    const d = new Date(viewYear, viewMonth, day)
    return d < minD
  }

  const select = (day: number) => {
    if (isDisabled(day)) return
    const mm = String(viewMonth + 1).padStart(2, "0")
    const dd = String(day).padStart(2, "0")
    onChange(`${viewYear}-${mm}-${dd}`)
  }

  return (
    <div className="border border-neutral-800 bg-neutral-950 p-4 rounded-lg select-none w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 text-neutral-500 hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm text-white font-light tracking-[0.15em]">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 text-neutral-500 hover:text-white transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map(d => (
          <div key={d} className="text-center text-[10px] tracking-[0.15em] uppercase text-neutral-600 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => (
          <div key={i} className="flex items-center justify-center">
            {day === null ? null : (
              <button
                type="button"
                onClick={() => select(day)}
                disabled={isDisabled(day)}
                className={`w-8 h-8 text-xs rounded transition-all duration-150 ${
                  isSelected(day)
                    ? "bg-white text-black font-medium"
                    : isDisabled(day)
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

      {/* Selected value display */}
      {value && (
        <div className="mt-3 pt-3 border-t border-neutral-800 text-center">
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

// ─── FormFields ───────────────────────────────────────────────────────────────
// Also defined OUTSIDE the page component to prevent remounting on each render.

function FormFields({
  data,
  onChange,
  minDate,
}: {
  data: EventForm
  onChange: (d: EventForm) => void
  minDate?: string
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Event Name */}
        <div>
          <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">
            Event Name *
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            required
            placeholder="e.g. Night Vision Vol. 3"
            className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
          />
        </div>

        {/* Guest Limit */}
        <div>
          <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">
            Guest Limit
          </label>
          <input
            type="number"
            min="1"
            value={data.guest_limit}
            onChange={(e) => onChange({ ...data, guest_limit: e.target.value })}
            placeholder="e.g. 150"
            className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
          />
        </div>

        {/* Min Age */}
        <div>
          <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">
            Minimum Age
          </label>
          <input
            type="number"
            min="18"
            max="99"
            value={data.min_age}
            onChange={(e) => onChange({ ...data, min_age: e.target.value })}
            placeholder="18"
            className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
          />
        </div>

        {/* Max Age */}
        <div>
          <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">
            Maximum Age (optional)
          </label>
          <input
            type="number"
            min="18"
            max="99"
            value={data.max_age}
            onChange={(e) => onChange({ ...data, max_age: e.target.value })}
            placeholder="No limit"
            className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
          />
        </div>

        {/* Entry Fee */}
        <div>
          <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">
            Entry Fee (€, optional)
          </label>
          <input
            type="number"
            min="0"
            step="0.50"
            value={data.entry_fee}
            onChange={(e) => onChange({ ...data, entry_fee: e.target.value })}
            placeholder="e.g. 10.00"
            className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
          />
        </div>

        {/* Friendlist Discount */}
        <div>
          <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">
            Friendlist Discount % (optional)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={data.friendlist_discount}
            onChange={(e) => onChange({ ...data, friendlist_discount: e.target.value })}
            placeholder="e.g. 50"
            className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">
          Description
        </label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Describe the event..."
          rows={3}
          className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm resize-none"
        />
      </div>

      {/* Poster URL */}
      <div>
        <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">
          Poster Image URL (optional)
        </label>
        <input
          type="url"
          value={data.poster_url}
          onChange={(e) => onChange({ ...data, poster_url: e.target.value })}
          placeholder="https://..."
          className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
        />
      </div>

      {/* Date picker */}
      <div>
        <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3 block">
          Event Date *
        </label>
        <CalendarPicker
          value={data.event_date}
          onChange={(date) => onChange({ ...data, event_date: date })}
          minDate={minDate}
        />
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EventsPage() {
  const router = useRouter()
  const { events, isLoading: eventsLoading, setCurrentEvent } = useEventContext()
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState<EventForm>(emptyForm)
  const [editingEventId, setEditingEventId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<EventForm>(emptyForm)
  const [adminUsername, setAdminUsername] = useState<string | null>(null)

  const todayISO = new Date().toISOString().split("T")[0]

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then(r => r.json())
      .then(d => setAdminUsername(d?.username || null))
      .catch(() => {})
  }, [])

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsCreating(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          event_date: formData.event_date,
          description: formData.description || null,
          guest_limit: formData.guest_limit || null,
          poster_url: formData.poster_url || null,
          min_age: formData.min_age || 18,
          max_age: formData.max_age || null,
          entry_fee: formData.entry_fee || null,
          friendlist_discount: formData.friendlist_discount || null,
        }),
        credentials: "include",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create event")
      }

      setSuccess(`Event "${formData.name}" created successfully!`)
      setFormData(emptyForm)
      setShowForm(false)
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create event")
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditEvent = async (eventId: string) => {
    setIsCreating(true)
    setError("")
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: eventId,
          name: editFormData.name,
          event_date: editFormData.event_date,
          description: editFormData.description || null,
          guest_limit: editFormData.guest_limit || null,
          poster_url: editFormData.poster_url || null,
          min_age: editFormData.min_age || 18,
          max_age: editFormData.max_age || null,
          entry_fee: editFormData.entry_fee || null,
          friendlist_discount: editFormData.friendlist_discount || null,
        }),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to update event")
      setSuccess("Event updated successfully!")
      setEditingEventId(null)
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!confirm(`Are you sure you want to delete "${eventName}"? This action cannot be undone.`)) return
    if (!confirm(`Final confirmation: Delete "${eventName}" permanently?`)) return

    try {
      const res = await fetch("/api/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: eventId }),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete event")
      setSuccess("Event deleted successfully")
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event")
    }
  }

  const handleSelectEvent = (event: EventRecord) => {
    setCurrentEvent({
      id: event.id,
      name: event.name,
      date: event.event_date,
      location: "",
      created_at: event.created_at,
    })
    router.push("/dashboard")
  }

  const startEditEvent = (event: EventRecord) => {
    setEditingEventId(event.id)
    setEditFormData({
      name: event.name,
      event_date: event.event_date,
      description: event.description || "",
      guest_limit: event.guest_limit?.toString() || "",
      poster_url: event.poster_url || "",
      min_age: event.min_age?.toString() || "18",
      max_age: event.max_age?.toString() || "",
      entry_fee: event.entry_fee?.toString() || "",
      friendlist_discount: event.friendlist_discount?.toString() || "",
    })
  }

  const isPastEvent = (eventDate: string) => new Date(eventDate + "T12:00:00") < new Date()

  if (eventsLoading) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <p className="text-lg tracking-[0.2em] uppercase text-neutral-400">Loading events</p>
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
          {/* Header */}
          <div className="mb-12 space-y-4">
            <h1 className="text-5xl md:text-6xl font-light tracking-tight">
              <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                Events
              </span>
            </h1>
            <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
              Manage and create events
            </p>
            <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
          </div>

          {error && (
            <div className="mb-8 text-sm tracking-[0.15em] py-3 px-4 border border-red-400/30 text-red-400 bg-red-400/5">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-8 text-sm tracking-[0.15em] py-3 px-4 border border-emerald-400/30 text-emerald-400 bg-emerald-400/5">
              {success}
            </div>
          )}

          <button
            onClick={() => setShowForm(!showForm)}
            className="mb-8 px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 transition-all duration-300 text-xs tracking-[0.2em] uppercase rounded"
          >
            {showForm ? "Cancel" : "+ Create New Event"}
          </button>

          {showForm && (
            <div className="mb-12 border border-neutral-800 p-6 rounded-lg">
              <h2 className="text-xl font-light mb-6">New Event</h2>
              <form onSubmit={handleCreateEvent} className="space-y-6">
                <FormFields data={formData} onChange={setFormData} minDate={todayISO} />
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs tracking-[0.2em] uppercase rounded disabled:opacity-50 transition-all duration-300"
                >
                  {isCreating ? "Creating..." : "Create Event"}
                </button>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-500 text-sm tracking-[0.15em] uppercase">No events yet</p>
              </div>
            ) : (
              (events as unknown as EventRecord[]).map((event) => {
                const isPast = isPastEvent(event.event_date)
                const isEditing = editingEventId === event.id
                return (
                  <div
                    key={event.id}
                    className={`border p-6 transition-all duration-300 ${
                      isPast ? "border-neutral-800/50 opacity-70" : "border-neutral-800 hover:border-neutral-700"
                    }`}
                  >
                    {isEditing ? (
                      <div>
                        <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-4">Edit Event</p>
                        <FormFields data={editFormData} onChange={setEditFormData} />
                        <div className="flex gap-3 mt-6">
                          <button
                            onClick={() => handleEditEvent(event.id)}
                            disabled={isCreating}
                            className="flex items-center gap-1 px-4 py-2 text-xs tracking-[0.1em] uppercase text-emerald-400 border border-emerald-400/30 hover:border-emerald-400 hover:bg-emerald-400/5 transition-all rounded disabled:opacity-50"
                          >
                            <Check size={12} /> Save Changes
                          </button>
                          <button
                            onClick={() => setEditingEventId(null)}
                            className="flex items-center gap-1 px-4 py-2 text-xs tracking-[0.1em] uppercase text-neutral-400 border border-neutral-700 hover:border-neutral-500 transition-all rounded"
                          >
                            <X size={12} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between mb-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                            <div>
                              <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">Event</p>
                              <p className="text-white font-light">{event.name}</p>
                              {isPast && (
                                <p className="text-[10px] text-neutral-600 mt-1 uppercase tracking-wider">Past</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">Date</p>
                              <p className="text-white font-light text-sm">
                                {new Date(event.event_date.slice(0, 10) + "T12:00:00").toLocaleDateString("de-AT", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">Guest Limit</p>
                              <p className="text-white font-light text-sm">{event.guest_limit ?? "Unlimited"}</p>
                            </div>
                          </div>
                          {/* Action icons */}
                          <div className="flex items-center gap-2 ml-4">
                            {!isPast && (
                              <button
                                onClick={() => startEditEvent(event)}
                                title="Edit Event"
                                className="p-2 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-all"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {adminUsername === "Admin" && (
                              <button
                                onClick={() => handleDeleteEvent(event.id, event.name)}
                                title="Delete Event"
                                className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-all"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        {(event.min_age || event.max_age || event.entry_fee != null || event.friendlist_discount != null) && (
                          <div className="mb-4 flex gap-2 flex-wrap">
                            {(event.min_age || event.max_age) && (
                              <span className="text-[10px] px-2 py-0.5 rounded border text-orange-400 border-orange-400/30 bg-orange-400/10 tracking-[0.1em]">
                                Age: {event.min_age || 18}{event.max_age ? `–${event.max_age}` : "+"}
                              </span>
                            )}
                            {event.entry_fee != null && (
                              <span className="text-[10px] px-2 py-0.5 rounded border text-cyan-400 border-cyan-400/30 bg-cyan-400/10 tracking-[0.1em]">
                                Entry: €{event.entry_fee}
                              </span>
                            )}
                            {event.friendlist_discount != null && (
                              <span className="text-[10px] px-2 py-0.5 rounded border text-purple-400 border-purple-400/30 bg-purple-400/10 tracking-[0.1em]">
                                Friendlist: {event.friendlist_discount}% off
                              </span>
                            )}
                          </div>
                        )}

                        {event.description && (
                          <p className="text-neutral-400 text-sm font-light mb-4 italic">{event.description}</p>
                        )}

                        {event.poster_url && (
                          <div className="mb-4">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={event.poster_url}
                              alt={`${event.name} poster`}
                              className="h-32 object-cover rounded border border-neutral-800"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                            />
                          </div>
                        )}

                        <div className="border-t border-neutral-800 pt-4">
                          <button
                            onClick={() => handleSelectEvent(event)}
                            className="px-4 py-2 text-xs tracking-[0.2em] uppercase text-emerald-400 border border-emerald-400/30 hover:border-emerald-400 hover:bg-emerald-400/5 transition-all duration-300 rounded"
                          >
                            Select as Current Event
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="flex justify-between items-center px-6 md:px-16 py-12 border-t border-neutral-800">
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">Event Manager</div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">© 2026</div>
        </div>
      </div>
    </div>
  )
}
