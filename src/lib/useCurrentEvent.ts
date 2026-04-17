import { useEffect, useState } from "react"

export interface Event {
  id: string
  name: string
  date: string
  location: string
  created_at: string
}

export function useCurrentEvent() {
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/events", {
        credentials: "include"
      })

      if (!res.ok) {
        throw new Error("Failed to fetch events")
      }

      const raw: (Event & { event_date?: string })[] = await res.json()

      // The API returns `event_date` but our Event interface uses `date`.
      // Map here so every consumer gets the correct field.
      const mapped: Event[] = (raw || []).map((e) => ({
        ...e,
        // Supabase may return event_date as a full ISO string like "2026-04-20T00:00:00+00:00"
        // Slice to just "YYYY-MM-DD" so date formatting never produces "Invalid Date"
        date: (e.event_date ?? e.date ?? "").slice(0, 10),
      }))

      setEvents(mapped)

      // Set current event to most recent one
      if (mapped.length > 0) {
        setCurrentEvent(mapped[0])
      }

      setError("")
    } catch (err) {
      console.error(err)
      setError("Error fetching events")
    } finally {
      setIsLoading(false)
    }
  }

  return {
    currentEvent,
    setCurrentEvent,
    events,
    isLoading,
    error,
    refetch: fetchEvents
  }
}