import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import QRTicket from "./QRTicket"
import CrewTicket from "./CrewTicket"

interface TicketPageProps {
  params: Promise<{ token: string }>
}

function formatEventDate(dateStr: string): string {
  try {
    return new Date(dateStr.slice(0, 10) + "T12:00:00").toLocaleDateString("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return dateStr
  }
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { token } = await params

  // Fetch application by QR token
  const { data: application, error } = await supabase
    .from("applications")
    .select("id, first_name, last_name, email, status, qr_token, event_id, checked_in, checked_in_at, role, invite_type, invitation_code_id, ticket_generated_at")
    .eq("qr_token", token)
    .single()

  if (error || !application) {
    notFound()
  }

  // Allow cancelled guests to see the cancellation screen
  if (application.status !== "approved" && application.status !== "cancelled") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase">
            This ticket is not valid
          </p>
        </div>
      </div>
    )
  }

  // Fetch event for name + date
  let eventName = ""
  let eventDate = ""
  let entryPrice = 0

  if (application.event_id) {
    const { data: event } = await supabase
      .from("events")
      .select("name, event_date, entry_fee, friendlist_discount")
      .eq("id", application.event_id)
      .single()

    if (event) {
      eventName = event.name ?? ""
      eventDate = event.event_date ? formatEventDate(event.event_date) : ""

      if (event.entry_fee != null) {
        const entryFee: number = event.entry_fee
        const friendlistDiscount: number = event.friendlist_discount ?? 0

        // Staff roles are always free
        if (!application.role || application.role === "guest") {
          let tier = application.invite_type ?? "guest"

          if (application.invitation_code_id) {
            const { data: code } = await supabase
              .from("invite_codes")
              .select("tier, invite_type")
              .eq("id", application.invitation_code_id)
              .single()
            if (code) tier = code.tier || code.invite_type || tier
          }

          if (tier === "crew" || tier === "staff") {
            entryPrice = 0
          } else if (tier === "friendlist") {
            entryPrice = Math.round(entryFee * (1 - friendlistDiscount / 100) * 100) / 100
          } else {
            entryPrice = entryFee
          }
        }
      }
    }
  }

  const isStaff = application.role && application.role !== "guest"

  if (isStaff) {
    return (
      <CrewTicket
        application={application}
        token={token}
        eventName={eventName}
        eventDate={eventDate}
      />
    )
  }

  return (
    <QRTicket
      application={application}
      token={token}
      entryPrice={entryPrice}
      ticketGeneratedAt={application.ticket_generated_at ?? null}
    />
  )
}
