/**
 * @file src/lib/sendEmails.ts
 *
 * Core email sending utility.
 *
 * sendPendingEmails(eventId) — queries all applications for an event that
 * have status "approved" or "rejected" and have not yet been emailed
 * (email_sent_at IS NULL), then sends each guest their appropriate email
 * via Resend and marks email_sent_at + email_type in the database.
 *
 * sendSingleEmail(applicationId) — sends an email to a single guest
 * immediately, regardless of batch state. Used for late registrants.
 *
 * Both functions return a SendResult summary.
 */

import { Resend } from "resend"
import QRCode from "qrcode"
import { supabase } from "@/lib/supabase"
import { renderApprovalEmail } from "@/lib/emails/ApprovalEmail"
import { renderRejectionEmail } from "@/lib/emails/RejectionEmail"

export interface SendResult {
  sent: number
  failed: number
  skipped: number
  errors: string[]
}

interface ApplicationRow {
  id: string
  first_name: string
  last_name: string
  email: string
  status: string
  qr_token: string | null
  email_sent_at: string | null
  event_id: string
}

interface EventRow {
  id: string
  name: string
  event_date: string
}

function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY is not set in environment variables")
  return new Resend(key)
}

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
}

function formatEventDate(dateStr: string): string {
  try {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("de-DE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return dateStr
  }
}

async function generateQrDataUrl(ticketUrl: string): Promise<string> {
  return QRCode.toDataURL(ticketUrl, {
    width: 400,
    margin: 2,
    color: { dark: "#FFFFFF", light: "#000000" },
  })
}

async function sendEmailForApplication(
  resend: Resend,
  app: ApplicationRow,
  event: EventRow
): Promise<void> {
  const appUrl = getAppUrl()
  const guestName = `${app.first_name} ${app.last_name}`
  const eventDate = formatEventDate(event.event_date)
  const fromAddress = process.env.RESEND_FROM_ADDRESS || "Night Vision <noreply@nightvision.com>"

  let html: string
  let subject: string

  if (app.status === "approved") {
    if (!app.qr_token) {
      throw new Error(`Approved guest ${app.id} has no qr_token`)
    }
    const ticketUrl = `${appUrl}/ticket/${app.qr_token}`
    const qrCodeDataUrl = await generateQrDataUrl(ticketUrl)

    html = renderApprovalEmail({
      guestName,
      eventName: event.name,
      eventDate,
      ticketUrl,
      qrCodeDataUrl,
    })
    subject = `You're on the list — ${event.name}`
  } else if (app.status === "rejected") {
    html = renderRejectionEmail({
      guestName,
      eventName: event.name,
      eventDate,
    })
    subject = `Application update — ${event.name}`
  } else {
    throw new Error(`Unsupported status for emailing: ${app.status}`)
  }

  const { error } = await resend.emails.send({
    from: fromAddress,
    to: app.email,
    subject,
    html,
  })

  if (error) {
    throw new Error(`Resend error for ${app.email}: ${error.message}`)
  }

  // Mark as sent in DB
  await supabase
    .from("applications")
    .update({
      email_sent_at: new Date().toISOString(),
      email_type: app.status,
    })
    .eq("id", app.id)
}

/**
 * Send emails to all unsent approved/rejected guests for a given event.
 */
export async function sendPendingEmails(eventId: string): Promise<SendResult> {
  const result: SendResult = { sent: 0, failed: 0, skipped: 0, errors: [] }

  // Fetch event details
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, name, event_date")
    .eq("id", eventId)
    .single()

  if (eventError || !event) {
    result.errors.push("Event not found: " + (eventError?.message || "unknown"))
    return result
  }

  // Fetch all unsent approved/rejected applications for this event
  const { data: applications, error: appsError } = await supabase
    .from("applications")
    .select("id, first_name, last_name, email, status, qr_token, email_sent_at, event_id")
    .eq("event_id", eventId)
    .in("status", ["approved", "rejected"])
    .is("email_sent_at", null)

  if (appsError) {
    result.errors.push("Failed to fetch applications: " + appsError.message)
    return result
  }

  if (!applications || applications.length === 0) {
    return result
  }

  const resend = getResend()

  for (const app of applications) {
    try {
      await sendEmailForApplication(resend, app as ApplicationRow, event as EventRow)
      result.sent++
    } catch (err) {
      result.failed++
      result.errors.push(
        `Failed for ${app.first_name} ${app.last_name} (${app.email}): ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  return result
}

/**
 * Send an email immediately to a single application.
 * Used when batch has already been sent and a new guest gets approved/rejected.
 */
export async function sendSingleEmail(applicationId: string): Promise<SendResult> {
  const result: SendResult = { sent: 0, failed: 0, skipped: 0, errors: [] }

  const { data: app, error: appError } = await supabase
    .from("applications")
    .select("id, first_name, last_name, email, status, qr_token, email_sent_at, event_id")
    .eq("id", applicationId)
    .single()

  if (appError || !app) {
    result.errors.push("Application not found")
    return result
  }

  if (app.email_sent_at) {
    result.skipped++
    return result
  }

  if (!["approved", "rejected"].includes(app.status)) {
    result.skipped++
    return result
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .select("id, name, event_date")
    .eq("id", app.event_id)
    .single()

  if (eventError || !event) {
    result.errors.push("Event not found")
    return result
  }

  const resend = getResend()

  try {
    await sendEmailForApplication(resend, app as ApplicationRow, event as EventRow)
    result.sent++
  } catch (err) {
    result.failed++
    result.errors.push(err instanceof Error ? err.message : String(err))
  }

  return result
}

/**
 * Check whether the email batch has already been sent for an event.
 * Uses the explicit batch_email_sent flag on the events table.
 */
export async function isBatchSent(eventId: string): Promise<boolean> {
  const { data } = await supabase
    .from("events")
    .select("batch_email_sent")
    .eq("id", eventId)
    .single()

  return data?.batch_email_sent === true
}

/**
 * Mark the batch as sent for an event.
 */
export async function markBatchSent(eventId: string): Promise<void> {
  await supabase
    .from("events")
    .update({ batch_email_sent: true })
    .eq("id", eventId)
}
