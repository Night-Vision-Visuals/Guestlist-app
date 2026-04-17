"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useEventContext } from "@/lib/EventContext"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts"

// ─── Types ────────────────────────────────────────────────────────────────────

interface GenderSlice {
  male: number
  female: number
  diverse: number
  total?: number
  malePercent: number
  femalePercent: number
  diversePercent: number
  averageAge: number
  minAge: number
  maxAge: number
}

interface AgeBucket {
  label: string
  count: number
  countApproved: number
  countMale: number
  countFemale: number
  countDiverse: number
}

interface AdminCodeStat {
  adminId: string
  username: string
  codesCreated: number
  totalCapacity: number
  totalUsed: number
  usageRate: number
  approvedGuests: number
  checkedInGuests: number
  showRate: number
}

interface CodeDetail {
  id: string
  code: string
  tier: string
  comment: string | null
  createdBy: string
  maxUses: number
  currentUses: number
  usageRate: number
  status: string
  createdAt: string
}

interface TierRevenue {
  guestCount: number
  guestRev: number
  friendlistCount: number
  friendlistRev: number
  crewCount: number
  unknownCount: number
  unknownRev: number
  total: number
}

interface IncomeStats {
  entryFee: number | null
  friendlistDiscount: number | null
  projectedApproved: number
  projectedCheckedIn: number
  breakdown: {
    approved: TierRevenue
    checkedIn: TierRevenue
  }
}

interface Analytics {
  event: { id: string; name: string }
  statistics: {
    total: number
    approved: number
    rejected: number
    waitlist: number
    pending: number
    cancelled: number
    checkedIn: number
    noShows: number
    approvalRate: number
    showRate: number
  }
  genderStats: {
    all: GenderSlice
    approved: GenderSlice
  }
  ageDistribution: AgeBucket[]
  heardAboutUs: Record<string, number>
  incomeStats: IncomeStats
  inviteStats: {
    totalCodes: number
    totalGenerated: number
    totalUsed: number
    totalDeclined: number
    usageRate: number
  }
  inviteCodesByAdmin: AdminCodeStat[]
  inviteCodeDetails: CodeDetail[]
  applicationsByDay: Record<string, number>
}

