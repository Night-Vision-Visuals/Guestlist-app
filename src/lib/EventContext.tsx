"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface Event {
  id: string
  name: string
  date: string
  location: string
  created_at: string
}

interface EventContextType {
  currentEvent: Event | null
  setCurrentEvent: (event: Event) => void
  events: Event[]
  isLoading: boolean
  error: string
}

const EventContext = createContext<EventContextType | undefined>(undefined)

export function EventProvider({ children }: { children: ReactNode }) {
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
      const res = await fetch("/api/events", { credentials: "include" })
      if (!res.ok) throw new Error("Failed to fetch events")
      const data = await res.json()
      // Map event_date to date for compatibility with the Event interface
      const mapped = (data || []).map((ev: Event & { event_date?: string }) => ({
        ...ev,
        date: ev.date || ev.event_date || ""
      }))
      setEvents(mapped)
      if (mapped && mapped.length > 0) {
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

  return (
    <EventContext.Provider value={{ currentEvent, setCurrentEvent, events, isLoading, error }}>
      {children}
    </EventContext.Provider>
  )
}

export function useEventContext() {
  const context = useContext(EventContext)
  if (context === undefined) {
    throw new Error("useEventContext must be used within an EventProvider")
  }
  return context
}
