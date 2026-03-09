"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useEventContext } from "@/lib/EventContext"

interface Analytics {
  event: {
    id: string
    name: string
    date: string
    location: string
  }
  statistics: {
    total: number
    approved: number
    rejected: number
    waitlist: number
    pending: number
    approvalRate: number
  }
  inviteStats: {
    totalCodes: number
    totalGenerated: number
    totalUsed: number
    usageRate: number
  }
  applicationsByDay: { [key: string]: number }
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { currentEvent, isLoading: eventsLoading } = useEventContext()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (currentEvent) {
      fetchAnalytics(currentEvent.id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEvent])

  const fetchAnalytics = async (eventId: string) => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/analytics?eventId=${eventId}`, {
        credentials: "include"
      })

      if (res.status === 401) {
        router.push("/admin")
        return
      }

      if (!res.ok) {
        throw new Error("Failed to fetch analytics")
      }

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
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <p className="text-lg tracking-[0.2em] uppercase text-neutral-400">
            Loading analytics
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Main Content */}
        <div className="px-6 md:px-16 py-12">
          {/* Header */}
          <div className="mb-12 space-y-4">
            <h1 className="text-5xl md:text-6xl font-light tracking-tight">
              <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                Analytics
              </span>
            </h1>
            <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
              {currentEvent?.name} - {new Date(currentEvent?.date || "").toLocaleDateString()}
            </p>
            <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 text-sm tracking-[0.15em] py-3 px-4 border border-red-400/30 text-red-400 bg-red-400/5">
              {error}
            </div>
          )}

          {analytics && (
            <div className="space-y-8">
              {/* Application Statistics */}
              <div>
                <h2 className="text-2xl font-light mb-6">Application Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {/* Total Applications */}
                  <div className="border border-neutral-800 p-6 rounded-lg hover:border-neutral-700 transition-all duration-300">
                    <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">
                      Total Applications
                    </p>
                    <p className="text-4xl font-light text-white mb-2">
                      {analytics.statistics.total}
                    </p>
                    <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 w-full" />
                    </div>
                  </div>

                  {/* Approved */}
                  <div className="border border-neutral-800 p-6 rounded-lg hover:border-neutral-700 transition-all duration-300">
                    <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">
                      Approved
                    </p>
                    <p className="text-4xl font-light text-emerald-400 mb-2">
                      {analytics.statistics.approved}
                    </p>
                    <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-600"
                        style={{ width: `${(analytics.statistics.approved / analytics.statistics.total) * 100 || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Rejected */}
                  <div className="border border-neutral-800 p-6 rounded-lg hover:border-neutral-700 transition-all duration-300">
                    <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">
                      Rejected
                    </p>
                    <p className="text-4xl font-light text-red-400 mb-2">
                      {analytics.statistics.rejected}
                    </p>
                    <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-600"
                        style={{ width: `${(analytics.statistics.rejected / analytics.statistics.total) * 100 || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Waitlist */}
                  <div className="border border-neutral-800 p-6 rounded-lg hover:border-neutral-700 transition-all duration-300">
                    <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">
                      Waitlist
                    </p>
                    <p className="text-4xl font-light text-yellow-400 mb-2">
                      {analytics.statistics.waitlist}
                    </p>
                    <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-600"
                        style={{ width: `${(analytics.statistics.waitlist / analytics.statistics.total) * 100 || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Pending */}
                  <div className="border border-neutral-800 p-6 rounded-lg hover:border-neutral-700 transition-all duration-300">
                    <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">
                      Pending
                    </p>
                    <p className="text-4xl font-light text-neutral-400 mb-2">
                      {analytics.statistics.pending}
                    </p>
                    <div className="h-1 bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-neutral-600"
                        style={{ width: `${(analytics.statistics.pending / analytics.statistics.total) * 100 || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Approval Rate */}
              <div className="border border-neutral-800 p-8 rounded-lg">
                <h3 className="text-xl font-light mb-6">Approval Rate</h3>
                <div className="flex items-center gap-6">
                  <div className="flex-1">
                    <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                        style={{ width: `${analytics.statistics.approvalRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-4xl font-light text-emerald-400">
                      {analytics.statistics.approvalRate}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Invitation Code Statistics */}
              <div>
                <h2 className="text-2xl font-light mb-6">Invitation Code Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Total Codes */}
                  <div className="border border-neutral-800 p-6 rounded-lg hover:border-neutral-700 transition-all duration-300">
                    <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">
                      Total Codes
                    </p>
                    <p className="text-4xl font-light text-white">
                      {analytics.inviteStats.totalCodes}
                    </p>
                  </div>

                  {/* Total Generated */}
                  <div className="border border-neutral-800 p-6 rounded-lg hover:border-neutral-700 transition-all duration-300">
                    <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">
                      Total Generated
                    </p>
                    <p className="text-4xl font-light text-blue-400">
                      {analytics.inviteStats.totalGenerated}
                    </p>
                  </div>

                  {/* Total Used */}
                  <div className="border border-neutral-800 p-6 rounded-lg hover:border-neutral-700 transition-all duration-300">
                    <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">
                      Total Used
                    </p>
                    <p className="text-4xl font-light text-emerald-400">
                      {analytics.inviteStats.totalUsed}
                    </p>
                  </div>

                  {/* Usage Rate */}
                  <div className="border border-neutral-800 p-6 rounded-lg hover:border-neutral-700 transition-all duration-300">
                    <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">
                      Usage Rate
                    </p>
                    <p className="text-4xl font-light text-yellow-400">
                      {analytics.inviteStats.usageRate}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Applications by Day Chart */}
              <div className="border border-neutral-800 p-8 rounded-lg">
                <h3 className="text-xl font-light mb-6">Applications Over Time</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.applicationsByDay)
                    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
                    .map(([day, count]) => (
                      <div key={day} className="flex items-center gap-4">
                        <p className="text-sm text-neutral-400 min-w-[120px]">{day}</p>
                        <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
                            style={{ 
                              width: `${(count / Math.max(...Object.values(analytics.applicationsByDay))) * 100}%` 
                            }}
                          />
                        </div>
                        <p className="text-sm text-white min-w-[40px] text-right">{count}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 md:px-16 py-12 border-t border-neutral-800 mt-12">
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">
            Analytics Dashboard
          </div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">
            © 2026
          </div>
        </div>
      </div>
    </div>
  )
}