// ─── Small reusable card ──────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = "text-white" }: {
  label: string
  value: React.ReactNode
  sub?: string
  color?: string
}) {
  return (
    <div className="border border-neutral-800 p-6 hover:border-neutral-700 transition-all duration-300">
      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">{label}</p>
      <p className={`text-4xl font-light mb-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-neutral-600">{sub}</p>}
    </div>
  )
}

type AgeGenderFilter = "all" | "male" | "female" | "diverse"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter()
  const { currentEvent, isLoading: eventsLoading } = useEventContext()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [demoFilter, setDemoFilter] = useState<"all" | "approved">("all")
  const [ageGenderFilter, setAgeGenderFilter] = useState<AgeGenderFilter>("all")
  const [showCodeBreakdown, setShowCodeBreakdown] = useState(false)

  useEffect(() => {
    if (currentEvent) fetchAnalytics(currentEvent.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEvent])

  const fetchAnalytics = async (eventId: string) => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/analytics?eventId=${eventId}`, { credentials: "include" })
      if (res.status === 401) { router.push("/admin"); return }
      if (!res.ok) throw new Error("Failed to fetch analytics")
      const data = await res.json()
      setAnalytics(data)
      setError("")
    } catch (err) {
      console.error(err)
      setError("Error fetching analytics")
    } finally {
      setIsLoading(false)
    }
  }

  if (eventsLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <p className="text-lg tracking-[0.2em] uppercase text-neutral-400">Loading analytics</p>
        </div>
      </div>
    )
  }

  // ── Derived chart data ────────────────────────────────────────────────────

  const timelineData = analytics
    ? Object.entries(analytics.applicationsByDay)
        .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
        .map(([day, count]) => ({ day, count }))
    : []

  // Age chart: pick the right count field based on gender filter
  const ageCountKey: Record<AgeGenderFilter, keyof AgeBucket> = {
    all:     "count",
    male:    "countMale",
    female:  "countFemale",
    diverse: "countDiverse",
  }
  const ageChartData = (analytics?.ageDistribution || []).map((b) => ({
    label:    b.label,
    Guests:   b[ageCountKey[ageGenderFilter]] as number,
    Approved: ageGenderFilter === "all" ? b.countApproved : undefined,
  }))

  const gender = analytics
    ? (demoFilter === "approved" ? analytics.genderStats.approved : analytics.genderStats.all)
    : null

  const genderTotal = demoFilter === "approved"
    ? (analytics?.genderStats.approved.total ?? analytics?.statistics.approved ?? 0)
    : (analytics?.statistics.total ?? 0)

  const statusCodeColor: Record<string, string> = {
    active:       "text-emerald-400",
    exhausted:    "text-orange-400",
    "fully used": "text-yellow-400",
    revoked:      "text-red-400",
    declined:     "text-purple-400",
  }

  const fmt = (n: number) =>
    n.toLocaleString("de-AT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
      </div>

      <div className="relative z-10">
        <div className="px-6 md:px-16 py-12">

          {/* Header */}
          <div className="mb-12 space-y-4">
            <h1 className="text-5xl md:text-6xl font-light tracking-tight">
              <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                Analytics
              </span>
            </h1>
            <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
              {currentEvent?.name}{currentEvent?.date
                ? ` — ${new Date(currentEvent.date.slice(0, 10) + "T12:00:00").toLocaleDateString()}`
                : ""}
            </p>
            <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
          </div>

          {error && (
            <div className="mb-8 text-sm tracking-[0.15em] py-3 px-4 border border-red-400/30 text-red-400 bg-red-400/5">
              {error}
            </div>
          )}

          {analytics && (
            <div className="space-y-10">

              {/* ── Application Statistics ───────────────────────────────── */}
              <section>
                <h2 className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-6">Application Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <StatCard label="Total"      value={analytics.statistics.total} />
                  <StatCard label="Approved"   value={analytics.statistics.approved}  color="text-emerald-400" sub={`${analytics.statistics.approvalRate}% rate`} />
                  <StatCard label="Rejected"   value={analytics.statistics.rejected}  color="text-red-400" />
                  <StatCard label="Waitlist"   value={analytics.statistics.waitlist}  color="text-yellow-400" />
                  <StatCard label="Pending"    value={analytics.statistics.pending}   color="text-neutral-400" />
                  <StatCard label="Cancelled"  value={analytics.statistics.cancelled} color="text-neutral-500" />
                  <StatCard label="Checked In" value={analytics.statistics.checkedIn} color="text-cyan-400" sub={`of ${analytics.statistics.approved} approved`} />
                </div>
              </section>

              {/* ── Show / No-show ───────────────────────────────────────── */}
              <section>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <StatCard label="Show Rate"  value={`${analytics.statistics.showRate}%`} color="text-emerald-400" sub="checked in / approved" />
                  <StatCard label="No-Shows"   value={analytics.statistics.noShows}        color="text-red-400"     sub="approved but didn't check in" />
                  <div className="border border-neutral-800 p-6">
                    <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">Approval Rate</p>
                    <div className="flex items-center gap-4 mt-4">
                      <div className="flex-1 h-2 bg-neutral-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-500"
                          style={{ width: `${analytics.statistics.approvalRate}%` }}
                        />
                      </div>
                      <span className="text-2xl font-light text-emerald-400">{analytics.statistics.approvalRate}%</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── Income ──────────────────────────────────────────────── */}
              <section>
                <h2 className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-6">Income</h2>
                {analytics.incomeStats.entryFee === null ? (
                  <div className="border border-neutral-800 p-6">
                    <p className="text-sm text-neutral-500 tracking-[0.1em]">
                      No entry fee configured for this event. Set one in the Events page to enable income tracking.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="border border-neutral-800 p-6">
                        <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">Projected (Approved)</p>
                        <p className="text-4xl font-light text-emerald-400">€{fmt(analytics.incomeStats.projectedApproved)}</p>
                        <p className="text-xs text-neutral-600 mt-1">
                          {analytics.statistics.approved} approved guests · €{analytics.incomeStats.entryFee} base fee
                          {analytics.incomeStats.friendlistDiscount != null
                            ? ` · friendlist ${analytics.incomeStats.friendlistDiscount}% off`
                            : ""}
                        </p>
                      </div>
                      <div className="border border-neutral-800 p-6">
                        <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">Actual (Checked In)</p>
                        <p className="text-4xl font-light text-cyan-400">€{fmt(analytics.incomeStats.projectedCheckedIn)}</p>
                        <p className="text-xs text-neutral-600 mt-1">
                          {analytics.statistics.checkedIn} guests checked in
                        </p>
                      </div>
                    </div>

                    {/* Breakdown table */}
                    <div className="border border-neutral-800 p-6">
                      <h3 className="text-xs tracking-[0.3em] uppercase text-neutral-600 mb-4">Breakdown by Tier</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-neutral-800">
                              {["Tier", "Approved", "Revenue (proj.)", "Checked In", "Revenue (actual)"].map(h => (
                                <th key={h} className="text-left text-[10px] tracking-[0.2em] uppercase text-neutral-600 pb-3 pr-6 last:pr-0">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              {
                                label: "Guest (code)",
                                approvedCount: analytics.incomeStats.breakdown.approved.guestCount,
                                approvedRev:   analytics.incomeStats.breakdown.approved.guestRev,
                                ciCount:       analytics.incomeStats.breakdown.checkedIn.guestCount,
                                ciRev:         analytics.incomeStats.breakdown.checkedIn.guestRev,
                              },
                              {
                                label: "Friendlist",
                                approvedCount: analytics.incomeStats.breakdown.approved.friendlistCount,
                                approvedRev:   analytics.incomeStats.breakdown.approved.friendlistRev,
                                ciCount:       analytics.incomeStats.breakdown.checkedIn.friendlistCount,
                                ciRev:         analytics.incomeStats.breakdown.checkedIn.friendlistRev,
                              },
                              {
                                label: "Crew (free)",
                                approvedCount: analytics.incomeStats.breakdown.approved.crewCount,
                                approvedRev:   0,
                                ciCount:       analytics.incomeStats.breakdown.checkedIn.crewCount,
                                ciRev:         0,
                              },
                              {
                                label: "Direct (no code)",
                                approvedCount: analytics.incomeStats.breakdown.approved.unknownCount,
                                approvedRev:   analytics.incomeStats.breakdown.approved.unknownRev,
                                ciCount:       analytics.incomeStats.breakdown.checkedIn.unknownCount,
                                ciRev:         analytics.incomeStats.breakdown.checkedIn.unknownRev,
                              },
                            ].map(row => (
                              <tr key={row.label} className="border-b border-neutral-900">
                                <td className="py-3 pr-6 text-neutral-300 font-light">{row.label}</td>
                                <td className="py-3 pr-6 text-neutral-400">{row.approvedCount}</td>
                                <td className="py-3 pr-6 text-emerald-400 font-mono">€{fmt(row.approvedRev)}</td>
                                <td className="py-3 pr-6 text-neutral-400">{row.ciCount}</td>
                                <td className="py-3 text-cyan-400 font-mono">€{fmt(row.ciRev)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </section>

              {/* ── Applications Over Time ───────────────────────────────── */}
              <section className="border border-neutral-800 p-8">
                <h3 className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-6">Applications Over Time</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={timelineData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="day" tick={{ fill: "#737373", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#737373", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: "#0a0a0a", border: "1px solid #262626", borderRadius: 4 }}
                      labelStyle={{ color: "#a3a3a3", fontSize: 11 }}
                      itemStyle={{ color: "#60a5fa" }}
                    />
                    <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </section>

              {/* ── Demographics ─────────────────────────────────────────── */}
              <section className="border border-neutral-800 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs tracking-[0.3em] uppercase text-neutral-500">Demographics</h3>
                  <div className="flex gap-2">
                    {(["all", "approved"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setDemoFilter(f)}
                        className={`px-3 py-1 text-[10px] tracking-[0.2em] uppercase border transition-all duration-200 ${
                          demoFilter === f
                            ? "border-white text-white"
                            : "border-neutral-700 text-neutral-500 hover:border-neutral-500"
                        }`}
                      >
                        {f === "all" ? "All Guests" : "Approved Only"}
                      </button>
                    ))}
                  </div>
                </div>

                {gender && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <h4 className="text-xs tracking-[0.15em] uppercase text-neutral-600 mb-3">Gender</h4>
                      {[
                        { label: "Male",    count: gender.male,    pct: gender.malePercent,    color: "bg-blue-600" },
                        { label: "Female",  count: gender.female,  pct: gender.femalePercent,  color: "bg-pink-600" },
                        { label: "Diverse", count: gender.diverse, pct: gender.diversePercent, color: "bg-purple-600" },
                      ].map(({ label, count, pct, color }) => (
                        <div key={label} className="flex items-center gap-4">
                          <p className="text-sm text-neutral-400 w-16">{label}</p>
                          <div className="flex-1 h-2 bg-neutral-900">
                            <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-xs text-neutral-400 w-20 text-right">{count} ({pct}%)</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col justify-center gap-4">
                      <h4 className="text-xs tracking-[0.15em] uppercase text-neutral-600">Age</h4>
                      <div className="flex gap-8">
                        <div>
                          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Average</p>
                          <p className="text-5xl font-light text-white">{gender.averageAge}</p>
                        </div>
                        <div className="flex flex-col justify-end gap-2">
                          <div>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Min</p>
                            <p className="text-xl font-light text-neutral-300">{gender.minAge || "—"}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">Max</p>
                            <p className="text-xl font-light text-neutral-300">{gender.maxAge || "—"}</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-neutral-600">
                        {demoFilter === "all"
                          ? `Based on ${genderTotal} total guests`
                          : `Based on ${genderTotal} approved guests`}
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* ── Age Distribution ─────────────────────────────────────── */}
              <section className="border border-neutral-800 p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs tracking-[0.3em] uppercase text-neutral-500">Age Distribution</h3>
                  <div className="flex gap-2">
                    {(["all", "male", "female", "diverse"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setAgeGenderFilter(f)}
                        className={`px-3 py-1 text-[10px] tracking-[0.2em] uppercase border transition-all duration-200 ${
                          ageGenderFilter === f
                            ? "border-white text-white"
                            : "border-neutral-700 text-neutral-500 hover:border-neutral-500"
                        }`}
                      >
                        {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ageChartData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="label" tick={{ fill: "#737373", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#737373", fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "#0a0a0a", border: "1px solid #262626", borderRadius: 4 }}
                      labelStyle={{ color: "#a3a3a3", fontSize: 11 }}
                    />
                    <Bar dataKey="Guests" fill={
                      ageGenderFilter === "male" ? "#3b82f6"
                      : ageGenderFilter === "female" ? "#ec4899"
                      : ageGenderFilter === "diverse" ? "#a855f7"
                      : "#404040"
                    } />
                    {ageGenderFilter === "all" && (
                      <Bar dataKey="Approved" fill="#10b981" />
                    )}
                  </BarChart>
                </ResponsiveContainer>
                {ageGenderFilter === "all" && (
                  <p className="text-[10px] text-neutral-700 mt-2">Grey = all applications · Green = approved</p>
                )}
              </section>

              {/* ── Heard About Us ───────────────────────────────────────── */}
              {Object.keys(analytics.heardAboutUs).length > 0 && (
                <section className="border border-neutral-800 p-8">
                  <h3 className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-6">How Did They Hear About Us</h3>
                  <div className="space-y-3">
                    {Object.entries(analytics.heardAboutUs)
                      .sort((a, b) => b[1] - a[1])
                      .map(([source, count]) => (
                        <div key={source} className="flex items-center gap-4">
                          <p className="text-sm text-neutral-400 min-w-[140px] capitalize">{source.replace(/_/g, " ")}</p>
                          <div className="flex-1 h-2 bg-neutral-900">
                            <div
                              className="h-full bg-cyan-700"
                              style={{ width: `${(count / analytics.statistics.total) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-neutral-400 min-w-[64px] text-right">
                            {count} ({Math.round((count / analytics.statistics.total) * 100)}%)
                          </p>
                        </div>
                      ))}
                  </div>
                </section>
              )}

              {/* ── Invite Code Statistics ───────────────────────────────── */}
              <section>
                <h2 className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-6">Invite Code Statistics</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
                  <StatCard label="Total Codes" value={analytics.inviteStats.totalCodes} />
                  <StatCard label="Generated"   value={analytics.inviteStats.totalGenerated} color="text-blue-400" />
                  <StatCard label="Used"        value={analytics.inviteStats.totalUsed}      color="text-emerald-400" />
                  <StatCard label="Declined"    value={analytics.inviteStats.totalDeclined}  color="text-purple-400" sub="guest declined event" />
                  <StatCard label="Usage Rate"  value={`${analytics.inviteStats.usageRate}%`} color="text-yellow-400" />
                </div>

                {/* Per-admin stats */}
                {analytics.inviteCodesByAdmin.length > 0 && (
                  <div className="border border-neutral-800 p-6 mb-4">
                    <h3 className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">By Admin</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-neutral-800">
                            {["Admin","Codes","Capacity","Used","Usage%","Approved","Checked In","Show%"].map(h => (
                              <th key={h} className="text-left text-[10px] tracking-[0.2em] uppercase text-neutral-600 pb-3 pr-4 last:pr-0">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.inviteCodesByAdmin.map((a) => (
                            <tr key={a.adminId} className="border-b border-neutral-900">
                              <td className="py-3 pr-4 text-white font-light">{a.username}</td>
                              <td className="py-3 pr-4 text-neutral-400">{a.codesCreated}</td>
                              <td className="py-3 pr-4 text-neutral-400">{a.totalCapacity}</td>
                              <td className="py-3 pr-4 text-neutral-400">{a.totalUsed}</td>
                              <td className="py-3 pr-4 text-neutral-400">{a.usageRate}%</td>
                              <td className="py-3 pr-4 text-emerald-400">{a.approvedGuests}</td>
                              <td className="py-3 pr-4 text-cyan-400">{a.checkedInGuests}</td>
                              <td className="py-3 text-neutral-400">{a.showRate}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Collapsible code breakdown */}
                {analytics.inviteCodeDetails.length > 0 && (
                  <div className="border border-neutral-800">
                    <button
                      onClick={() => setShowCodeBreakdown(!showCodeBreakdown)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-neutral-900/40 transition-colors"
                    >
                      <span className="text-xs tracking-[0.3em] uppercase text-neutral-500">
                        Individual Code Breakdown ({analytics.inviteCodeDetails.length} codes)
                      </span>
                      <span className="text-neutral-600 text-xs">{showCodeBreakdown ? "▲ Hide" : "▼ Show"}</span>
                    </button>
                    {showCodeBreakdown && (
                      <div className="overflow-x-auto border-t border-neutral-800">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-neutral-800 bg-neutral-950">
                              {["Code","Tier","Note","Created By","Max","Used","Rate%","Status"].map(h => (
                                <th key={h} className="text-left tracking-[0.15em] uppercase text-neutral-600 px-4 py-3">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.inviteCodeDetails.map((c) => (
                              <tr key={c.id} className="border-b border-neutral-900 hover:bg-neutral-900/30">
                                <td className="px-4 py-3 font-mono text-white tracking-wider">{c.code}</td>
                                <td className="px-4 py-3 text-neutral-400 capitalize">{c.tier}</td>
                                <td className="px-4 py-3 text-neutral-500 max-w-[140px] truncate">{c.comment || "—"}</td>
                                <td className="px-4 py-3 text-neutral-400">{c.createdBy}</td>
                                <td className="px-4 py-3 text-neutral-400">{c.maxUses}</td>
                                <td className="px-4 py-3 text-neutral-400">{c.currentUses}</td>
                                <td className="px-4 py-3 text-neutral-400">{c.usageRate}%</td>
                                <td className={`px-4 py-3 capitalize ${statusCodeColor[c.status] || "text-neutral-400"}`}>
                                  {c.status}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </section>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 md:px-16 py-12 border-t border-neutral-800 mt-12">
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">Analytics Dashboard</div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">© 2026</div>
        </div>
      </div>
    </div>
  )
}
