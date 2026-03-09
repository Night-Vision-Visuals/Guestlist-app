/**
 * @file /api/analytics/route.ts
 * GET /api/analytics?eventId=<uuid>
 *
 * Returns aggregated statistics for a single event. All calculations are done
 * server-side from the raw `applications` and `invite_codes` rows so the client
 * never sees individual guest records through this endpoint.
 *
 * Response includes:
 *   - Application counts by status (total, approved, rejected, waitlist, pending,
 *     cancelled, checked-in, approval rate %)
 *   - Gender distribution (male / female / diverse counts + percentages)
 *   - Average guest age (calculated from `date_of_birth`)
 *   - "Heard about us" distribution (breakdown by source)
 *   - Invite code stats (total codes, total uses capacity, actual uses, usage %)
 *   - Applications grouped by calendar day (for the timeline chart)
 *
 * Auth: admin JWT cookie required.
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get("eventId")

    console.log("Fetching analytics for event:", eventId)

    // Check if admin is authenticated
    const admin = await verifyAdminSession()

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    if (!eventId) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      )
    }

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      )
    }

    // Fetch all applications for this event
    const { data: applications, error: appError } = await supabase
      .from("applications")
      .select("*")
      .eq("event_id", eventId)

    if (appError) {
      console.error("Error fetching applications:", appError)
      return NextResponse.json(
        { error: "Failed to fetch applications" },
        { status: 500 }
      )
    }

    // Calculate statistics
    const totalApplications = applications?.length || 0
    const approved = applications?.filter((app: any) => app.status === "approved").length || 0
    const rejected = applications?.filter((app: any) => app.status === "rejected").length || 0
    const waitlist = applications?.filter((app: any) => app.status === "waitlist").length || 0
    const pending = applications?.filter((app: any) => app.status === "applied").length || 0
    const cancelled = applications?.filter((app: any) => app.status === "cancelled").length || 0
    const checkedIn = applications?.filter((app: any) => app.checked_in).length || 0

    // Gender statistics
    const male = applications?.filter((app: any) => app.gender === "male").length || 0
    const female = applications?.filter((app: any) => app.gender === "female").length || 0
    const diverse = applications?.filter((app: any) => app.gender === "diverse").length || 0

    // Average age calculation
    const calculateAge = (dob: string) => {
      const today = new Date()
      const birth = new Date(dob)
      let age = today.getFullYear() - birth.getFullYear()
      const m = today.getMonth() - birth.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
      return age
    }
    const ages = applications?.filter((app: any) => app.date_of_birth).map((app: any) => calculateAge(app.date_of_birth)) || []
    const averageAge = ages.length > 0 ? Math.round(ages.reduce((a: number, b: number) => a + b, 0) / ages.length) : 0

    // Heard about us distribution
    const heardAboutUs: { [key: string]: number } = {}
    applications?.forEach((app: any) => {
      if (app.heard_about_us) {
        heardAboutUs[app.heard_about_us] = (heardAboutUs[app.heard_about_us] || 0) + 1
      }
    })

    // Fetch invitation code stats
    const { data: inviteCodes, error: inviteError } = await supabase
      .from("invite_codes")
      .select("id, max_uses, current_uses, created_at")

    if (inviteError) {
      console.error("Error fetching invite codes:", inviteError)
    }

    const totalInviteCodes = inviteCodes?.length || 0
    const totalInvitesGenerated = inviteCodes?.reduce((sum: number, code: any) => sum + code.max_uses, 0) || 0
    const totalInvitesUsed = inviteCodes?.reduce((sum: number, code: any) => sum + code.current_uses, 0) || 0

    // Get applications by day (for chart)
    const applicationsByDay: { [key: string]: number } = {}
    applications?.forEach((app: any) => {
      const day = new Date(app.created_at).toLocaleDateString()
      applicationsByDay[day] = (applicationsByDay[day] || 0) + 1
    })

    return NextResponse.json({
      event,
      statistics: {
        total: totalApplications,
        approved,
        rejected,
        waitlist,
        pending,
        cancelled,
        checkedIn,
        approvalRate: totalApplications > 0 ? Math.round((approved / totalApplications) * 100) : 0
      },
      genderStats: {
        male,
        female,
        diverse,
        malePercent: totalApplications > 0 ? Math.round((male / totalApplications) * 100) : 0,
        femalePercent: totalApplications > 0 ? Math.round((female / totalApplications) * 100) : 0,
        diversePercent: totalApplications > 0 ? Math.round((diverse / totalApplications) * 100) : 0,
        averageAge
      },
      heardAboutUs,
      inviteStats: {
        totalCodes: totalInviteCodes,
        totalGenerated: totalInvitesGenerated,
        totalUsed: totalInvitesUsed,
        usageRate: totalInvitesGenerated > 0 ? Math.round((totalInvitesUsed / totalInvitesGenerated) * 100) : 0
      },
      applicationsByDay
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}