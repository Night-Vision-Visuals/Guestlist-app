"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useEventContext } from "@/lib/EventContext"

interface Admin {
  id: string
  username: string
}

interface Invitation {
  id: string
  code_hash: string
  max_uses: number
  current_uses: number
  redeemed: boolean
  revoked_at: string | null
  declined_at: string | null
  created_at: string
  created_by_admin_id: string
  event_id: string | null
  invite_type: string | null
  tier: string | null
  comment: string | null
  is_staff_plus_one: boolean | null
  admins: Admin | null
}

interface AdminSummary {
  adminId: string
  username: string
  codesCreated: number
  totalCapacity: number
  totalUsed: number
}

interface QuotaInfo {
  total_used: number
  total_limit: number | null
  quotas: {
    admin_id: string
    username: string
    friendlist_quota: number | null
    codes_used: number
    codes_remaining: number | null
  }[]
  myQuota: number | null
  myUsed: number
}

const TIER_LABELS: Record<string, string> = {
  guest: "Guest",
  friendlist: "Friendlist",
  staff: "Staff",
  crew: "Staff", // legacy alias
}

const TIER_COLORS: Record<string, string> = {
  guest: "text-cyan-400 border-cyan-400/30 bg-cyan-400/5",
  friendlist: "text-purple-400 border-purple-400/30 bg-purple-400/5",
  staff: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
  crew: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5", // legacy alias
}

function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
  }
  return new Promise((resolve, reject) => {
    const ta = document.createElement("textarea")
    ta.value = text
    ta.style.position = "fixed"
    ta.style.opacity = "0"
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand("copy")
    document.body.removeChild(ta)
    ok ? resolve() : reject(new Error("execCommand copy failed"))
  })
}

