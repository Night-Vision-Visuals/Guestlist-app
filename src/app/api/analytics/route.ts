/**
 * @file /api/analytics/route.ts
 * GET /api/analytics?eventId=<uuid>
 *
 * Returns aggregated statistics for a single event.
 *
 * Auth: admin JWT cookie required.
 */
import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { verifyAdminSession } from "@/lib/auth"

const AGE_BRACKETS = [
  { label: "18–20", min: 18, max: 20 },
  { label: "21–23", min: 21, max: 23 },
  { label: "24–26", min: 24, max: 26 },
  { label: "27–29", min: 27, max: 29 },
  { label: "30–34", min: 30, max: 34 },
  { label: "35–39", min: 35, max: 39 },
  { label: "40+",   min: 40, max: Infinity },
]

function calcAge(dob: string): number {
  const today = new Date()
  const birth = new Date(dob)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const eventId = searchParams.get("eventId")

    const admin = await verifyAdminSession()
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!eventId) return NextResponse.json({ error: "Event ID is required" }, { status: 400 })

    // Fetch event
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    // Fetch all applications for this event
    const { data: applications, error: appError } = await supabase
      .from("applications")
      .select("*")
      .eq("event_id", eventId)

    if (appError) {
      console.error("Error fetching applications:", appError)
      return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 })
    }

    const apps = applications || []

    // ── Status counts ──────────────────────────────────────────────────────────
    const total      = apps.length
    const approved   = apps.filter((a: any) => a.status === "approved").length
    const rejected   = apps.filter((a: any) => a.status === "rejected").length
    const waitlist   = apps.filter((a: any) => a.status === "waitlist").length
    const pending    = apps.filter((a: any) => a.status === "applied").length
    const cancelled  = apps.filter((a: any) => a.status === "cancelled").length
    const checkedIn  = apps.filter((a: any) => a.checked_in).length
    const noShows    = approved - checkedIn

    // ── Gender ────────────────────────────────────────────────────────────────
    const male    = apps.filter((a: any) => a.gender === "male").length
    const female  = apps.filter((a: any) => a.gender === "female").length
    const diverse = apps.filter((a: any) => a.gender === "diverse").length

    const approvedApps = apps.filter((a: any) => a.status === "approved")
    const maleApproved    = approvedApps.filter((a: any) => a.gender === "male").length
    const femaleApproved  = approvedApps.filter((a: any) => a.gender === "female").length
    const diverseApproved = approvedApps.filter((a: any) => a.gender === "diverse").length

    // ── Age ───────────────────────────────────────────────────────────────────
    const ages         = apps.filter((a: any) => a.date_of_birth).map((a: any) => ({ age: calcAge(a.date_of_birth), gender: a.gender }))
    const agesApproved = approvedApps.filter((a: any) => a.date_of_birth).map((a: any) => ({ age: calcAge(a.date_of_birth), gender: a.gender }))

    const allAges = ages.map((a: any) => a.age)
    const approvedAges = agesApproved.map((a: any) => a.age)

    const avgAge         = allAges.length > 0 ? Math.round(allAges.reduce((s: number, v: number) => s + v, 0) / allAges.length) : 0
    const avgAgeApproved = approvedAges.length > 0 ? Math.round(approvedAges.reduce((s: number, v: number) => s + v, 0) / approvedAges.length) : 0
    const minAge         = allAges.length > 0 ? Math.min(...allAges) : 0
    const maxAge         = allAges.length > 0 ? Math.max(...allAges) : 0
    const minAgeApproved = approvedAges.length > 0 ? Math.min(...approvedAges) : 0
    const maxAgeApproved = approvedAges.length > 0 ? Math.max(...approvedAges) : 0

    // ── Age distribution buckets (with gender breakdown) ──────────────────────
    const ageDistribution = AGE_BRACKETS.map(({ label, min, max }) => {
      const inBracket         = ages.filter((a: any) => a.age >= min && a.age <= max)
      const inBracketApproved = agesApproved.filter((a: any) => a.age >= min && a.age <= max)
      return {
        label,
        count:          inBracket.length,
        countApproved:  inBracketApproved.length,
        countMale:      inBracket.filter((a: any) => a.gender === "male").length,
        countFemale:    inBracket.filter((a: any) => a.gender === "female").length,
        countDiverse:   inBracket.filter((a: any) => a.gender === "diverse").length,
      }
    })

    // ── Heard about us ────────────────────────────────────────────────────────
    const heardAboutUs: Record<string, number> = {}
    apps.forEach((a: any) => {
      if (a.heard_about_us) {
        heardAboutUs[a.heard_about_us] = (heardAboutUs[a.heard_about_us] || 0) + 1
      }
    })

    // ── Invite codes (scoped to this event) ───────────────────────────────────
    const { data: inviteCodes, error: inviteError } = await supabase
      .from("invite_codes")
      .select("id, code_hash, max_uses, current_uses, created_at, declined_at, revoked_at, redeemed, tier, comment, invite_type, created_by_admin_id, admins(username)")
      .eq("event_id", eventId)

    if (inviteError) {
      console.error("Error fetching invite codes:", inviteError)
    }

    const codes = inviteCodes || []
    const totalInviteCodes      = codes.length
    const totalInvitesGenerated = codes.reduce((s: number, c: any) => s + c.max_uses, 0)
    const totalInvitesUsed      = codes.reduce((s: number, c: any) => s + c.current_uses + (c.declined_at != null ? 1 : 0), 0)
    const totalDeclined         = codes.filter((c: any) => c.declined_at != null).length

    // Build a map from invite_code_id → tier for income calculation
    const codeToTier: Record<string, string> = {}
    codes.forEach((c: any) => {
      codeToTier[c.id] = c.tier || c.invite_type || "guest"
    })

    // ── Income calculation ────────────────────────────────────────────────────
    const entryFee:           number | null = event.entry_fee ?? null
    const friendlistDiscount: number | null = event.friendlist_discount ?? null

    const calcGuestPrice = (app: any): number => {
      if (entryFee === null) return 0
      const tier = app.invitation_code_id ? (codeToTier[app.invitation_code_id] || "guest") : "guest"
      if (tier === "crew") return 0
      if (tier === "friendlist") {
        const discount = friendlistDiscount ?? 0
        return entryFee * (1 - discount / 100)
      }
      return entryFee
    }

    const approvedList   = apps.filter((a: any) => a.status === "approved")
    const checkedInList  = apps.filter((a: any) => a.checked_in)

    // Per-tier counts & revenue
    const tierRevenue = (list: any[]) => {
      let guestCount = 0, guestRev = 0
      let friendlistCount = 0, friendlistRev = 0
      let crewCount = 0
      let unknownCount = 0, unknownRev = 0

      list.forEach((a: any) => {
        const tier = a.invitation_code_id ? (codeToTier[a.invitation_code_id] || "guest") : "guest"
        const price = calcGuestPrice(a)
        if (tier === "crew") { crewCount++ }
        else if (tier === "friendlist") { friendlistCount++; friendlistRev += price }
        else if (a.invitation_code_id) { guestCount++; guestRev += price }
        else { unknownCount++; unknownRev += price }
      })

      return { guestCount, guestRev, friendlistCount, friendlistRev, crewCount, unknownCount, unknownRev,
        total: guestRev + friendlistRev + unknownRev }
    }

    const approvedRevenue  = tierRevenue(approvedList)
    const checkedInRevenue = tierRevenue(checkedInList)

    const incomeStats = {
      entryFee,
      friendlistDiscount,
      projectedApproved:   Math.round(approvedRevenue.total * 100) / 100,
      projectedCheckedIn:  Math.round(checkedInRevenue.total * 100) / 100,
      breakdown: {
        approved:  approvedRevenue,
        checkedIn: checkedInRevenue,
      }
    }

    // ── Per-admin stats ───────────────────────────────────────────────────────
    const adminMap: Record<string, {
      adminId: string; username: string; codesCreated: number
      totalCapacity: number; totalUsed: number; approvedGuests: number; checkedInGuests: number
    }> = {}

    for (const code of codes) {
      const adminId  = code.created_by_admin_id || "unknown"
      const username = (code.admins as any)?.username || "Unknown"
      if (!adminMap[adminId]) {
        adminMap[adminId] = { adminId, username, codesCreated: 0, totalCapacity: 0, totalUsed: 0, approvedGuests: 0, checkedInGuests: 0 }
      }
      adminMap[adminId].codesCreated++
      adminMap[adminId].totalCapacity += code.max_uses
      adminMap[adminId].totalUsed     += code.current_uses + (code.declined_at != null ? 1 : 0)

      const linkedApps = apps.filter((a: any) => a.invitation_code_id === code.id)
      adminMap[adminId].approvedGuests  += linkedApps.filter((a: any) => a.status === "approved").length
      adminMap[adminId].checkedInGuests += linkedApps.filter((a: any) => a.checked_in).length
    }

    const inviteCodesByAdmin = Object.values(adminMap).map((a) => ({
      ...a,
      usageRate: a.totalCapacity > 0 ? Math.round((a.totalUsed / a.totalCapacity) * 100) : 0,
      showRate:  a.approvedGuests > 0 ? Math.round((a.checkedInGuests / a.approvedGuests) * 100) : 0,
    }))

    // ── Individual code details ───────────────────────────────────────────────
    const inviteCodeDetails = codes.map((c: any) => ({
      id:          c.id,
      code:        c.code_hash,
      tier:        c.tier || c.invite_type || "—",
      comment:     c.comment || null,
      createdBy:   (c.admins as any)?.username || "Unknown",
      maxUses:     c.max_uses,
      currentUses: c.current_uses + (c.declined_at != null ? 1 : 0),
      usageRate:   c.max_uses > 0 ? Math.round(((c.current_uses + (c.declined_at != null ? 1 : 0)) / c.max_uses) * 100) : 0,
      status:      c.revoked_at ? "revoked" : c.declined_at ? "declined" : c.redeemed ? "fully used" : c.current_uses >= c.max_uses ? "exhausted" : "active",
      createdAt:   c.created_at,
    }))

    // ── Applications by day ───────────────────────────────────────────────────
    const applicationsByDay: Record<string, number> = {}
    apps.forEach((a: any) => {
      const day = new Date(a.created_at).toLocaleDateString()
      applicationsByDay[day] = (applicationsByDay[day] || 0) + 1
    })

    return NextResponse.json({
      event,
      statistics: {
        total, approved, rejected, waitlist, pending, cancelled, checkedIn, noShows,
        approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
        showRate:     approved > 0 ? Math.round((checkedIn / approved) * 100) : 0,
      },
      genderStats: {
        all: {
          male, female, diverse,
          malePercent:    total > 0 ? Math.round((male / total) * 100) : 0,
          femalePercent:  total > 0 ? Math.round((female / total) * 100) : 0,
          diversePercent: total > 0 ? Math.round((diverse / total) * 100) : 0,
          averageAge: avgAge, minAge, maxAge,
        },
        approved: {
          male: maleApproved, female: femaleApproved, diverse: diverseApproved,
          total: approvedApps.length,
          malePercent:    approvedApps.length > 0 ? Math.round((maleApproved / approvedApps.length) * 100) : 0,
          femalePercent:  approvedApps.length > 0 ? Math.round((femaleApproved / approvedApps.length) * 100) : 0,
          diversePercent: approvedApps.length > 0 ? Math.round((diverseApproved / approvedApps.length) * 100) : 0,
          averageAge: avgAgeApproved, minAge: minAgeApproved, maxAge: maxAgeApproved,
        },
      },
      ageDistribution,
      heardAboutUs,
      incomeStats,
      inviteStats: {
        totalCodes: totalInviteCodes,
        totalGenerated: totalInvitesGenerated,
        totalUsed: totalInvitesUsed,
        totalDeclined,
        usageRate: totalInvitesGenerated > 0 ? Math.round((totalInvitesUsed / totalInvitesGenerated) * 100) : 0,
      },
      inviteCodesByAdmin,
      inviteCodeDetails,
      applicationsByDay,
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
