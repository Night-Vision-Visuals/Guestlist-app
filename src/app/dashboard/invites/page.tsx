"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

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
  created_at: string
  created_by_admin_id: string
  admin: Admin | null
}

export default function InvitesPage() {
  const router = useRouter()
  const [invites, setInvites] = useState<Invitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    max_uses: 1
  })

  useEffect(() => {
    fetchInvites()
  }, [])

  const fetchInvites = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/invite/list", {
        credentials: "include"
      })

      if (res.status === 401) {
        router.push("/admin")
        return
      }

      if (!res.ok) {
        throw new Error("Failed to fetch invites")
      }

      const data = await res.json()
      setInvites(data || [])
      setError("")
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
          max_uses: parseInt(formData.max_uses.toString())
        }),
        credentials: "include"
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create invitation")
      }

      setSuccess(`Code created: ${data.code}`)
      setFormData({ max_uses: 1 })
      setShowCreateForm(false)
      
      // Copy code to clipboard
      navigator.clipboard.writeText(data.code)
      
      // Refresh invites list
      fetchInvites()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Failed to create invitation")
    } finally {
      setIsCreating(false)
    }
  }

  const handleRevokeInvite = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this invitation code?")) {
      return
    }

    try {
      const res = await fetch("/api/invite/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "include"
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to revoke invitation")
      }

      setSuccess("Invitation code revoked")
      setError("")
      fetchInvites()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Error revoking invitation")
    }
  }

  const getUsagePercentage = (current: number, max: number) => {
    return Math.round((current / max) * 100)
  }

  const getStatusColor = (invite: Invitation) => {
    if (invite.revoked_at) {
      return "text-red-400"
    }
    if (invite.redeemed) {
      return "text-yellow-400"
    }
    if (invite.current_uses >= invite.max_uses) {
      return "text-orange-400"
    }
    return "text-emerald-400"
  }

  const getStatusText = (invite: Invitation) => {
    if (invite.revoked_at) {
      return "Revoked"
    }
    if (invite.redeemed) {
      return "Fully Used"
    }
    if (invite.current_uses >= invite.max_uses) {
      return "Exhausted"
    }
    return "Active"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        <div className="fixed inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-black" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl opacity-20 animate-pulse" />
        </div>

        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <p className="text-lg tracking-[0.2em] uppercase text-neutral-400">
            Loading invitations
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
        {/* Top Navigation */}
        <div className="flex justify-between items-center px-6 md:px-16 py-12 border-b border-neutral-800">
          <div className="space-y-1">
            <div className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">
              NIGHT VISION
            </div>
            <div className="h-px w-12 bg-gradient-to-r from-white to-transparent" />
          </div>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="text-xs tracking-[0.3em] uppercase text-neutral-500 font-light">
                {invites.length} Codes
              </div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 font-light mt-1">
                Invitation Management
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 md:px-16 py-12">
          {/* Header */}
          <div className="mb-12 space-y-4">
            <h1 className="text-5xl md:text-6xl font-light tracking-tight">
              <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                Invitations
              </span>
            </h1>
            <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
              Create and manage invitation codes
            </p>
            <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-8 text-sm tracking-[0.15em] py-3 px-4 border border-red-400/30 text-red-400 bg-red-400/5">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-8 text-sm tracking-[0.15em] py-3 px-4 border border-emerald-400/30 text-emerald-400 bg-emerald-400/5">
              {success}
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
                <div>
                  <label className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2 block">
                    Maximum Uses (1-100)
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

                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs tracking-[0.2em] uppercase rounded disabled:opacity-50 transition-all duration-300"
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
                <p className="text-neutral-500 text-sm tracking-[0.15em] uppercase">
                  No invitation codes yet
                </p>
              </div>
            ) : (
              invites.map((invite) => (
                <div
                  key={invite.id}
                  className="border border-neutral-800 hover:border-neutral-700 p-6 transition-all duration-300"
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-4">
                    <div>
                      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">
                        ID
                      </p>
                      <p className="text-white font-mono text-sm">{invite.id.substring(0, 8)}...</p>
                    </div>

                    <div>
                      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">
                        Status
                      </p>
                      <p className={`font-light text-sm tracking-[0.15em] uppercase ${getStatusColor(invite)}`}>
                        {getStatusText(invite)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">
                        Usage
                      </p>
                      <p className="text-white font-light">
                        {invite.current_uses} / {invite.max_uses}
                      </p>
                      <div className="w-full bg-neutral-800 rounded-full h-1 mt-2">
                        <div
                          className="bg-emerald-600 h-1 rounded-full transition-all duration-300"
                          style={{ width: `${getUsagePercentage(invite.current_uses, invite.max_uses)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">
                        Created By
                      </p>
                      <p className="text-white font-light text-sm">
                        {invite.admin?.username || "Unknown"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-2">
                        Created
                      </p>
                      <p className="text-white font-light text-sm">
                        {new Date(invite.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!invite.revoked_at && !invite.redeemed && (
                    <div className="border-t border-neutral-800 pt-4 flex gap-3">
                      <button
                        onClick={() => handleRevokeInvite(invite.id)}
                        className="px-4 py-2 text-xs tracking-[0.2em] uppercase text-red-400 border border-red-400/30 hover:border-red-400 hover:bg-red-400/5 transition-all duration-300 rounded"
                      >
                        Revoke
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 md:px-16 py-12 border-t border-neutral-800">
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">
            Invitation Manager
          </div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">
            © 2026
          </div>
        </div>
      </div>
    </div>
  )
}