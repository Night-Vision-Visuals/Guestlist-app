"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useEventContext } from "@/lib/EventContext"

interface EventForm {
  name: string
  event_date: string
  location: string
  description: string
  guest_limit: string
  poster_url: string
}

interface EventRecord {
  id: string
  name: string
  event_date: string
  location: string | null
  description: string | null
  guest_limit: number | null
  poster_url: string | null
  created_at: string
}

export default function EventsPage() {
  const router = useRouter()
  const { events, isLoading: eventsLoading, setCurrentEvent } = useEventContext()
  const [isCreating, setIsCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState<EventForm>({
    name: "",
    event_date: "",
    location: "",
    description: "",
    guest_limit: "",
    poster_url: ""
  })

  useEffect(() => {
    // Redirect if not events in context (handled by dashboard layout auth check)
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
          poster_url: formData.poster_url || null
        }),
        credentials: "include"
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create event")
      }

      setSuccess(`Event "${formData.name}" created successfully!`)
      setFormData({
        name: "",
        event_date: "",
        location: "",
        description: "",
        guest_limit: "",
        poster_url: ""
      })
      setShowForm(false)

      // Reload page to refresh event list via context
      window.location.reload()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to create event")
    } finally {
      setIsCreating(false)
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
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center px-6 md:px-16 py-12 border-b border-neutral-800">
          <div className="space-y-1">
            <div className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">NIGHT VISION</div>
            <div className="h-px w-12 bg-gradient-to-r from-white to-transparent" />
          </div>
          <div className="text-right">
            <div className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">
              {events.length} Events
            </div>
          </div>
        </div>

        <div className="px-6 md:px-16 py-12">
          {/* Title */}
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

          {/* Messages */}
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

          {/* Create Button */}
          <button
            onClick={() => setShowForm(!showForm)}
            className="mb-8 px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 transition-all duration-300 text-xs tracking-[0.2em] uppercase rounded"
          >
            {showForm ? "Cancel" : "+ Create New Event"}
          </button>

          {/* Create Form */}
          {showForm && (
            <div className="mb-12 border border-neutral-800 p-6 rounded-lg">
              <h2 className="text-xl font-light mb-6">New Event</h2>
              <form onSubmit={handleCreateEvent} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Event Name */}
                  <div>
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">
                      Event Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="e.g. Night Vision Vol. 3"
                      className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
                    />
                  </div>

                  {/* Event Date */}
                  <div>
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      required
                      className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">
                      Location
                    </label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Vienna, Austria"
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
                      value={formData.guest_limit}
                      onChange={(e) => setFormData({ ...formData, guest_limit: e.target.value })}
                      placeholder="e.g. 150"
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
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    value={formData.poster_url}
                    onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
                  />
                  <p className="text-[10px] tracking-[0.15em] uppercase text-neutral-600 mt-2">
                    Upload the image to a hosting service and paste the URL
                  </p>
                </div>

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

          {/* Events List */}
          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-500 text-sm tracking-[0.15em] uppercase">No events yet</p>
              </div>
            ) : (
              (events as unknown as EventRecord[]).map((event) => (
                <div
                  key={event.id}
                  className="border border-neutral-800 hover:border-neutral-700 p-6 transition-all duration-300"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-4">
                    <div>
                      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">Event</p>
                      <p className="text-white font-light">{event.name}</p>
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
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 md:px-16 py-12 border-t border-neutral-800">
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">Event Manager</div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">© 2026</div>
        </div>
      </div>
    </div>
  )
}
