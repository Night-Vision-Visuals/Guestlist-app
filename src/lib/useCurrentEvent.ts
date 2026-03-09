/**
 * @file useCurrentEvent.ts
 * @deprecated Use `useEventContext()` from `EventContext.tsx` instead.
 *
 * Legacy standalone hook that fetches events independently. Kept for backwards
 * compatibility. New code should use the shared `EventContext` so that all
 * dashboard tabs stay in sync without triggering duplicate API calls.
 */
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

      const data = await res.json()
      setEvents(data || [])

      // Set current event to most recent one
      if (data && data.length > 0) {
        setCurrentEvent(data[0])
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