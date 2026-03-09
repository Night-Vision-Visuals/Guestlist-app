/**
 * @file EventContext.tsx
 * React context that fetches all events from the API once and shares them
 * across the entire admin dashboard.
 *
 * Why a context?
 * The dashboard has five tabs (Applications, Analytics, Invitations, Events,
 * Scanner) that all need to know which event is currently selected. Rather than
 * each page fetching events independently, `EventProvider` fetches once on
 * mount and exposes:
 *   - `events`       — full list of events, most recent first
 *   - `currentEvent` — the event currently selected in the sidebar dropdown
 *   - `setCurrentEvent` — called by the sidebar or the Events page to switch context
 *   - `isLoading`    — true while the initial fetch is in progress
 *   - `error`        — non-empty string if the fetch failed
 *
 * Usage:
 *   Wrap the dashboard layout in `<EventProvider>` (done in `dashboard/layout.tsx`).
 *   Inside any dashboard component, call `useEventContext()` to access the values.
 *
 * @example
 * ```tsx
 * const { currentEvent, isLoading } = useEventContext()
 * if (isLoading) return <Spinner />
 * fetchData(currentEvent.id)
 * ```
 */
"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

/** Minimal event shape shared across the dashboard. */
export interface Event {
  id: string
  name: string
  /** ISO date string (mapped from `event_date` column) */
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
