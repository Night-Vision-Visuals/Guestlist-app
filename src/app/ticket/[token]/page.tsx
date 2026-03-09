import { supabase } from "@/lib/supabase"
import { notFound } from "next/navigation"
import QRTicket from "./QRTicket"

interface TicketPageProps {
  params: Promise<{ token: string }>
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { token } = await params

  // Fetch application by QR token
  const { data: application, error } = await supabase
    .from("applications")
    .select("id, first_name, last_name, email, status, qr_token, event_id, checked_in, checked_in_at")
    .eq("qr_token", token)
    .single()

  if (error || !application) {
    notFound()
  }

  if (application.status !== "approved") {
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

  return <QRTicket application={application} token={token} />
}
