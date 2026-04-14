"use client"

import { createContext, useContext } from "react"
import { useCurrentEvent, Event } from "@/lib/useCurrentEvent"

interface EventContextValue {
  currentEvent: Event | null
  setCurrentEvent: (event: Event | null) => void
  events: Event[]
  isLoading: boolean
  error: string
  refetch: () => void
}

const EventContext = createContext<EventContextValue | null>(null)

export function EventProvider({ children }: { children: React.ReactNode }) {
  const value = useCurrentEvent()

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  )
}

export function useEventContext(): EventContextValue {
  const ctx = useContext(EventContext)
  if (!ctx) {
    throw new Error("useEventContext must be used within an EventProvider")
  }
  return ctx
}
