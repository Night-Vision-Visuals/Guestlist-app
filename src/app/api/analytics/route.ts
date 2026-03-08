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
        approvalRate: totalApplications > 0 ? Math.round((approved / totalApplications) * 100) : 0
      },
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