export default function InvitesPage() {
  const router = useRouter()
  const { currentEvent, isLoading: eventsLoading } = useEventContext()
  const [invites, setInvites] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [generatedCode, setGeneratedCode] = useState<string | null>(null)
  const [generatedTier, setGeneratedTier] = useState<string>("guest")
  const [copied, setCopied] = useState(false)
  const [quotaInfo, setQuotaInfo] = useState<QuotaInfo | null>(null)
  const [formData, setFormData] = useState({
    tier: "guest" as "guest" | "friendlist" | "staff",
    max_uses: 1,
    comment: "",
  })

  useEffect(() => {
    if (currentEvent) {
      fetchInvites(currentEvent.id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEvent])

  // Auto-lock max_uses to 1 when tier changes to friendlist/staff
  useEffect(() => {
    if (formData.tier === "friendlist" || formData.tier === "staff") {
      setFormData(prev => ({ ...prev, max_uses: 1 }))
    }
  }, [formData.tier])

  const fetchInvites = async (eventId?: string) => {
    try {
      setIsLoading(true)
      const url = eventId ? `/api/invite/list?eventId=${eventId}` : "/api/invite/list"
      const res = await fetch(url, { credentials: "include" })

      if (res.status === 401) {
        router.push("/admin")
        return
      }

      if (!res.ok) throw new Error("Failed to fetch invites")

      const data = await res.json()
      setInvites(data || [])
      setError("")

      // Fetch quota info for this event
      if (eventId) {
        const meRes = await fetch("/api/me", { credentials: "include" })
        const meData = meRes.ok ? await meRes.json() : null
        const myAdminId = meData?.adminId || null

        const qRes = await fetch(`/api/events/admin-quotas?eventId=${eventId}`, { credentials: "include" })
        if (qRes.ok) {
          const qData = await qRes.json()
          const myEntry = myAdminId ? (qData.quotas || []).find((q: { admin_id: string }) => q.admin_id === myAdminId) : null
          setQuotaInfo({
            total_used: qData.total_used ?? 0,
            total_limit: qData.total_limit ?? null,
            quotas: qData.quotas || [],
            myQuota: myEntry?.friendlist_quota ?? null,
            myUsed: myEntry?.codes_used ?? 0,
          })
        }
      } else {
        setQuotaInfo(null)
      }
    } catch (err) {
      console.error(err)
      setError("Error fetching invitations")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateInvite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsCreating(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/invite/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier: formData.tier,
          max_uses: formData.max_uses,
          comment: formData.comment || null,
          event_id: currentEvent?.id || null,
        }),
        credentials: "include",
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create invitation")

      setGeneratedCode(data.code)
      setGeneratedTier(formData.tier)
      setFormData({ tier: "guest", max_uses: 1, comment: "" })
      setShowCreateForm(false)

      copyToClipboard(data.code).then(() => setCopied(true)).catch(() => {})
      fetchInvites(currentEvent?.id)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to create invitation")
    } finally {
      setIsCreating(false)
    }
  }

  const handleCopyCode = () => {
    if (generatedCode) {
      copyToClipboard(generatedCode).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }).catch(() => {})
    }
  }

  const handleRevokeInvite = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this invitation code?")) return

    try {
      const res = await fetch("/api/invite/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "include",
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to revoke invitation")

      setSuccess("Invitation code revoked")
      setError("")
      fetchInvites(currentEvent?.id)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Error revoking invitation")
    }
  }

  const handleDeleteInvite = async (id: string) => {
    try {
      const res = await fetch("/api/invite/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "include",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete invitation")
      setSuccess("Invitation code deleted")
      setError("")
      fetchInvites(currentEvent?.id)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Error deleting invitation")
    }
  }

  const getStatusColor = (invite: Invitation) => {
    if (invite.revoked_at) return "text-red-400"
    if (invite.declined_at) return "text-purple-400"
    if (invite.redeemed) return "text-yellow-400"
    if (invite.current_uses >= invite.max_uses) return "text-orange-400"
    return "text-emerald-400"
  }

  const getStatusText = (invite: Invitation) => {
    if (invite.revoked_at) return "Revoked"
    if (invite.declined_at) return "Declined"
    if (invite.redeemed) return "Fully Used"
    if (invite.current_uses >= invite.max_uses) return "Exhausted"
    return "Active"
  }

  // Compute per-admin summary from invite list
  const adminSummary = (() => {
    const map: Record<string, AdminSummary> = {}
    invites.forEach((inv) => {
      const id = inv.created_by_admin_id || "unknown"
      const username = inv.admins?.username || "Unknown"
      if (!map[id]) map[id] = { adminId: id, username, codesCreated: 0, totalCapacity: 0, totalUsed: 0 }
      map[id].codesCreated++
      map[id].totalCapacity += inv.max_uses
      map[id].totalUsed += inv.current_uses
    })
    return Object.values(map).sort((a, b) => b.codesCreated - a.codesCreated)
  })()

  if (eventsLoading || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
        </div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <p className="text-lg tracking-[0.2em] uppercase text-neutral-400">Loading invitations</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
      </div>

      {/* Generated Code Modal */}
      {generatedCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setGeneratedCode(null)} />
          <div className="relative z-10 flex flex-col items-center gap-8 px-12 py-12 border border-neutral-700 bg-neutral-900/90 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <div className="space-y-2 text-center">
              <p className="text-[10px] tracking-[0.4em] uppercase text-neutral-500 font-light">
                Invitation Code Created
              </p>
              {generatedTier && (
                <span className={`inline-block text-[10px] px-2 py-0.5 border rounded tracking-[0.15em] uppercase ${TIER_COLORS[generatedTier] || "text-neutral-400 border-neutral-600"}`}>
                  {TIER_LABELS[generatedTier] || generatedTier}
                </span>
              )}
              <div className="h-px w-16 mx-auto bg-gradient-to-r from-transparent via-white/30 to-transparent" />
            </div>

            <button
              onClick={handleCopyCode}
              title="Click to copy"
              className="group relative flex flex-col items-center gap-3 cursor-pointer select-none"
            >
              <div className="border border-neutral-700 group-hover:border-white/50 bg-black/60 group-hover:bg-neutral-800/60 transition-all duration-300 px-10 py-6 rounded-xl">
                <p className="text-5xl font-mono font-light tracking-[0.3em] text-white">
                  {generatedCode}
                </p>
              </div>
              <span className="text-[10px] tracking-[0.3em] uppercase text-neutral-500 group-hover:text-neutral-300 transition-colors duration-300">
                {copied ? "✓ Copied!" : "Click to copy"}
              </span>
            </button>

            <p className="text-[11px] tracking-[0.15em] text-neutral-600 text-center max-w-xs">
              Share this code with your guest.
            </p>

            <button
              onClick={() => setGeneratedCode(null)}
              className="px-8 py-2 border border-neutral-800 hover:border-neutral-600 text-neutral-400 hover:text-white text-xs tracking-[0.2em] uppercase rounded transition-all duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        <div className="px-6 md:px-16 py-12">
          {/* Header */}
          <div className="mb-12 space-y-4">
            <h1 className="text-5xl md:text-6xl font-light tracking-tight" style={{ fontFamily: "Futures, sans-serif" }}>
              <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                Invitations
              </span>
            </h1>
            <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
              {currentEvent
                ? `${currentEvent.name}${currentEvent.date ? ` — ${new Date(currentEvent.date.slice(0, 10) + "T12:00:00").toLocaleDateString()}` : ""}`
                : "Create and manage invitation codes"}
            </p>
            <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />

            {/* Friendlist quota status */}
            {quotaInfo && (
              <div className="flex flex-wrap gap-3 pt-1">
                <span className={`text-[10px] px-3 py-1 rounded border tracking-[0.15em] uppercase font-mono ${
                  quotaInfo.total_limit !== null && quotaInfo.total_used >= quotaInfo.total_limit
                    ? "text-red-400 border-red-400/40 bg-red-400/10"
                    : "text-amber-400 border-amber-400/30 bg-amber-400/10"
                }`}>
                  Friendlist total: {quotaInfo.total_used}{quotaInfo.total_limit !== null ? ` / ${quotaInfo.total_limit}` : ""}
                </span>
                {quotaInfo.myQuota !== null && (
                  <span className={`text-[10px] px-3 py-1 rounded border tracking-[0.15em] uppercase font-mono ${
                    quotaInfo.myUsed >= quotaInfo.myQuota
                      ? "text-red-400 border-red-400/40 bg-red-400/10"
                      : "text-purple-400 border-purple-400/30 bg-purple-400/10"
                  }`}>
                    Your quota: {quotaInfo.myUsed} / {quotaInfo.myQuota}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-8 text-sm tracking-[0.15em] py-3 px-4 border border-red-400/30 text-red-400 bg-red-400/5 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-8 text-sm tracking-[0.15em] py-3 px-4 border border-emerald-400/30 text-emerald-400 bg-emerald-400/5 rounded">
              {success}
            </div>
          )}

          {/* Per-Admin Summary */}
          {adminSummary.length > 0 && (
            <div className="mb-12 border border-neutral-800 p-6 rounded">
              <h2 className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-4">By Admin</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800">
                      <th className="text-left text-[10px] tracking-[0.2em] uppercase text-neutral-600 pb-3 pr-6">Admin</th>
                      <th className="text-right text-[10px] tracking-[0.2em] uppercase text-neutral-600 pb-3 pr-6">Codes</th>
                      <th className="text-right text-[10px] tracking-[0.2em] uppercase text-neutral-600 pb-3 pr-6">Capacity</th>
                      <th className="text-right text-[10px] tracking-[0.2em] uppercase text-neutral-600 pb-3 pr-6">Used</th>
                      <th className="text-right text-[10px] tracking-[0.2em] uppercase text-neutral-600 pb-3">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminSummary.map((a) => (
                      <tr key={a.adminId} className="border-b border-neutral-900">
                        <td className="py-3 pr-6 text-white font-light">{a.username}</td>
                        <td className="py-3 pr-6 text-neutral-400 text-right">{a.codesCreated}</td>
                        <td className="py-3 pr-6 text-neutral-400 text-right">{a.totalCapacity}</td>
                        <td className="py-3 pr-6 text-neutral-400 text-right">{a.totalUsed}</td>
                        <td className="py-3 text-right">
                          <span className={a.totalCapacity > 0 && Math.round((a.totalUsed / a.totalCapacity) * 100) > 60 ? "text-emerald-400" : "text-neutral-400"}>
                            {a.totalCapacity > 0 ? Math.round((a.totalUsed / a.totalCapacity) * 100) : 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Create Button */}
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="mb-8 px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 transition-all duration-300 text-xs tracking-[0.2em] uppercase rounded"
          >
            {showCreateForm ? "Cancel" : "+ Create New Code"}
          </button>

          {/* Create Form */}
          {showCreateForm && (
            <div className="mb-12 border border-neutral-800 p-6 rounded-lg">
              <h2 className="text-xl font-light mb-6">Create New Invitation Code</h2>
              <form onSubmit={handleCreateInvite} className="space-y-6">

                {/* Tier */}
                <div>
                  <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">
                    Tier
                  </label>
                  <div className="flex gap-3">
                    {(["guest", "friendlist", "staff"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, tier: t })}
                        className={`px-4 py-2 text-xs tracking-[0.2em] uppercase border rounded transition-all duration-200 ${
                          formData.tier === t
                            ? (TIER_COLORS[t] + " border-opacity-100")
                            : "text-neutral-500 border-neutral-800 hover:border-neutral-600 hover:text-neutral-300"
                        }`}
                      >
                        {TIER_LABELS[t]}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-neutral-600 mt-2 tracking-[0.1em]">
                    {formData.tier === "guest" && "Standard guest code — up to 100 uses."}
                    {formData.tier === "friendlist" && "Friendlist code — single-use, receives friendlist discount."}
                    {formData.tier === "staff" && "Staff code — single-use, always free entry. Registers to the staff tab."}
                  </p>
                </div>

                {formData.tier === "guest" && (
                  <div>
                    <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">
                      Maximum Uses (1–100)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={formData.max_uses}
                      onChange={(e) => setFormData({ ...formData, max_uses: parseInt(e.target.value) })}
                      required
                      className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
                    />
                  </div>
                )}

                {/* Comment */}
                <div>
                  <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">
                    Admin Note (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="e.g. Max's table, Instagram DM promo..."
                    className="w-full bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2 border border-neutral-600 text-white hover:bg-neutral-800 hover:border-neutral-500 text-xs tracking-[0.2em] uppercase rounded disabled:opacity-50 transition-all duration-300"
                >
                  {isCreating ? "Creating..." : "Create Code"}
                </button>
              </form>
            </div>
          )}

          {/* Invites List */}
          <div className="space-y-4">
            {invites.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-neutral-500 text-sm tracking-[0.15em] uppercase">No invitation codes yet</p>
              </div>
            ) : (
              invites.map((invite) => {
                const tierKey = invite.tier || ""
                const tierLabel = TIER_LABELS[tierKey] || invite.invite_type || null
                const tierColor = TIER_COLORS[tierKey] || "text-neutral-500 border-neutral-700 bg-neutral-800/20"
                const usagePercent = Math.round((invite.current_uses / invite.max_uses) * 100)

                return (
                  <div
                    key={invite.id}
                    className="border border-neutral-800 hover:border-neutral-700 p-6 rounded transition-all duration-300"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-4">
                      <div>
                        <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">Code</p>
                        <p className="text-white font-mono text-sm tracking-[0.2em]">{invite.code_hash}</p>
                        {tierLabel && (
                          <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 border rounded tracking-[0.1em] uppercase ${tierColor}`}>
                            {tierLabel}
                          </span>
                        )}
                        {invite.is_staff_plus_one && (
                          <span className="inline-block mt-1 ml-1 text-[10px] px-2 py-0.5 border rounded tracking-[0.1em] uppercase text-purple-300 border-purple-300/40 bg-purple-300/10">
                            Staff +1
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">Status</p>
                        <p className={`font-light text-sm tracking-[0.15em] uppercase ${getStatusColor(invite)}`}>
                          {getStatusText(invite)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">Usage</p>
                        <p className="text-white font-light">{invite.current_uses} / {invite.max_uses}</p>
                        <div className="w-full bg-neutral-800 h-1 mt-2 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-600 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${usagePercent}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">Created By</p>
                        <p className="text-white font-light text-sm">{invite.admins?.username || "Unknown"}</p>
                      </div>

                      <div>
                        <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">Created</p>
                        <p className="text-white font-light text-sm">
                          {new Date(invite.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Comment */}
                    {invite.comment && (
                      <div className="mb-4 px-3 py-2 bg-neutral-900/60 border-l-2 border-neutral-700">
                        <p className="text-[11px] text-neutral-400 tracking-[0.1em]">{invite.comment}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="border-t border-neutral-800 pt-4 flex gap-3">
                      {!invite.revoked_at && !invite.redeemed && (
                        <button
                          onClick={() => handleRevokeInvite(invite.id)}
                          className="px-4 py-2 text-xs tracking-[0.2em] uppercase text-red-400 border border-red-400/30 hover:border-red-400 hover:bg-red-400/5 transition-all duration-300 rounded"
                        >
                          Revoke
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm("Delete this invitation code permanently? This cannot be undone.")) {
                            handleDeleteInvite(invite.id)
                          }
                        }}
                        className="px-4 py-2 text-xs tracking-[0.2em] uppercase text-neutral-500 border border-neutral-800 hover:border-red-400/50 hover:text-red-400 transition-all duration-300 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 md:px-16 py-12 border-t border-neutral-800">
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">Invitation Manager</div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">© 2026</div>
        </div>
      </div>
    </div>
  )
}
