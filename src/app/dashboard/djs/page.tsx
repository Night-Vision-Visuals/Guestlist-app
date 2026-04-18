/**
 * @file /dashboard/djs/page.tsx
 *
 * DJ Management Tab — two sub-views:
 *   1. Roster  — All DJs across all events. Cards with genres, socials, bio.
 *                Click a card to open a side panel to edit profile + view sets.
 *   2. Lineup  — Per-event set schedule. Add/edit sets with a form + visual
 *                timeline sorted by start time.
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import { useEventContext } from "@/lib/EventContext"
import {
  Music2,
  Instagram,
  Clock,
  Plus,
  X,
  Edit2,
  Trash2,
  ChevronDown,
  Save,
  ExternalLink,
} from "lucide-react"

// ─── Constants ───────────────────────────────────────────────────────────────

const PRESET_GENRES = [
  "Hypnotic",
  "Industrial",
  "Raw",
  "Hardbounce",
  "Hardtrance",
  "Hardtechno",
  "Peaktime",
  "Melodic",
  "House",
  "Deep House",
  "Acid",
  "Other",
]

const SET_TYPES = [
  { value: "opening",    label: "Opening" },
  { value: "warming_up", label: "Warming Up" },
  { value: "peak_time",  label: "Peak Time" },
  { value: "closing",    label: "Closing" },
  { value: "back2back",  label: "Back2Back" },
  { value: "b3b",        label: "B3B" },
  { value: "live_act",   label: "Live Act" },
]

const SET_TYPE_BADGE: Record<string, string> = {
  opening:    "bg-blue-400/10 text-blue-400 border-blue-400/30",
  warming_up: "bg-amber-400/10 text-amber-400 border-amber-400/30",
  peak_time:  "bg-red-400/10 text-red-400 border-red-400/30",
  closing:    "bg-purple-400/10 text-purple-400 border-purple-400/30",
  back2back:  "bg-green-400/10 text-green-400 border-green-400/30",
  b3b:        "bg-green-400/10 text-green-400 border-green-400/30",
  live_act:   "bg-pink-400/10 text-pink-400 border-pink-400/30",
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface DJProfile {
  id: string
  application_id: string
  genres: string[]
  instagram: string | null
  soundcloud: string | null
  mixcloud: string | null
  bio: string | null
  updated_at: string | null
}

interface DJApplication {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  role_note: string | null
  checked_in: boolean
  checked_in_at: string | null
  event_id: string
  created_at: string
  gender: string | null
  profile: DJProfile | null
}

interface DJSet {
  id: string
  dj_profile_id: string
  event_id: string
  start_time: string | null
  end_time: string | null
  set_type: string | null
  stage: string | null
  notes: string | null
  dj_profiles?: {
    id: string
    application_id: string
    genres: string[]
    instagram: string | null
    soundcloud: string | null
    mixcloud: string | null
    bio: string | null
    applications?: {
      id: string
      first_name: string
      last_name: string
      email: string
      role_note: string | null
    }
  }
}

interface ProfileEditForm {
  genres: string[]
  customGenre: string
  instagram: string
  soundcloud: string
  mixcloud: string
  bio: string
}

interface SetForm {
  dj_profile_id: string
  start_time: string
  end_time: string
  set_type: string
  stage: string
  notes: string
}

const emptySetForm: SetForm = {
  dj_profile_id: "",
  start_time: "",
  end_time: "",
  set_type: "",
  stage: "",
  notes: "",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function djDisplayName(dj: DJApplication) {
  return `${dj.first_name} ${dj.last_name}`
}

/** Convert "HH:MM" time strings to minutes for sorting */
function timeToMinutes(t: string | null): number {
  if (!t) return 9999
  const [h, m] = t.split(":").map(Number)
  // Treat times 00:00–06:00 as next-day (add 24h) for overnight events
  const totalMins = h * 60 + (m || 0)
  return totalMins < 360 ? totalMins + 1440 : totalMins
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DJsPage() {
  const { currentEvent } = useEventContext()

  const [view, setView] = useState<"roster" | "lineup">("roster")

  // Data
  const [djs, setDJs] = useState<DJApplication[]>([])
  const [sets, setSets] = useState<DJSet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [setsLoading, setSetsLoading] = useState(false)

  // Roster panel
  const [selectedDJ, setSelectedDJ] = useState<DJApplication | null>(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<ProfileEditForm>({
    genres: [],
    customGenre: "",
    instagram: "",
    soundcloud: "",
    mixcloud: "",
    bio: "",
  })
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState("")

  // Lineup
  const [showSetForm, setShowSetForm] = useState(false)
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const [setForm, setSetForm] = useState<SetForm>(emptySetForm)
  const [isSavingSet, setIsSavingSet] = useState(false)
  const [setError, setSetError] = useState("")
  const [isDeletingSet, setIsDeletingSet] = useState<string | null>(null)

  // Search (roster)
  const [search, setSearch] = useState("")

  // ── Fetch DJs ──────────────────────────────────────────────────────────────
  const fetchDJs = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/djs", { credentials: "include" })
      const data = await res.json()
      setDJs(data.djs ?? [])
    } catch {
      setDJs([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDJs()
  }, [fetchDJs])

  // ── Fetch Sets for current event ───────────────────────────────────────────
  const fetchSets = useCallback(async () => {
    if (!currentEvent) return
    setSetsLoading(true)
    try {
      const res = await fetch(`/api/dj-sets?event_id=${currentEvent.id}`, {
        credentials: "include",
      })
      const data = await res.json()
      setSets(data.sets ?? [])
    } catch {
      setSets([])
    } finally {
      setSetsLoading(false)
    }
  }, [currentEvent])

  useEffect(() => {
    if (view === "lineup") fetchSets()
  }, [view, fetchSets])

  // ── Open DJ panel ──────────────────────────────────────────────────────────
  const openDJPanel = (dj: DJApplication) => {
    setSelectedDJ(dj)
    setEditingProfile(false)
    setProfileError("")
  }

  const startEditProfile = () => {
    if (!selectedDJ) return
    const p = selectedDJ.profile
    setProfileForm({
      genres: p?.genres ?? [],
      customGenre: "",
      instagram: p?.instagram ?? "",
      soundcloud: p?.soundcloud ?? "",
      mixcloud: p?.mixcloud ?? "",
      bio: p?.bio ?? "",
    })
    setEditingProfile(true)
    setProfileError("")
  }

  const toggleGenre = (g: string) => {
    setProfileForm((f) => ({
      ...f,
      genres: f.genres.includes(g) ? f.genres.filter((x) => x !== g) : [...f.genres, g],
    }))
  }

  const addCustomGenre = () => {
    const g = profileForm.customGenre.trim()
    if (!g || profileForm.genres.includes(g)) {
      setProfileForm((f) => ({ ...f, customGenre: "" }))
      return
    }
    setProfileForm((f) => ({ ...f, genres: [...f.genres, g], customGenre: "" }))
  }

  const saveProfile = async () => {
    if (!selectedDJ) return
    setIsSavingProfile(true)
    setProfileError("")
    try {
      const method = selectedDJ.profile ? "PATCH" : "POST"
      const body =
        method === "PATCH"
          ? {
              id: selectedDJ.profile!.id,
              genres: profileForm.genres,
              instagram: profileForm.instagram || null,
              soundcloud: profileForm.soundcloud || null,
              mixcloud: profileForm.mixcloud || null,
              bio: profileForm.bio || null,
            }
          : {
              application_id: selectedDJ.id,
              genres: profileForm.genres,
              instagram: profileForm.instagram || null,
              soundcloud: profileForm.soundcloud || null,
              mixcloud: profileForm.mixcloud || null,
              bio: profileForm.bio || null,
            }

      const res = await fetch("/api/djs", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      })

      if (!res.ok) {
        const d = await res.json()
        setProfileError(d.error ?? "Failed to save")
        return
      }

      await fetchDJs()
      setEditingProfile(false)
      // refresh selected DJ with updated data
      setSelectedDJ((prev) => {
        if (!prev) return prev
        return djs.find((d) => d.id === prev.id) ?? prev
      })
    } catch {
      setProfileError("Unexpected error")
    } finally {
      setIsSavingProfile(false)
    }
  }

  // Sync selectedDJ after djs array refreshes
  useEffect(() => {
    if (selectedDJ) {
      const updated = djs.find((d) => d.id === selectedDJ.id)
      if (updated) setSelectedDJ(updated)
    }
  }, [djs]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Set form helpers ───────────────────────────────────────────────────────
  const openNewSetForm = () => {
    setEditingSetId(null)
    setSetForm(emptySetForm)
    setSetError("")
    setShowSetForm(true)
  }

  const openEditSetForm = (s: DJSet) => {
    setEditingSetId(s.id)
    setSetForm({
      dj_profile_id: s.dj_profile_id,
      start_time: s.start_time ?? "",
      end_time: s.end_time ?? "",
      set_type: s.set_type ?? "",
      stage: s.stage ?? "",
      notes: s.notes ?? "",
    })
    setSetError("")
    setShowSetForm(true)
  }

  const saveSet = async () => {
    if (!currentEvent) return
    if (!setForm.dj_profile_id) {
      setSetError("Please select a DJ")
      return
    }
    setIsSavingSet(true)
    setSetError("")
    try {
      const isEdit = !!editingSetId
      const body = isEdit
        ? { id: editingSetId, ...setForm }
        : { event_id: currentEvent.id, ...setForm }

      const res = await fetch("/api/dj-sets", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      })

      if (!res.ok) {
        const d = await res.json()
        setSetError(d.error ?? "Failed to save")
        return
      }

      setShowSetForm(false)
      await fetchSets()
    } catch {
      setSetError("Unexpected error")
    } finally {
      setIsSavingSet(false)
    }
  }

  const deleteSet = async (id: string) => {
    setIsDeletingSet(id)
    try {
      await fetch(`/api/dj-sets?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      })
      await fetchSets()
    } finally {
      setIsDeletingSet(null)
    }
  }

  // ── Derived data ───────────────────────────────────────────────────────────
  const filteredDJs = djs.filter((d) => {
    const q = search.toLowerCase()
    return (
      d.first_name.toLowerCase().includes(q) ||
      d.last_name.toLowerCase().includes(q) ||
      (d.profile?.genres ?? []).some((g) => g.toLowerCase().includes(q)) ||
      (d.role_note ?? "").toLowerCase().includes(q)
    )
  })

  // DJs that have profiles (needed for set form selector)
  const djsWithProfiles = djs.filter((d) => d.profile !== null)

  const sortedSets = [...sets].sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
  )

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-light tracking-[0.2em] uppercase text-white">
              DJ Management
            </h1>
            <p className="text-xs tracking-[0.2em] text-neutral-500 uppercase mt-1">
              {djs.length} {djs.length === 1 ? "DJ" : "DJs"} in roster
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-1">
            {(["roster", "lineup"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded text-xs tracking-[0.15em] uppercase font-light transition-all duration-200 ${
                  view === v
                    ? "bg-white text-black"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* ── ROSTER VIEW ─────────────────────────────────────────────────── */}
        {view === "roster" && (
          <div className="flex gap-6">
            {/* DJ Grid */}
            <div className="flex-1">
              {/* Search */}
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search DJs, genres..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 rounded-lg transition-all"
                />
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-neutral-600 text-xs tracking-[0.2em] uppercase animate-pulse">
                    Loading...
                  </div>
                </div>
              ) : filteredDJs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Music2 size={32} className="text-neutral-700 mb-3" />
                  <p className="text-neutral-500 text-sm font-light tracking-[0.15em] uppercase">
                    {search ? "No DJs found" : "No DJs in roster"}
                  </p>
                  <p className="text-neutral-700 text-xs mt-1">
                    Add staff members with the DJ role in the Applications tab
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDJs.map((dj) => (
                    <DJCard
                      key={dj.id}
                      dj={dj}
                      isSelected={selectedDJ?.id === dj.id}
                      onClick={() => openDJPanel(dj)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Side Panel */}
            {selectedDJ && (
              <div className="w-80 flex-shrink-0">
                <DJPanel
                  dj={selectedDJ}
                  editing={editingProfile}
                  form={profileForm}
                  isSaving={isSavingProfile}
                  error={profileError}
                  onClose={() => setSelectedDJ(null)}
                  onEdit={startEditProfile}
                  onSave={saveProfile}
                  onCancelEdit={() => setEditingProfile(false)}
                  onFormChange={setProfileForm}
                  onToggleGenre={toggleGenre}
                  onAddCustomGenre={addCustomGenre}
                />
              </div>
            )}
          </div>
        )}

        {/* ── LINEUP VIEW ─────────────────────────────────────────────────── */}
        {view === "lineup" && (
          <div>
            {/* Event Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs tracking-[0.2em] text-neutral-500 uppercase">
                  Current event
                </p>
                <p className="text-lg font-light tracking-[0.15em] text-white mt-0.5">
                  {currentEvent?.name ?? "—"}
                </p>
                {currentEvent?.date && (
                  <p className="text-xs text-neutral-600 mt-0.5">
                    {new Date(currentEvent.date.slice(0, 10) + "T12:00:00").toLocaleDateString(
                      "en-GB",
                      { weekday: "long", day: "numeric", month: "long", year: "numeric" }
                    )}
                  </p>
                )}
              </div>
              <button
                onClick={openNewSetForm}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg text-xs tracking-[0.15em] uppercase font-medium hover:bg-neutral-200 transition-all"
              >
                <Plus size={14} />
                Add Set
              </button>
            </div>

            {/* Add / Edit Set Form */}
            {showSetForm && (
              <SetFormPanel
                form={setForm}
                isEditing={!!editingSetId}
                isSaving={isSavingSet}
                error={setError}
                djsWithProfiles={djsWithProfiles}
                onFormChange={setSetForm}
                onSave={saveSet}
                onCancel={() => setShowSetForm(false)}
              />
            )}

            {/* Timeline */}
            {setsLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-neutral-600 text-xs tracking-[0.2em] uppercase animate-pulse">
                  Loading lineup...
                </div>
              </div>
            ) : sortedSets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center border border-dashed border-neutral-800 rounded-xl">
                <Clock size={28} className="text-neutral-700 mb-3" />
                <p className="text-neutral-500 text-sm font-light tracking-[0.15em] uppercase">
                  No sets scheduled
                </p>
                <p className="text-neutral-700 text-xs mt-1">
                  Click "Add Set" to schedule DJs for this event
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Stage groups */}
                {renderLineupByStage(sortedSets, onEditSet, isDeletingSet, deleteSet)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  function onEditSet(s: DJSet) {
    openEditSetForm(s)
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DJCard({
  dj,
  isSelected,
  onClick,
}: {
  dj: DJApplication
  isSelected: boolean
  onClick: () => void
}) {
  const genres = dj.profile?.genres ?? []

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 rounded-xl border transition-all duration-200 ${
        isSelected
          ? "bg-neutral-900 border-neutral-600"
          : "bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900"
      }`}
    >
      {/* Avatar + Name */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-purple-400/10 border border-purple-400/20 flex items-center justify-center flex-shrink-0">
          <Music2 size={16} className="text-purple-400" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-light tracking-[0.1em] text-white truncate">
            {dj.first_name} {dj.last_name}
          </p>
          {dj.role_note && (
            <p className="text-[10px] text-neutral-500 truncate mt-0.5">{dj.role_note}</p>
          )}
        </div>
      </div>

      {/* Genres */}
      {genres.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {genres.slice(0, 4).map((g) => (
            <span
              key={g}
              className="text-[10px] px-2 py-0.5 rounded border border-purple-400/20 bg-purple-400/5 text-purple-300 tracking-[0.08em]"
            >
              {g}
            </span>
          ))}
          {genres.length > 4 && (
            <span className="text-[10px] text-neutral-600">+{genres.length - 4}</span>
          )}
        </div>
      )}

      {/* Social icons */}
      <div className="flex items-center gap-3 mt-auto">
        {dj.profile?.instagram && (
          <Instagram size={12} className="text-neutral-500" />
        )}
        {dj.profile?.soundcloud && (
          <span className="text-[10px] text-neutral-600 font-light">SC</span>
        )}
        {dj.profile?.mixcloud && (
          <span className="text-[10px] text-neutral-600 font-light">MC</span>
        )}
        {!dj.profile && (
          <span className="text-[10px] text-neutral-700 font-light tracking-[0.1em]">
            No profile yet
          </span>
        )}
      </div>
    </button>
  )
}

function DJPanel({
  dj,
  editing,
  form,
  isSaving,
  error,
  onClose,
  onEdit,
  onSave,
  onCancelEdit,
  onFormChange,
  onToggleGenre,
  onAddCustomGenre,
}: {
  dj: DJApplication
  editing: boolean
  form: ProfileEditForm
  isSaving: boolean
  error: string
  onClose: () => void
  onEdit: () => void
  onSave: () => void
  onCancelEdit: () => void
  onFormChange: (f: ProfileEditForm) => void
  onToggleGenre: (g: string) => void
  onAddCustomGenre: () => void
}) {
  const p = dj.profile

  return (
    <div className="sticky top-6 bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-purple-400/10 border border-purple-400/20 flex items-center justify-center">
            <Music2 size={14} className="text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-light tracking-[0.1em] text-white">
              {dj.first_name} {dj.last_name}
            </p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-[0.15em]">DJ</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <button
              onClick={onEdit}
              className="p-1.5 text-neutral-500 hover:text-white transition-colors"
              title="Edit profile"
            >
              <Edit2 size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5 max-h-[calc(100vh-12rem)] overflow-y-auto">
        {editing ? (
          /* ── Edit Mode ── */
          <>
            {/* Genres */}
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 block mb-2">
                Genres
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {PRESET_GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => onToggleGenre(g)}
                    className={`text-[10px] px-2 py-1 rounded border transition-all tracking-[0.08em] ${
                      form.genres.includes(g)
                        ? "border-purple-400/50 bg-purple-400/15 text-purple-300"
                        : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-600"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              {/* Custom genre input */}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Custom genre..."
                  value={form.customGenre}
                  onChange={(e) => onFormChange({ ...form, customGenre: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && onAddCustomGenre()}
                  className="flex-1 bg-neutral-900 border border-neutral-700 px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 rounded"
                />
                <button
                  onClick={onAddCustomGenre}
                  className="px-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded text-xs text-neutral-300 hover:text-white hover:bg-neutral-700 transition-all"
                >
                  Add
                </button>
              </div>
              {/* Custom genres display */}
              {form.genres.filter((g) => !PRESET_GENRES.includes(g)).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.genres
                    .filter((g) => !PRESET_GENRES.includes(g))
                    .map((g) => (
                      <span
                        key={g}
                        className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border border-neutral-600 bg-neutral-800 text-neutral-300"
                      >
                        {g}
                        <button
                          onClick={() => onToggleGenre(g)}
                          className="text-neutral-500 hover:text-red-400 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Social links */}
            <div className="space-y-2">
              <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 block">
                Socials
              </label>
              {[
                { key: "instagram" as const, placeholder: "Instagram handle or URL" },
                { key: "soundcloud" as const, placeholder: "SoundCloud URL" },
                { key: "mixcloud" as const, placeholder: "Mixcloud URL" },
              ].map(({ key, placeholder }) => (
                <input
                  key={key}
                  type="text"
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => onFormChange({ ...form, [key]: e.target.value })}
                  className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 rounded transition-all"
                />
              ))}
            </div>

            {/* Bio */}
            <div>
              <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 block mb-2">
                Bio / Notes
              </label>
              <textarea
                placeholder="Short bio or internal notes..."
                value={form.bio}
                onChange={(e) => onFormChange({ ...form, bio: e.target.value })}
                rows={3}
                className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 rounded resize-none transition-all"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs">{error}</p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={onSave}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-white text-black rounded text-xs tracking-[0.15em] uppercase font-medium hover:bg-neutral-200 transition-all disabled:opacity-50"
              >
                <Save size={12} />
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                onClick={onCancelEdit}
                className="flex-1 py-2 bg-neutral-900 border border-neutral-700 text-neutral-400 rounded text-xs tracking-[0.15em] uppercase hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          /* ── View Mode ── */
          <>
            {/* Contact */}
            <div>
              <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1">Email</p>
              <p className="text-xs text-neutral-300">{dj.email}</p>
            </div>

            {dj.role_note && (
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1">Note</p>
                <p className="text-xs text-neutral-300">{dj.role_note}</p>
              </div>
            )}

            {/* Genres */}
            {(p?.genres ?? []).length > 0 ? (
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-2">
                  Genres
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {p!.genres.map((g) => (
                    <span
                      key={g}
                      className="text-[10px] px-2 py-0.5 rounded border border-purple-400/20 bg-purple-400/5 text-purple-300 tracking-[0.08em]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1">
                  Genres
                </p>
                <p className="text-xs text-neutral-700 italic">None set</p>
              </div>
            )}

            {/* Socials */}
            {(p?.instagram || p?.soundcloud || p?.mixcloud) && (
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-2">
                  Links
                </p>
                <div className="space-y-1.5">
                  {p?.instagram && (
                    <SocialLink icon="IG" label={p.instagram} href={
                      p.instagram.startsWith("http") ? p.instagram : `https://instagram.com/${p.instagram.replace("@", "")}`
                    } />
                  )}
                  {p?.soundcloud && <SocialLink icon="SC" label="SoundCloud" href={p.soundcloud} />}
                  {p?.mixcloud && <SocialLink icon="MC" label="Mixcloud" href={p.mixcloud} />}
                </div>
              </div>
            )}

            {/* Bio */}
            {p?.bio && (
              <div>
                <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1">Bio</p>
                <p className="text-xs text-neutral-400 leading-relaxed">{p.bio}</p>
              </div>
            )}

            {!p && (
              <div className="text-center py-4">
                <p className="text-neutral-600 text-xs">No profile yet.</p>
                <button
                  onClick={onEdit}
                  className="mt-2 text-[10px] tracking-[0.15em] uppercase text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Create profile
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SocialLink({
  icon,
  label,
  href,
}: {
  icon: string
  label: string
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-xs text-neutral-400 hover:text-white transition-colors group"
    >
      <span className="text-[10px] font-mono text-neutral-600 w-5">{icon}</span>
      <span className="truncate">{label}</span>
      <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </a>
  )
}

function SetFormPanel({
  form,
  isEditing,
  isSaving,
  error,
  djsWithProfiles,
  onFormChange,
  onSave,
  onCancel,
}: {
  form: SetForm
  isEditing: boolean
  isSaving: boolean
  error: string
  djsWithProfiles: DJApplication[]
  onFormChange: (f: SetForm) => void
  onSave: () => void
  onCancel: () => void
}) {
  return (
    <div className="mb-6 bg-neutral-950 border border-neutral-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs tracking-[0.2em] uppercase text-neutral-400">
          {isEditing ? "Edit Set" : "New Set"}
        </p>
        <button onClick={onCancel} className="text-neutral-500 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* DJ selector */}
        <div className="sm:col-span-2">
          <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 block mb-1.5">
            DJ *
          </label>
          <div className="relative">
            <select
              value={form.dj_profile_id}
              onChange={(e) => onFormChange({ ...form, dj_profile_id: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500 rounded appearance-none transition-all"
            >
              <option value="">Select DJ...</option>
              {djsWithProfiles.map((dj) => (
                <option key={dj.profile!.id} value={dj.profile!.id} className="bg-black">
                  {dj.first_name} {dj.last_name}
                  {dj.role_note ? ` — ${dj.role_note}` : ""}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          </div>
          {djsWithProfiles.length === 0 && (
            <p className="text-[10px] text-amber-400/80 mt-1">
              No DJ profiles yet — create profiles in the Roster view first.
            </p>
          )}
        </div>

        {/* Start time */}
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 block mb-1.5">
            Start Time
          </label>
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => onFormChange({ ...form, start_time: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500 rounded transition-all"
          />
        </div>

        {/* End time */}
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 block mb-1.5">
            End Time
          </label>
          <input
            type="time"
            value={form.end_time}
            onChange={(e) => onFormChange({ ...form, end_time: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500 rounded transition-all"
          />
        </div>

        {/* Set type */}
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 block mb-1.5">
            Set Type
          </label>
          <div className="relative">
            <select
              value={form.set_type}
              onChange={(e) => onFormChange({ ...form, set_type: e.target.value })}
              className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500 rounded appearance-none transition-all"
            >
              <option value="">None</option>
              {SET_TYPES.map((t) => (
                <option key={t.value} value={t.value} className="bg-black">
                  {t.label}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          </div>
        </div>

        {/* Stage */}
        <div>
          <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 block mb-1.5">
            Stage / Room
          </label>
          <input
            type="text"
            placeholder="e.g. Main Floor, Room 2..."
            value={form.stage}
            onChange={(e) => onFormChange({ ...form, stage: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 rounded transition-all"
          />
        </div>

        {/* Notes */}
        <div className="sm:col-span-2">
          <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 block mb-1.5">
            Notes
          </label>
          <input
            type="text"
            placeholder="e.g. B2B with DJ X, live set, special request..."
            value={form.notes}
            onChange={(e) => onFormChange({ ...form, notes: e.target.value })}
            className="w-full bg-neutral-900 border border-neutral-700 px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 rounded transition-all"
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-xs mt-3">{error}</p>}

      <div className="flex gap-2 mt-4">
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded text-xs tracking-[0.15em] uppercase font-medium hover:bg-neutral-200 transition-all disabled:opacity-50"
        >
          <Save size={12} />
          {isSaving ? "Saving..." : isEditing ? "Update" : "Add Set"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-neutral-900 border border-neutral-700 text-neutral-400 rounded text-xs tracking-[0.15em] uppercase hover:text-white transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function renderLineupByStage(
  sets: DJSet[],
  onEdit: (s: DJSet) => void,
  deletingId: string | null,
  onDelete: (id: string) => void
) {
  // Group sets by stage
  const stageMap = new Map<string, DJSet[]>()
  for (const s of sets) {
    const stage = s.stage || "Main Floor"
    if (!stageMap.has(stage)) stageMap.set(stage, [])
    stageMap.get(stage)!.push(s)
  }

  return Array.from(stageMap.entries()).map(([stage, stageSets]) => (
    <div key={stage}>
      {/* Stage Label */}
      <div className="flex items-center gap-3 mb-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-neutral-500 font-light">
          {stage}
        </p>
        <div className="flex-1 h-px bg-neutral-800" />
        <p className="text-[10px] text-neutral-700">{stageSets.length} sets</p>
      </div>

      <div className="space-y-2">
        {stageSets.map((s) => {
          const djName = s.dj_profiles?.applications
            ? `${s.dj_profiles.applications.first_name} ${s.dj_profiles.applications.last_name}`
            : "Unknown DJ"
          const genres = s.dj_profiles?.genres ?? []
          const typeLabel = SET_TYPES.find((t) => t.value === s.set_type)?.label
          const typeBadge = s.set_type ? SET_TYPE_BADGE[s.set_type] : null

          return (
            <div
              key={s.id}
              className="flex items-center gap-4 bg-neutral-950 border border-neutral-800 rounded-xl px-5 py-4 group hover:border-neutral-700 transition-all"
            >
              {/* Time */}
              <div className="w-24 flex-shrink-0 text-center">
                <p className="text-sm font-mono text-white">{s.start_time ?? "—"}</p>
                {s.end_time && (
                  <p className="text-[10px] text-neutral-600 mt-0.5">↓ {s.end_time}</p>
                )}
              </div>

              {/* Divider */}
              <div className="w-px h-10 bg-neutral-800 flex-shrink-0" />

              {/* DJ Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-light tracking-[0.1em] text-white">{djName}</p>
                  {typeLabel && typeBadge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded border tracking-[0.08em] ${typeBadge}`}
                    >
                      {typeLabel}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {genres.slice(0, 3).map((g) => (
                    <span key={g} className="text-[10px] text-neutral-600">
                      {g}
                    </span>
                  ))}
                  {s.notes && (
                    <span className="text-[10px] text-neutral-600 italic">{s.notes}</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(s)}
                  className="p-1.5 text-neutral-500 hover:text-white transition-colors"
                  title="Edit set"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => onDelete(s.id)}
                  disabled={deletingId === s.id}
                  className="p-1.5 text-neutral-500 hover:text-red-400 transition-colors disabled:opacity-40"
                  title="Delete set"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  ))
}
