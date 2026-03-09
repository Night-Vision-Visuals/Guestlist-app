"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useEventContext } from "@/lib/EventContext"
import { Pencil, Trash2, Check, X } from "lucide-react"

interface EventForm {
  name: string
  event_date: string
  location: string
  description: string
  guest_limit: string
  poster_url: string
  min_age: string
  max_age: string
}

interface EventRecord {
  id: string
  name: string
  event_date: string
  location: string | null
  description: string | null
  guest_limit: number | null
  poster_url: string | null
  min_age: number | null
  max_age: number | null
  created_at: string
}

const emptyForm: EventForm = {
  name: "",
  event_date: "",
  location: "",
  description: "",
  guest_limit: "",
  poster_url: "",
  min_age: "18",
  max_age: ""
}

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

  // Get the min date for event creation (today)
  const todayISO = new Date().toISOString().split("T")[0]

  useEffect(() => {
    // Check if current user is Admin for delete permission
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
          location: formData.location || null,
          description: formData.description || null,
          guest_limit: formData.guest_limit || null,
          poster_url: formData.poster_url || null,
          min_age: formData.min_age || 18,
          max_age: formData.max_age || null
        }),
        credentials: "include"
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
      console.error(err)
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
          location: editFormData.location || null,
          description: editFormData.description || null,
          guest_limit: editFormData.guest_limit || null,
          poster_url: editFormData.poster_url || null,
          min_age: editFormData.min_age || 18,
          max_age: editFormData.max_age || null
        }),
        credentials: "include"
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
        credentials: "include"
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
      location: event.location || "",
      created_at: event.created_at
    })
    router.push("/dashboard")
  }

  const startEditEvent = (event: EventRecord) => {
    setEditingEventId(event.id)
    setEditFormData({
      name: event.name,
      event_date: event.event_date,
      location: event.location || "",
      description: event.description || "",
      guest_limit: event.guest_limit?.toString() || "",
      poster_url: event.poster_url || "",
      min_age: event.min_age?.toString() || "18",
      max_age: event.max_age?.toString() || ""
    })
  }

  const isPastEvent = (eventDate: string) => {
    return new Date(eventDate) < new Date()
  }

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

  const FormFields = ({ data, onChange, minDate }: {
    data: EventForm,
    onChange: (d: EventForm) => void,
    minDate?: string
  }) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">Event Name *</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            required
            placeholder="e.g. Night Vision Vol. 3"
            className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
          />
        </div>
        <div>
          <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">Event Date *</label>
          <input
            type="date"
            value={data.event_date}
            onChange={(e) => onChange({ ...data, event_date: e.target.value })}
            required
            min={minDate}
            className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
          />
        </div>
        <div>
          <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">Location</label>
          <input
            type="text"
            value={data.location}
            onChange={(e) => onChange({ ...data, location: e.target.value })}
            placeholder="e.g. Vienna, Austria"
            className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
          />
        </div>
        <div>
          <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">Guest Limit</label>
          <input
            type="number"
            min="1"
            value={data.guest_limit}
            onChange={(e) => onChange({ ...data, guest_limit: e.target.value })}
            placeholder="e.g. 150"
            className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
          />
        </div>
        <div>
          <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">Minimum Age</label>
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
        <div>
          <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">Maximum Age (optional)</label>
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
      </div>
      <div>
        <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">Description</label>
        <textarea
          value={data.description}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
          placeholder="Describe the event..."
          rows={3}
          className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm resize-none"
        />
      </div>
      <div>
        <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">Poster Image URL (optional)</label>
        <input
          type="url"
          value={data.poster_url}
          onChange={(e) => onChange({ ...data, poster_url: e.target.value })}
          placeholder="https://..."
          className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
        />
      </div>
    </div>
  )

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
                        <FormFields data={editFormData} onChange={setEditFormData} minDate={undefined} />
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
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
                            <div>
                              <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">Event</p>
                              <p className="text-white font-light">{event.name}</p>
                              {isPast && <p className="text-[10px] text-neutral-600 mt-1 uppercase tracking-wider">Past</p>}
                            </div>
                            <div>
                              <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">Date</p>
                              <p className="text-white font-light text-sm">
                                {new Date(event.event_date).toLocaleDateString("de-AT", {
                                  day: "2-digit",
                                  month: "long",
                                  year: "numeric"
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">Location</p>
                              <p className="text-white font-light text-sm">{event.location || "—"}</p>
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

                        {/* Age settings badge */}
                        {(event.min_age || event.max_age) && (
                          <div className="mb-4 flex gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded border text-orange-400 border-orange-400/30 bg-orange-400/10 tracking-[0.1em]">
                              Age: {event.min_age || 18}{event.max_age ? `–${event.max_age}` : "+"}
                            </span>
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
