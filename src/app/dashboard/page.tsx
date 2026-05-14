"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useEventContext } from "@/lib/EventContext"
import { QrCode, Pencil, X, Check, LogIn, UserX, LayoutList, LayoutGrid, Mail, Send, Clock, CheckCheck, MailCheck, SlidersHorizontal, UserPlus, Download, Receipt, User } from "lucide-react"
import * as XLSX from "xlsx"

interface AdminRef {
  id: string
  username: string
}

interface Application {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  email: string
  instagram: string | null
  intro: string | null
  gender: string | null
  heard_about_us: string | null
  status: string
  no_show_count: number
  created_at: string
  event_id: string
  qr_token: string | null
  checked_in: boolean | null
  checked_in_at: string | null
  paid: boolean | null
  invite_type: string | null
  age_flagged: boolean | null
  email_sent_at: string | null
  email_type: string | null
  ticket_generated_at: string | null
  role: string
  role_note: string | null
  added_by_admin: AdminRef | null
  invite_code_admin: AdminRef | null
}

interface EventEmailState {
  batch_email_sent: boolean
  scheduled_email_send_at: string | null
}

interface EditForm {
  email: string
  status: string
}

interface AddStaffForm {
  first_name: string
  last_name: string
  date_of_birth: string
  email: string
  role: string
  role_note: string
  gender: string
}

interface AddGuestForm {
  first_name: string
  last_name: string
  email: string
  date_of_birth: string
  gender: string
  invite_type: string
}

const STAFF_ROLES = [
  { value: "dj",            label: "DJ" },
  { value: "security",      label: "Security" },
  { value: "bar_staff",     label: "Bar Staff" },
  { value: "general_staff", label: "General Staff" },
  { value: "awareness",     label: "Awareness" },
  { value: "other",         label: "Other" },
]

const ROLE_BADGE: Record<string, string> = {
  dj:            "text-purple-400 border-purple-400/30 bg-purple-400/10",
  security:      "text-red-400 border-red-400/30 bg-red-400/10",
  bar_staff:     "text-amber-400 border-amber-400/30 bg-amber-400/10",
  general_staff: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  awareness:     "text-green-400 border-green-400/30 bg-green-400/10",
  other:         "text-neutral-400 border-neutral-700 bg-neutral-800",
}

const ROLE_LABEL: Record<string, string> = {
  dj:            "DJ",
  security:      "Security",
  bar_staff:     "Bar Staff",
  general_staff: "General Staff",
  awareness:     "Awareness",
  other:         "Other",
  guest:         "Guest",
}

export default function DashboardPage() {
  const router = useRouter()
  const { currentEvent, isLoading: eventsLoading } = useEventContext()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatuses, setFilterStatuses] = useState<string[]>([])
  const [filterGenders, setFilterGenders] = useState<string[]>([])
  const [filterAdmins, setFilterAdmins] = useState<string[]>([])
  const [filterAgeMin, setFilterAgeMin] = useState<number>(14)
  const [filterAgeMax, setFilterAgeMax] = useState<number>(60)
  const [filterCheckedIn, setFilterCheckedIn] = useState<"all" | "yes" | "no">("all")
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [viewMode, setViewMode] = useState<"overview" | "detailed">("overview")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ email: "", status: "" })
  const [checkingInId, setCheckingInId] = useState<string | null>(null)
  const [resendingEmailId, setResendingEmailId] = useState<string | null>(null)
  const [resendResult, setResendResult] = useState<{ id: string; success: boolean; message: string } | null>(null)

  // Expanded guest detail (click-to-expand in overview mode)
  const [expandedGuestId, setExpandedGuestId] = useState<string | null>(null)

  // Admin list for filter
  const [adminList, setAdminList] = useState<AdminRef[]>([])

  // Tab state
  const [activeTab, setActiveTab] = useState<"guests" | "staff">("guests")

  // Staff tab filters
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>("all")
  const [staffSearchTerm, setStaffSearchTerm] = useState("")

  // Add staff modal
  const [showAddStaffModal, setShowAddStaffModal] = useState(false)
  const [addStaffForm, setAddStaffForm] = useState<AddStaffForm>({
    first_name: "", last_name: "", date_of_birth: "", email: "", role: "dj", role_note: "", gender: ""
  })
  const [isAddingStaff, setIsAddingStaff] = useState(false)
  const [addStaffError, setAddStaffError] = useState("")

  // Add guest modal
  const [showAddGuestModal, setShowAddGuestModal] = useState(false)
  const [addGuestForm, setAddGuestForm] = useState<AddGuestForm>({
    first_name: "", last_name: "", email: "", date_of_birth: "", gender: "", invite_type: "guest"
  })
  const [isAddingGuest, setIsAddingGuest] = useState(false)
  const [addGuestError, setAddGuestError] = useState("")

  // Staff inline edit
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null)
  const [staffEditForm, setStaffEditForm] = useState<AddStaffForm>({
    first_name: "", last_name: "", date_of_birth: "", email: "", role: "dj", role_note: "", gender: ""
  })
  const [isEditingStaff, setIsEditingStaff] = useState(false)
  const [staffEditError, setStaffEditError] = useState("")

  // Staff +1 codes: map of application_id → invite code hash (or null)
  const [staffPlusOneCodes, setStaffPlusOneCodes] = useState<Record<string, string | null>>({})
  const [revokingPlusOneId, setRevokingPlusOneId] = useState<string | null>(null)

  // Email state
  const [eventEmailState, setEventEmailState] = useState<EventEmailState | null>(null)
  const [isSendingEmails, setIsSendingEmails] = useState(false)
  const [sendResult, setSendResult] = useState<{ sent: number; failed: number; errors: string[] } | null>(null)
  const [scheduledAt, setScheduledAt] = useState("")
  const [isSavingSchedule, setIsSavingSchedule] = useState(false)
  const [showEmailPanel, setShowEmailPanel] = useState(false)

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  const fetchAdmins = useCallback(async () => {
    try {
      const res = await fetch("/api/admins", { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setAdminList(data || [])
      }
    } catch {
      // non-critical
    }
  }, [])

  const fetchEventEmailState = useCallback(async (eventId: string) => {
    try {
      const res = await fetch(`/api/events/email-state?eventId=${eventId}`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setEventEmailState(data)
        if (data.scheduled_email_send_at) {
          setScheduledAt(data.scheduled_email_send_at.slice(0, 16))
        } else {
          setScheduledAt("")
        }
      }
    } catch {
      // non-critical
    }
  }, [])

  const triggerScheduledCheck = useCallback(async () => {
    try {
      await fetch("/api/cron/send-scheduled-emails", { credentials: "include" })
    } catch {
      // non-critical
    }
  }, [])

  useEffect(() => {
    if (currentEvent) {
      fetchApplications(currentEvent.id)
      fetchEventEmailState(currentEvent.id)
      triggerScheduledCheck()
    }
    fetchAdmins()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEvent])

  const fetchApplications = async (eventId?: string) => {
    try {
      setIsLoading(true)
      const url = eventId
        ? `/api/applications?eventId=${eventId}`
        : "/api/applications"
      const res = await fetch(url, { method: "GET", credentials: "include" })

      if (res.status === 401 || res.status === 403) {
        router.push("/admin")
        return
      }
      if (!res.ok) throw new Error("Failed to fetch applications")

      const data = await res.json()
      setApplications(data || [])
      if (data && data.length > 0) {
        const ages = (data as Application[])
          .filter(a => a.role === "guest" || !a.role)
          .map(a => calculateAge(a.date_of_birth))
          .filter((a: number) => !isNaN(a) && a > 0 && a < 120)
        if (ages.length > 0) {
          setFilterAgeMin(Math.min(...ages))
          setFilterAgeMax(Math.max(...ages))
        }
        // Fetch +1 codes for staff members
        const staffIds = (data as Application[])
          .filter(a => a.role && a.role !== "guest")
          .map(a => a.id)
        if (staffIds.length > 0) {
          fetchStaffPlusOneCodes(staffIds)
        }
      }
      setError("")
    } catch (err) {
      console.error("Fetch error:", err)
      setError("Error fetching applications")
      router.push("/admin")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchStaffPlusOneCodes = async (applicationIds: string[]) => {
    try {
      const params = new URLSearchParams()
      applicationIds.forEach(id => params.append("appId", id))
      const res = await fetch(`/api/invite/staff-plus-one?${params.toString()}`, { credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        setStaffPlusOneCodes(data.codes || {})
      }
    } catch {
      // non-critical
    }
  }

  const handleRevokePlusOne = async (applicationId: string) => {
    const code = staffPlusOneCodes[applicationId]
    if (!code) return
    if (!confirm(`Revoke the +1 code for this staff member? Their friend's invite code (${code}) will be invalidated.`)) return
    setRevokingPlusOneId(applicationId)
    try {
      // Find the invite code id first
      const listRes = await fetch(`/api/invite/staff-plus-one?appId=${applicationId}`, { credentials: "include" })
      if (!listRes.ok) return
      const listData = await listRes.json()
      const codeId = listData.codeId
      if (!codeId) return
      const res = await fetch("/api/invite/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: codeId }),
        credentials: "include",
      })
      if (res.ok) {
        setStaffPlusOneCodes(prev => ({ ...prev, [applicationId]: null }))
      }
    } catch {
      // non-critical
    } finally {
      setRevokingPlusOneId(null)
    }
  }

  const updateStatus = async (id: string, action: "approve" | "reject" | "waitlist" | "cancelled") => {
    try {
      const res = await fetch("/api/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
        credentials: "include"
      })
      if (res.status === 401 || res.status === 403) { router.push("/admin"); return }
      if (!res.ok) throw new Error("Failed to update status")
      fetchApplications(currentEvent?.id)
    } catch (err) {
      console.error(err)
      setError("Error updating status")
    }
  }

  const handleSendEmails = async () => {
    if (!currentEvent) return
    if (!confirm(`Send emails to all pending approved/rejected guests for "${currentEvent.name}"? This cannot be undone.`)) return
    setIsSendingEmails(true)
    setSendResult(null)
    try {
      const res = await fetch("/api/send-emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: currentEvent.id }),
        credentials: "include"
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to send emails"); return }
      setSendResult({ sent: data.sent, failed: data.failed, errors: data.errors })
      fetchApplications(currentEvent.id)
      fetchEventEmailState(currentEvent.id)
    } catch (err) {
      console.error(err)
      setError("Error sending emails")
    } finally {
      setIsSendingEmails(false)
    }
  }

  const handleSaveSchedule = async () => {
    if (!currentEvent) return
    setIsSavingSchedule(true)
    try {
      const res = await fetch("/api/events/schedule-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: currentEvent.id,
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        }),
        credentials: "include"
      })
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed to save schedule"); return }
      fetchEventEmailState(currentEvent.id)
    } catch (err) {
      console.error(err)
      setError("Error saving schedule")
    } finally {
      setIsSavingSchedule(false)
    }
  }

  const handleClearSchedule = async () => {
    if (!currentEvent) return
    setScheduledAt("")
    setIsSavingSchedule(true)
    try {
      await fetch("/api/events/schedule-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: currentEvent.id, scheduledAt: null }),
        credentials: "include"
      })
      fetchEventEmailState(currentEvent.id)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSavingSchedule(false)
    }
  }

  const handleManualCheckIn = async (id: string) => {
    setCheckingInId(id)
    try {
      const res = await fetch("/api/manual-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "include"
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to check in guest")
        return
      }
      fetchApplications(currentEvent?.id)
    } catch (err) {
      console.error(err)
      setError("Error checking in guest")
    } finally {
      setCheckingInId(null)
    }
  }

  const handleResendEmail = async (id: string) => {
    setResendingEmailId(id)
    setResendResult(null)
    try {
      const res = await fetch("/api/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
        credentials: "include"
      })
      const data = await res.json()
      if (!res.ok) {
        setResendResult({ id, success: false, message: data.error || "Failed to send email" })
        return
      }
      setResendResult({ id, success: true, message: "Email sent" })
      fetchApplications(currentEvent?.id)
    } catch (err) {
      console.error(err)
      setResendResult({ id, success: false, message: "Error sending email" })
    } finally {
      setResendingEmailId(null)
    }
  }

  const handleEditSave = async (id: string) => {
    try {
      const res = await fetch("/api/edit-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, email: editForm.email, status: editForm.status }),
        credentials: "include"
      })
      if (!res.ok) {
        let errorMsg = "Failed to update application"
        try {
          const data = await res.json()
          errorMsg = data.error || errorMsg
        } catch {
          const text = await res.text().catch(() => "(no body)")
          console.error("Non-JSON error response:", res.status, text)
          errorMsg = `Server error ${res.status}`
        }
        setError(errorMsg)
        return
      }
      setEditingId(null)
      fetchApplications(currentEvent?.id)
    } catch (err) {
      console.error("Edit save fetch error:", err)
      setError("Error updating application")
    }
  }

  const startEdit = (app: Application) => {
    setEditingId(app.id)
    setEditForm({ email: app.email, status: app.status })
  }

  // ── Add Staff ────────────────────────────────────────────────────────────────
  const handleAddStaff = async () => {
    if (!currentEvent) return
    if (!addStaffForm.first_name.trim() || !addStaffForm.last_name.trim()) {
      setAddStaffError("First name and last name are required")
      return
    }
    if (!addStaffForm.date_of_birth) {
      setAddStaffError("Date of birth is required")
      return
    }
    if (!addStaffForm.email.trim()) {
      setAddStaffError("Email is required")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addStaffForm.email.trim())) {
      setAddStaffError("Please enter a valid email address")
      return
    }
    if (!addStaffForm.gender) {
      setAddStaffError("Gender is required")
      return
    }
    setIsAddingStaff(true)
    setAddStaffError("")
    try {
      const res = await fetch("/api/manual-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: currentEvent.id,
          first_name: addStaffForm.first_name.trim(),
          last_name: addStaffForm.last_name.trim(),
          email: addStaffForm.email.trim(),
          date_of_birth: addStaffForm.date_of_birth,
          gender: addStaffForm.gender,
          role: addStaffForm.role,
          role_note: addStaffForm.role_note.trim(),
        }),
        credentials: "include"
      })
      const data = await res.json()
      if (!res.ok) {
        setAddStaffError(data.error || "Failed to add person")
        return
      }
      setShowAddStaffModal(false)
      setAddStaffForm({ first_name: "", last_name: "", date_of_birth: "", email: "", role: "dj", role_note: "", gender: "" })
      fetchApplications(currentEvent.id)
    } catch (err) {
      console.error(err)
      setAddStaffError("Error adding person")
    } finally {
      setIsAddingStaff(false)
    }
  }

  // ── Add Guest ────────────────────────────────────────────────────────────────
  const handleAddGuest = async () => {
    if (!currentEvent) return
    if (!addGuestForm.first_name.trim() || !addGuestForm.last_name.trim()) {
      setAddGuestError("First name and last name are required")
      return
    }
    if (!addGuestForm.date_of_birth) {
      setAddGuestError("Date of birth is required")
      return
    }
    if (!addGuestForm.email.trim()) {
      setAddGuestError("Email is required")
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addGuestForm.email.trim())) {
      setAddGuestError("Please enter a valid email address")
      return
    }
    if (!addGuestForm.gender) {
      setAddGuestError("Gender is required")
      return
    }
    setIsAddingGuest(true)
    setAddGuestError("")
    try {
      const res = await fetch("/api/manual-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: currentEvent.id,
          first_name: addGuestForm.first_name.trim(),
          last_name: addGuestForm.last_name.trim(),
          email: addGuestForm.email.trim(),
          role: "guest",
          date_of_birth: addGuestForm.date_of_birth,
          gender: addGuestForm.gender || null,
          invite_type: addGuestForm.invite_type || "guest",
        }),
        credentials: "include"
      })
      const data = await res.json()
      if (!res.ok) {
        setAddGuestError(data.error || "Failed to add guest")
        return
      }
      setShowAddGuestModal(false)
      setAddGuestForm({ first_name: "", last_name: "", email: "", date_of_birth: "", gender: "", invite_type: "guest" })
      fetchApplications(currentEvent.id)
    } catch (err) {
      console.error(err)
      setAddGuestError("Error adding guest")
    } finally {
      setIsAddingGuest(false)
    }
  }

  // ── Edit Staff ───────────────────────────────────────────────────────────────
  const startEditStaff = (person: Application) => {
    setEditingStaffId(person.id)
    setStaffEditForm({
      first_name: person.first_name,
      last_name: person.last_name,
      date_of_birth: person.date_of_birth ?? "",
      email: person.email ?? "",
      role: person.role,
      role_note: person.role_note ?? "",
      gender: person.gender ?? "",
    })
    setStaffEditError("")
  }

  const handleEditStaffSave = async (id: string) => {
    if (!staffEditForm.first_name.trim() || !staffEditForm.last_name.trim()) {
      setStaffEditError("First name and last name are required")
      return
    }
    if (staffEditForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffEditForm.email.trim())) {
      setStaffEditError("Please enter a valid email address")
      return
    }
    setIsEditingStaff(true)
    setStaffEditError("")
    try {
      const res = await fetch("/api/edit-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          first_name: staffEditForm.first_name.trim(),
          last_name: staffEditForm.last_name.trim(),
          email: staffEditForm.email.trim(),
          role: staffEditForm.role,
          role_note: staffEditForm.role_note.trim() || null,
          gender: staffEditForm.gender || null,
        }),
        credentials: "include"
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setStaffEditError(data.error || "Failed to update staff member")
        return
      }
      setEditingStaffId(null)
      fetchApplications(currentEvent?.id)
    } catch (err) {
      console.error(err)
      setStaffEditError("Error updating staff member")
    } finally {
      setIsEditingStaff(false)
    }
  }

  // ── Export to Excel ──────────────────────────────────────────────────────────
  const handleExport = () => {
    const eventName = currentEvent?.name ?? "export"
    const eventDate = currentEvent?.date ? new Date(currentEvent.date.slice(0, 10) + "T12:00:00").toLocaleDateString() : ""

    const guests = applications.filter(a => !a.role || a.role === "guest")
    const staff  = applications.filter(a => a.role && a.role !== "guest")

    const guestRows = guests.map(a => ({
      "First Name":    a.first_name,
      "Last Name":     a.last_name,
      "Email":         a.email,
      "Gender":        a.gender ?? "",
      "Age":           calculateAge(a.date_of_birth),
      "Status":        a.status,
      "Checked In":    a.checked_in ? "Yes" : "No",
      "Checked In At": a.checked_in_at ? new Date(a.checked_in_at).toLocaleString() : "",
      "Invite Type":   a.invite_type ?? "",
      "Created At":    new Date(a.created_at).toLocaleString(),
    }))

    const staffRows = staff.map(a => ({
      "First Name":    a.first_name,
      "Last Name":     a.last_name,
      "Email":         a.email,
      "Role":          ROLE_LABEL[a.role] ?? a.role,
      "Note":          a.role_note ?? "",
      "Status":        a.status,
      "Checked In":    a.checked_in ? "Yes" : "No",
      "Checked In At": a.checked_in_at ? new Date(a.checked_in_at).toLocaleString() : "",
      "Created At":    new Date(a.created_at).toLocaleString(),
    }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(guestRows), "Guests")
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(staffRows), "Staff")

    const fileName = `guestlist_${eventName.replace(/\s+/g, "_")}_${eventDate.replace(/\//g, "-")}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const guestApplications = applications.filter(a => !a.role || a.role === "guest")
  const staffApplications  = applications.filter(a => a.role && a.role !== "guest")

  const allAges = guestApplications.map(a => calculateAge(a.date_of_birth)).filter(a => !isNaN(a) && a > 0 && a < 120)
  const dataAgeMin = allAges.length > 0 ? Math.min(...allAges) : 14
  const dataAgeMax = allAges.length > 0 ? Math.max(...allAges) : 60

  const activeFilterCount =
    filterStatuses.length +
    filterGenders.length +
    filterAdmins.length +
    (filterCheckedIn !== "all" ? 1 : 0) +
    (filterAgeMin !== dataAgeMin || filterAgeMax !== dataAgeMax ? 1 : 0)

  const resetFilters = () => {
    setFilterStatuses([])
    setFilterGenders([])
    setFilterAdmins([])
    setFilterCheckedIn("all")
    setFilterAgeMin(dataAgeMin)
    setFilterAgeMax(dataAgeMax)
  }

  const toggleStatus = (s: string) =>
    setFilterStatuses(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const toggleGender = (g: string) =>
    setFilterGenders(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g])

  const toggleAdmin = (id: string) =>
    setFilterAdmins(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const filteredGuests = guestApplications.filter((app) => {
    const q = searchTerm.toLowerCase()
    const matchesSearch =
      app.first_name.toLowerCase().includes(q) ||
      app.last_name.toLowerCase().includes(q) ||
      app.email.toLowerCase().includes(q) ||
      (app.instagram ?? "").toLowerCase().includes(q)
    const matchesStatus = filterStatuses.length === 0 || filterStatuses.includes(app.status)
    const matchesGender = filterGenders.length === 0 || filterGenders.includes(app.gender ?? "")
    const age = calculateAge(app.date_of_birth)
    const matchesAge = age >= filterAgeMin && age <= filterAgeMax
    const matchesCheckedIn =
      filterCheckedIn === "all" ||
      (filterCheckedIn === "yes" && !!app.checked_in) ||
      (filterCheckedIn === "no" && !app.checked_in)
    const appAdminId = app.added_by_admin?.id ?? app.invite_code_admin?.id ?? ""
    const matchesAdmin = filterAdmins.length === 0 || filterAdmins.includes(appAdminId)
    return matchesSearch && matchesStatus && matchesGender && matchesAge && matchesCheckedIn && matchesAdmin
  })

  const filteredStaff = staffApplications.filter((app) => {
    const q = staffSearchTerm.toLowerCase()
    const matchesSearch =
      app.first_name.toLowerCase().includes(q) ||
      app.last_name.toLowerCase().includes(q) ||
      (app.email ?? "").toLowerCase().includes(q) ||
      (app.role_note ?? "").toLowerCase().includes(q)
    const matchesRole = staffRoleFilter === "all" || app.role === staffRoleFilter
    return matchesSearch && matchesRole
  })

  const staffCheckedIn = staffApplications.filter(a => a.checked_in).length

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":  return "bg-emerald-400/10 text-emerald-400 border-emerald-400/30"
      case "rejected":  return "bg-red-400/10 text-red-400 border-red-400/30"
      case "waitlist":  return "bg-yellow-400/10 text-yellow-400 border-yellow-400/30"
      case "cancelled": return "bg-neutral-800 text-neutral-500 border-neutral-700"
      case "applied":   return "bg-cyan-400/10 text-cyan-400 border-cyan-400/30"
      default:          return "bg-neutral-800 text-neutral-400 border-neutral-700"
    }
  }

  const getInviteTypeBadge = (type: string | null) => {
    if (!type) return null
    switch (type) {
      case "vip":        return { label: "💎 VIP",        cls: "text-purple-400 border-purple-400/30 bg-purple-400/10" }
      case "friend":     return { label: "🤝 Friend",     cls: "text-orange-400 border-orange-400/30 bg-orange-400/10" }
      case "friendlist": return { label: "⭐ Friendlist",  cls: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10" }
      case "guestlist":  return { label: "📋 Guestlist",  cls: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10" }
      case "instagram":  return { label: "📸 Instagram",  cls: "text-pink-400 border-pink-400/30 bg-pink-400/10" }
      case "whatsapp":   return { label: "💬 WhatsApp",   cls: "text-green-400 border-green-400/30 bg-green-400/10" }
      default:           return { label: type,             cls: "text-neutral-400 border-neutral-700 bg-neutral-800" }
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
          <p className="text-lg tracking-[0.2em] uppercase text-neutral-400 animate-pulse">Loading applications</p>
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

      <div className="relative z-10">
        <div className="px-6 md:px-16 py-12">

          {/* Header */}
          <div className="mb-10 space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl font-light tracking-tight">
                  <span className="bg-gradient-to-b from-white via-white to-neutral-500 bg-clip-text text-transparent">
                    Applications
                  </span>
                </h1>
                <p className="text-neutral-400 text-sm tracking-[0.2em] uppercase font-light">
                  {currentEvent?.name} — {currentEvent?.date ? new Date(currentEvent.date.slice(0, 10) + "T12:00:00").toLocaleDateString() : ""}
                </p>
                <div className="h-px bg-gradient-to-r from-white/40 to-transparent w-20" />
              </div>

              {/* Export button */}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 text-xs tracking-[0.15em] uppercase text-neutral-300 border border-neutral-700 hover:border-neutral-400 hover:text-white hover:bg-white/5 transition-all duration-200 self-start mt-1"
              >
                <Download size={13} />
                Export Excel
              </button>
            </div>
          </div>

          {/* Email Panel */}
          <div className="mb-8 border border-neutral-800 bg-neutral-900/30 rounded">
            <button
              onClick={() => setShowEmailPanel(v => !v)}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-neutral-900/50 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <Mail size={14} className="text-neutral-400" />
                <span className="text-xs tracking-[0.2em] uppercase text-neutral-300">Email Dispatch</span>
                {eventEmailState?.batch_email_sent && (
                  <span className="text-[10px] px-2 py-0.5 rounded border text-emerald-400 border-emerald-400/30 bg-emerald-400/10 tracking-[0.1em]">
                    Batch Sent
                  </span>
                )}
                {!eventEmailState?.batch_email_sent && eventEmailState?.scheduled_email_send_at && (
                  <span className="text-[10px] px-2 py-0.5 rounded border text-yellow-400 border-yellow-400/30 bg-yellow-400/10 tracking-[0.1em]">
                    Scheduled
                  </span>
                )}
              </div>
              <span className="text-neutral-600 text-xs">{showEmailPanel ? "▲" : "▼"}</span>
            </button>

            {showEmailPanel && (
              <div className="px-5 pb-5 border-t border-neutral-800 space-y-5">
                <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(() => {
                    const pending = guestApplications.filter(a => (a.status === "approved" || a.status === "rejected") && !a.email_sent_at).length
                    const sent    = guestApplications.filter(a => a.email_sent_at).length
                    const approved = guestApplications.filter(a => a.status === "approved").length
                    const rejected = guestApplications.filter(a => a.status === "rejected").length
                    return (
                      <>
                        <div className="border border-neutral-800 p-3">
                          <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-600 mb-1">Emails Sent</p>
                          <p className="text-xl font-light text-emerald-400">{sent}</p>
                        </div>
                        <div className="border border-neutral-800 p-3">
                          <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-600 mb-1">Pending Send</p>
                          <p className="text-xl font-light text-yellow-400">{pending}</p>
                        </div>
                        <div className="border border-neutral-800 p-3">
                          <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-600 mb-1">Approved</p>
                          <p className="text-xl font-light text-white">{approved}</p>
                        </div>
                        <div className="border border-neutral-800 p-3">
                          <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-600 mb-1">Rejected</p>
                          <p className="text-xl font-light text-white">{rejected}</p>
                        </div>
                      </>
                    )
                  })()}
                </div>

                {sendResult && (
                  <div className={`p-3 border text-xs tracking-[0.1em] ${sendResult.failed > 0 ? "border-yellow-400/30 bg-yellow-400/5 text-yellow-300" : "border-emerald-400/30 bg-emerald-400/5 text-emerald-300"}`}>
                    {sendResult.sent} email{sendResult.sent !== 1 ? "s" : ""} sent
                    {sendResult.failed > 0 && ` — ${sendResult.failed} failed`}
                    {sendResult.errors.length > 0 && (
                      <ul className="mt-1 text-red-400 list-disc list-inside space-y-0.5">
                        {sendResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-3">
                    <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-500">Send Now</p>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Send emails immediately to all approved and rejected guests who have not yet received one.
                      {eventEmailState?.batch_email_sent && " Batch already sent — new approvals/rejections will be emailed instantly."}
                    </p>
                    <button
                      onClick={handleSendEmails}
                      disabled={isSendingEmails}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs tracking-[0.15em] uppercase text-white border border-white/20 hover:border-white/60 hover:bg-white/5 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isSendingEmails ? <><span className="animate-spin">⟳</span> Sending...</> : <><Send size={12} /> Send Emails</>}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-500">Schedule Auto-Send</p>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Set a date and time for emails to be sent automatically. Checked when the dashboard is opened.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="flex-1 bg-transparent border-b border-neutral-700 py-2 text-white text-xs focus:outline-none focus:border-neutral-500 [color-scheme:dark]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveSchedule}
                        disabled={isSavingSchedule || !scheduledAt}
                        className="flex items-center gap-2 px-4 py-2 text-xs tracking-[0.15em] uppercase text-emerald-400 border border-emerald-400/30 hover:border-emerald-400 hover:bg-emerald-400/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Clock size={12} /> Save Schedule
                      </button>
                      {eventEmailState?.scheduled_email_send_at && (
                        <button
                          onClick={handleClearSchedule}
                          disabled={isSavingSchedule}
                          className="px-3 py-2 text-xs tracking-[0.1em] uppercase text-neutral-500 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-300 transition-all"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {eventEmailState?.scheduled_email_send_at && (
                      <p className="text-[10px] text-neutral-600 tracking-[0.1em]">
                        Scheduled: {new Date(eventEmailState.scheduled_email_send_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-8 text-sm tracking-[0.15em] py-3 px-4 border border-red-400/30 text-red-400 bg-red-400/5 rounded">
              {error}
            </div>
          )}

          {/* ── Tabs ─────────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-0 mb-8 border-b border-neutral-800">
            <button
              onClick={() => setActiveTab("guests")}
              className={`px-6 py-3 text-xs tracking-[0.2em] uppercase transition-all duration-200 border-b-2 -mb-px ${
                activeTab === "guests"
                  ? "border-white text-white"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Guests
              <span className="ml-2 text-[10px] text-neutral-600">{guestApplications.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`px-6 py-3 text-xs tracking-[0.2em] uppercase transition-all duration-200 border-b-2 -mb-px ${
                activeTab === "staff"
                  ? "border-white text-white"
                  : "border-transparent text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Staff
              <span className="ml-2 text-[10px] text-neutral-600">{staffApplications.length}</span>
            </button>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              GUESTS TAB
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "guests" && (
            <>
              {/* Controls */}
              <div className="mb-8 space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search by name, email, instagram..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 bg-transparent border-b border-neutral-800 px-0 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-all duration-300 text-sm"
                  />
                  <button
                    onClick={() => setShowFilterPanel(v => !v)}
                    title="Filters"
                    className={`relative flex items-center gap-2 px-3 py-2 border rounded transition-all duration-200 text-xs tracking-[0.15em] uppercase ${
                      showFilterPanel || activeFilterCount > 0
                        ? "border-white/40 text-white bg-white/5"
                        : "border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-white"
                    }`}
                  >
                    <SlidersHorizontal size={13} />
                    Filter
                    {activeFilterCount > 0 && (
                      <span className="flex items-center justify-center w-4 h-4 text-[9px] rounded-full bg-white text-black font-medium">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>

                {showFilterPanel && (
                  <div className="border border-neutral-800 bg-neutral-900/40 p-5 space-y-5 rounded">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      {/* Status */}
                      <div>
                        <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 mb-3">Status</p>
                        <div className="space-y-2">
                          {["applied","approved","rejected","waitlist","cancelled"].map(s => (
                            <label key={s} className="flex items-center gap-2 cursor-pointer group">
                              <div
                                onClick={() => toggleStatus(s)}
                                className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-all cursor-pointer ${
                                  filterStatuses.includes(s) ? "border-white bg-white" : "border-neutral-600 group-hover:border-neutral-400"
                                }`}
                              >
                                {filterStatuses.includes(s) && <Check size={9} className="text-black" />}
                              </div>
                              <span onClick={() => toggleStatus(s)} className="text-xs text-neutral-300 capitalize tracking-[0.1em] cursor-pointer">{s}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Gender */}
                      <div>
                        <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 mb-3">Gender</p>
                        <div className="space-y-2">
                          {[{ value: "male", label: "Male" }, { value: "female", label: "Female" }, { value: "diverse", label: "Diverse" }].map(({ value, label }) => (
                            <label key={value} className="flex items-center gap-2 cursor-pointer group">
                              <div
                                onClick={() => toggleGender(value)}
                                className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-all cursor-pointer ${
                                  filterGenders.includes(value) ? "border-white bg-white" : "border-neutral-600 group-hover:border-neutral-400"
                                }`}
                              >
                                {filterGenders.includes(value) && <Check size={9} className="text-black" />}
                              </div>
                              <span onClick={() => toggleGender(value)} className="text-xs text-neutral-300 tracking-[0.1em] cursor-pointer">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Check-in */}
                      <div>
                        <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 mb-3">Check-in</p>
                        <div className="space-y-2">
                          {([["all","All"],["yes","Checked in"],["no","Not checked in"]] as const).map(([val, lbl]) => (
                            <label key={val} className="flex items-center gap-2 cursor-pointer group">
                              <div
                                onClick={() => setFilterCheckedIn(val)}
                                className={`w-3.5 h-3.5 border rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                  filterCheckedIn === val ? "border-white bg-white" : "border-neutral-600 group-hover:border-neutral-400"
                                }`}
                              >
                                {filterCheckedIn === val && <div className="w-1.5 h-1.5 rounded-full bg-black" />}
                              </div>
                              <span onClick={() => setFilterCheckedIn(val)} className="text-xs text-neutral-300 tracking-[0.1em] cursor-pointer">{lbl}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Admin */}
                      {adminList.length > 0 && (
                        <div>
                          <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 mb-3">Admin</p>
                          <div className="space-y-2">
                            {adminList.map(a => (
                              <label key={a.id} className="flex items-center gap-2 cursor-pointer group">
                                <div
                                  onClick={() => toggleAdmin(a.id)}
                                  className={`w-3.5 h-3.5 border rounded-sm flex items-center justify-center transition-all cursor-pointer ${
                                    filterAdmins.includes(a.id) ? "border-white bg-white" : "border-neutral-600 group-hover:border-neutral-400"
                                  }`}
                                >
                                  {filterAdmins.includes(a.id) && <Check size={9} className="text-black" />}
                                </div>
                                <span onClick={() => toggleAdmin(a.id)} className="text-xs text-neutral-300 tracking-[0.1em] cursor-pointer">{a.username}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Age range slider */}
                    <div>
                      <p className="text-[10px] tracking-[0.25em] uppercase text-neutral-500 mb-3">
                        Age Range — <span className="text-white">{filterAgeMin} – {filterAgeMax}</span>
                      </p>
                      <div className="relative h-5 flex items-center">
                        <div className="absolute w-full h-px bg-neutral-700" />
                        <div
                          className="absolute h-px bg-white"
                          style={{
                            left:  `${((filterAgeMin - dataAgeMin) / Math.max(dataAgeMax - dataAgeMin, 1)) * 100}%`,
                            right: `${100 - ((filterAgeMax - dataAgeMin) / Math.max(dataAgeMax - dataAgeMin, 1)) * 100}%`,
                          }}
                        />
                        <input type="range" min={dataAgeMin} max={dataAgeMax} value={filterAgeMin}
                          onChange={e => { const v = Number(e.target.value); if (v <= filterAgeMax) setFilterAgeMin(v) }}
                          className="absolute w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-runnable-track]:bg-transparent"
                        />
                        <input type="range" min={dataAgeMin} max={dataAgeMax} value={filterAgeMax}
                          onChange={e => { const v = Number(e.target.value); if (v >= filterAgeMin) setFilterAgeMax(v) }}
                          className="absolute w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-runnable-track]:bg-transparent"
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-neutral-600">{dataAgeMin}</span>
                        <span className="text-[10px] text-neutral-600">{dataAgeMax}</span>
                      </div>
                    </div>

                    {activeFilterCount > 0 && (
                      <div className="flex justify-end pt-1 border-t border-neutral-800">
                        <button onClick={resetFilters} className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 hover:text-white transition-colors">
                          Clear all filters
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Toolbar */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => fetchApplications(currentEvent?.id)}
                    className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-600 transition-all duration-300 text-xs tracking-[0.2em] uppercase rounded"
                  >
                    Refresh
                  </button>
                  <div className="flex items-center border border-neutral-800 rounded overflow-hidden">
                    <button onClick={() => { setViewMode("overview"); setExpandedGuestId(null) }} className={`p-2 transition-all duration-200 ${viewMode === "overview" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"}`} title="Overview">
                      <LayoutList size={14} />
                    </button>
                    <button onClick={() => setViewMode("detailed")} className={`p-2 transition-all duration-200 ${viewMode === "detailed" ? "bg-neutral-800 text-white" : "text-neutral-500 hover:text-white"}`} title="Detailed">
                      <LayoutGrid size={14} />
                    </button>
                  </div>
                  <p className="text-xs tracking-[0.2em] uppercase text-neutral-600">
                    {filteredGuests.length} / {guestApplications.length} guests
                  </p>
                  <button
                    onClick={() => { setAddGuestError(""); setShowAddGuestModal(true) }}
                    className="ml-auto flex items-center gap-2 px-4 py-2 text-xs tracking-[0.15em] uppercase text-white border border-white/20 hover:border-white/60 hover:bg-white/5 transition-all duration-200"
                  >
                    <UserPlus size={13} />
                    Add Guest
                  </button>
                </div>
              </div>

              {/* Guest list */}
              <div className="space-y-1">
                {filteredGuests.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-neutral-500 text-sm tracking-[0.15em] uppercase">
                      {searchTerm || activeFilterCount > 0 ? "No applications match the current filters" : "No applications yet"}
                    </p>
                  </div>
                ) : (
                   filteredGuests.map((app) => {
                     const badge = getInviteTypeBadge(app.invite_type)
                     const isExpanded = viewMode === "detailed" || expandedGuestId === app.id
                     return (
                       <div
                         key={app.id}
                         className={`border transition-all duration-300 ${
                           app.age_flagged
                             ? "border-neutral-700/60 hover:border-neutral-600/60"
                             : "border-neutral-800 hover:border-neutral-700"
                         }`}
                       >
                         {/* Compact Row */}
                         <div
                           className={`px-4 py-3 cursor-pointer ${isExpanded ? "border-b border-neutral-800/50" : ""}`}
                           onClick={(e) => {
                             // Don't toggle if clicking a button/link inside the row
                             if ((e.target as HTMLElement).closest("button,a")) return
                             if (viewMode === "detailed") return
                             setExpandedGuestId(prev => prev === app.id ? null : app.id)
                           }}
                         >
                            <div className="flex items-center gap-3 flex-wrap">
                              {app.age_flagged && (
                                <span className="text-[10px] px-2 py-0.5 rounded border text-orange-400 border-orange-400/30 bg-orange-400/10">
                                  ⚠ Age
                                </span>
                              )}
                              {/* Avatar — placeholder icon, replace with real photo when available */}
                              <div className={`h-8 w-8 rounded-sm shrink-0 flex items-center justify-center overflow-hidden border
                                ${app.gender === "male" ? "bg-blue-950 border-blue-900" :
                                  app.gender === "female" ? "bg-pink-950 border-pink-900" :
                                  "bg-neutral-800 border-neutral-700"}`}>
                                <User size={18} className={
                                  app.gender === "male" ? "text-blue-400" :
                                  app.gender === "female" ? "text-pink-400" :
                                  "text-neutral-500"
                                } />
                              </div>
                              <span className="text-white font-light text-sm min-w-[140px]">{app.first_name} {app.last_name}</span>
                              <span className="text-neutral-500 text-xs w-8 text-center">{calculateAge(app.date_of_birth)}y</span>
                              <a href={`mailto:${app.email}`} className="text-neutral-400 hover:text-blue-400 text-xs transition-colors flex-1 min-w-[150px] truncate">{app.email}</a>
                              {badge && app.invite_type === "friendlist" && (
                                <span className={`text-[10px] px-2 py-0.5 rounded border tracking-[0.1em] font-mono ${badge.cls}`}>
                                  {badge.label}
                                </span>
                              )}
                              {/* Main status badge — without checked_in suffix */}
                              <span className={`text-[10px] px-2 py-0.5 rounded border tracking-[0.15em] uppercase font-light whitespace-nowrap ${getStatusBadge(app.status)}`}>
                                {app.status}
                              </span>
                              {/* Ticket sub-status badge — shown between status and icons */}
                              {app.email_sent_at && app.role === "guest" && (() => {
                                if (app.status === "cancelled") {
                                  return (
                                    <span className="text-[10px] px-2 py-0.5 rounded border tracking-[0.1em] font-mono text-neutral-400 border-neutral-700 bg-neutral-800/60" title="Guest cancelled their spot">
                                      Cancelled
                                    </span>
                                  )
                                }
                                if (app.ticket_generated_at) {
                                  return (
                                    <span className="text-[10px] px-2 py-0.5 rounded border tracking-[0.1em] font-mono text-emerald-400 border-emerald-400/30 bg-emerald-400/10" title={`Ticket generated ${new Date(app.ticket_generated_at).toLocaleString()}`}>
                                      Attending
                                    </span>
                                  )
                                }
                                if (app.status === "approved") {
                                  return (
                                    <span className="text-[10px] px-2 py-0.5 rounded border tracking-[0.1em] font-mono text-amber-400 border-amber-400/30 bg-amber-400/10" title="Email sent, guest hasn't generated their ticket yet">
                                      Pending
                                    </span>
                                  )
                                }
                                return null
                              })()}
                              {/* Check-in icon — separate, before mail icon */}
                              {app.checked_in && (
                                <span title={app.checked_in_at ? `Checked in at ${new Date(app.checked_in_at).toLocaleTimeString()}` : "Checked in"}>
                                  <CheckCheck size={13} className="text-emerald-400 shrink-0" />
                                </span>
                              )}
                               {/* Mail + source icons */}
                               <div className="flex items-center gap-1.5">
                                 {(app.status === "approved" || app.status === "rejected") && (
                                   <span title={app.email_sent_at ? `Email sent ${new Date(app.email_sent_at).toLocaleString()}` : "Email not sent yet"}>
                                     {app.email_sent_at
                                       ? <Mail size={13} className="text-emerald-500 shrink-0" />
                                       : <Mail size={13} className="text-neutral-700 shrink-0" />
                                     }
                                   </span>
                                 )}
                                 {app.added_by_admin
                                   ? <span title={`Manually added by ${app.added_by_admin.username}`}><UserPlus size={13} className="text-neutral-500 shrink-0" /></span>
                                   : app.invite_code_admin
                                     ? <span title={`Registered via code — ${app.invite_code_admin.username}`}><QrCode size={13} className="text-neutral-500 shrink-0" /></span>
                                     : null
                                 }
                               </div>
                             <span className="text-neutral-600 text-xs hidden md:block">{new Date(app.created_at).toLocaleDateString()}</span>
                             <div className="flex items-center gap-1 ml-auto">
                              <button onClick={() => editingId === app.id ? setEditingId(null) : startEdit(app)} title="Edit" className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-all">
                                <Pencil size={14} />
                              </button>
                              {app.status !== "cancelled" && app.status !== "rejected" && (
                                <button
                                  onClick={() => { if (confirm("Mark this guest as cancelled?")) updateStatus(app.id, "cancelled") }}
                                  title="Mark Cancelled"
                                  className="p-1.5 text-neutral-500 hover:text-orange-400 hover:bg-orange-400/10 rounded transition-all"
                                >
                                  <UserX size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Edit form */}
                        {editingId === app.id && (
                          <div className="px-4 py-3 bg-neutral-900/50 border-b border-neutral-800">
                            <p className="text-xs tracking-[0.2em] uppercase text-neutral-500 mb-3">Edit Application</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1 block">Email</label>
                                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                  className="w-full bg-transparent border-b border-neutral-700 py-2 text-white text-sm focus:outline-none focus:border-neutral-500" />
                              </div>
                              <div>
                                <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1 block">
                                  Status
                                  {app.checked_in && <span className="ml-2 text-[9px] text-yellow-500/70 tracking-[0.15em]">locked (checked in)</span>}
                                </label>
                                {app.checked_in ? (
                                  <div className="w-full border-b border-neutral-800 py-2 text-neutral-500 text-sm cursor-not-allowed">{editForm.status}</div>
                                ) : (
                                  <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                    className="w-full bg-neutral-900 border-b border-neutral-700 py-2 text-white text-sm focus:outline-none">
                                    <option value="applied"   className="bg-black">Applied</option>
                                    <option value="approved"  className="bg-black">Approved</option>
                                    <option value="rejected"  className="bg-black">Rejected</option>
                                    <option value="waitlist"  className="bg-black">Waitlist</option>
                                    <option value="cancelled" className="bg-black">Cancelled</option>
                                  </select>
                                )}
                              </div>
                              <div className="flex items-end gap-2">
                                <button onClick={() => handleEditSave(app.id)} className="flex items-center gap-1 px-3 py-2 text-xs tracking-[0.1em] uppercase text-emerald-400 border border-emerald-400/30 hover:border-emerald-400 hover:bg-emerald-400/5 transition-all rounded">
                                  <Check size={12} /> Save
                                </button>
                                <button onClick={() => setEditingId(null)} className="flex items-center gap-1 px-3 py-2 text-xs tracking-[0.1em] uppercase text-neutral-400 border border-neutral-700 hover:border-neutral-500 transition-all rounded">
                                  <X size={12} /> Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Detailed view */}
                         {isExpanded && (
                           <div className="px-4 py-4">
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                               <div>
                                 <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1">Instagram</p>
                                 {app.instagram ? (
                                   <a href={`https://instagram.com/${app.instagram.replace("@","")}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">{app.instagram}</a>
                                 ) : <p className="text-neutral-600 text-sm">—</p>}
                               </div>
                               <div>
                                 <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1">Heard via</p>
                                 <p className="text-neutral-300 text-sm capitalize">{app.heard_about_us?.replace("_"," ") || "—"}</p>
                               </div>
                               <div>
                                 <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1">Invited by</p>
                                 {(app.added_by_admin || app.invite_code_admin) ? (
                                   <div className="flex items-center gap-1.5">
                                     {app.added_by_admin
                                       ? <UserPlus size={11} className="text-neutral-500 shrink-0" />
                                       : <QrCode size={11} className="text-neutral-500 shrink-0" />
                                     }
                                     <p className="text-neutral-300 text-sm">
                                       {app.added_by_admin?.username ?? app.invite_code_admin?.username}
                                     </p>
                                   </div>
                                 ) : (
                                   <p className="text-neutral-600 text-sm">—</p>
                                 )}
                               </div>
                              {app.status === "approved" && (
                                <div>
                                  <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1">Check-in</p>
                                  {app.checked_in ? (
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="text-emerald-400 text-sm">{app.checked_in_at ? new Date(app.checked_in_at).toLocaleString() : "Checked in"}</p>
                                      {app.paid
                                        ? <span title="Payment confirmed" className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-emerald-400 border border-emerald-400/30 bg-emerald-400/5 px-2 py-0.5 rounded"><Receipt size={10} /> Paid</span>
                                        : <span title="Payment not recorded" className="flex items-center gap-1 text-[10px] tracking-[0.15em] uppercase text-red-400/70 border border-red-400/20 bg-red-400/5 px-2 py-0.5 rounded"><Receipt size={10} /> Unpaid</span>
                                      }
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <p className="text-neutral-500 text-sm">Not yet</p>
                                      <button onClick={() => handleManualCheckIn(app.id)} disabled={checkingInId === app.id} title="Manual Check-in"
                                        className="flex items-center gap-1 px-2 py-0.5 text-[10px] tracking-[0.1em] uppercase text-emerald-500 border border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/5 rounded transition-all disabled:opacity-40">
                                        <LogIn size={10} /> {checkingInId === app.id ? "…" : "Check in"}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                              {app.qr_token && (
                                <div>
                                  <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1">Ticket</p>
                                  <a href={`/ticket/${app.qr_token}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300">
                                    <QrCode size={12} /> View QR
                                  </a>
                                </div>
                              )}
                            </div>
                            {app.intro && <p className="text-neutral-500 text-sm italic mb-3">"{app.intro}"</p>}
                            <div className="pt-3 border-t border-neutral-800/50 flex items-center gap-3 flex-wrap">
                              {app.status === "applied" && (
                                <>
                                  <button onClick={() => updateStatus(app.id, "approve")} className="px-3 py-1.5 text-xs tracking-[0.15em] uppercase text-emerald-400 border border-emerald-400/30 hover:border-emerald-400 hover:bg-emerald-400/5 transition-all rounded">Approve</button>
                                  <button onClick={() => updateStatus(app.id, "waitlist")} className="px-3 py-1.5 text-xs tracking-[0.15em] uppercase text-yellow-400 border border-yellow-400/30 hover:border-yellow-400 hover:bg-yellow-400/5 transition-all rounded">Waitlist</button>
                                  <button onClick={() => updateStatus(app.id, "reject")} className="px-3 py-1.5 text-xs tracking-[0.15em] uppercase text-red-400 border border-red-400/30 hover:border-red-400 hover:bg-red-400/5 transition-all rounded">Reject</button>
                                </>
                              )}
                              {app.status === "approved" && (
                                <>
                                  <button onClick={() => handleResendEmail(app.id)} disabled={resendingEmailId === app.id}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs tracking-[0.15em] uppercase text-blue-400 border border-blue-400/30 hover:border-blue-400 hover:bg-blue-400/5 transition-all rounded disabled:opacity-40">
                                    <MailCheck size={11} /> {resendingEmailId === app.id ? "Sending…" : "Resend Email"}
                                  </button>
                                  {resendResult?.id === app.id && (
                                    <span className={`text-[10px] tracking-[0.1em] ${resendResult.success ? "text-emerald-400" : "text-red-400"}`}>{resendResult.message}</span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {viewMode === "overview" && !isExpanded && app.status === "applied" && (
                          <div className="px-4 py-2 border-t border-neutral-800/30 flex gap-2">
                            <button onClick={() => updateStatus(app.id, "approve")} className="px-3 py-1 text-[10px] tracking-[0.1em] uppercase text-emerald-400 border border-emerald-400/30 hover:border-emerald-400 hover:bg-emerald-400/5 transition-all rounded">Approve</button>
                            <button onClick={() => updateStatus(app.id, "waitlist")} className="px-3 py-1 text-[10px] tracking-[0.1em] uppercase text-yellow-400 border border-yellow-400/30 hover:border-yellow-400 hover:bg-yellow-400/5 transition-all rounded">Waitlist</button>
                            <button onClick={() => updateStatus(app.id, "reject")} className="px-3 py-1 text-[10px] tracking-[0.1em] uppercase text-red-400 border border-red-400/30 hover:border-red-400 hover:bg-red-400/5 transition-all rounded">Reject</button>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STAFF TAB
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === "staff" && (
            <>
              {/* Staff header bar */}
              <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <p className="text-xs tracking-[0.2em] uppercase text-neutral-500">
                    {staffApplications.length} total
                    <span className="mx-2 text-neutral-700">·</span>
                    <span className="text-emerald-400">{staffCheckedIn} checked in</span>
                  </p>
                </div>
                <button
                  onClick={() => { setAddStaffError(""); setShowAddStaffModal(true) }}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs tracking-[0.15em] uppercase text-white border border-white/20 hover:border-white/60 hover:bg-white/5 transition-all duration-200"
                >
                  <UserPlus size={13} />
                  Add Staff
                </button>
              </div>

              {/* Staff filters */}
              <div className="mb-6 flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder="Search staff..."
                  value={staffSearchTerm}
                  onChange={(e) => setStaffSearchTerm(e.target.value)}
                  className="flex-1 min-w-[200px] bg-transparent border-b border-neutral-800 px-0 py-2.5 text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-all text-sm"
                />
                <div className="flex items-center gap-1 flex-wrap">
                  {[{ value: "all", label: "All" }, ...STAFF_ROLES].map(r => (
                    <button
                      key={r.value}
                      onClick={() => setStaffRoleFilter(r.value)}
                      className={`px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase border rounded transition-all duration-200 ${
                        staffRoleFilter === r.value
                          ? "border-white/40 text-white bg-white/5"
                          : "border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Staff list */}
              <div className="space-y-1">
                {filteredStaff.length === 0 ? (
                  <div className="text-center py-16 space-y-3">
                    <p className="text-neutral-500 text-sm tracking-[0.15em] uppercase">
                      {staffApplications.length === 0 ? "No staff added yet" : "No staff match the current filter"}
                    </p>
                    {staffApplications.length === 0 && (
                      <button
                        onClick={() => { setAddStaffError(""); setShowAddStaffModal(true) }}
                        className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 hover:text-white transition-colors border border-neutral-800 hover:border-neutral-600 px-4 py-2"
                      >
                        Add first staff member
                      </button>
                    )}
                  </div>
                ) : (
                  filteredStaff.map((person) => (
                    <div key={person.id} className="border border-neutral-800 hover:border-neutral-700 transition-all duration-200">
                      <div className="px-4 py-3 flex items-center gap-3 flex-wrap">
                        {/* Name */}
                        <span className="text-white font-light text-sm min-w-[140px]">
                          {person.first_name} {person.last_name}
                        </span>

                        {/* Email */}
                        {person.email ? (
                          <a href={`mailto:${person.email}`} className="text-neutral-500 hover:text-blue-400 text-xs transition-colors truncate max-w-[180px]">
                            {person.email}
                          </a>
                        ) : (
                          <span className="text-neutral-700 text-xs">—</span>
                        )}

                        {/* Note */}
                        {person.role_note && (
                          <span className="text-neutral-500 text-xs italic truncate max-w-[200px]" title={person.role_note}>
                            {person.role_note}
                          </span>
                        )}

                        {/* Check-in + edit */}
                        <div className="ml-auto flex items-center gap-2">
                          {/* Role badge */}
                          <span className={`text-[10px] px-2 py-0.5 border rounded tracking-[0.12em] uppercase font-mono shrink-0 ${ROLE_BADGE[person.role] ?? "text-neutral-400 border-neutral-700 bg-neutral-800"}`}>
                            {ROLE_LABEL[person.role] ?? person.role}
                          </span>

                          {/* +1 code badge */}
                          {staffPlusOneCodes[person.id] !== undefined && (
                            staffPlusOneCodes[person.id] ? (
                              <span
                                className="group relative flex items-center gap-1 text-[10px] px-2 py-0.5 border rounded tracking-[0.12em] uppercase font-mono text-purple-400 border-purple-400/40 bg-purple-400/10 cursor-default"
                                title={`+1 code: ${staffPlusOneCodes[person.id]}`}
                              >
                                +1 {staffPlusOneCodes[person.id]}
                                <button
                                  onClick={() => handleRevokePlusOne(person.id)}
                                  disabled={revokingPlusOneId === person.id}
                                  title="Revoke +1 code"
                                  className="ml-1 text-purple-600 hover:text-red-400 transition-colors disabled:opacity-40"
                                >
                                  ×
                                </button>
                              </span>
                            ) : (
                              <span className="text-[10px] text-neutral-700 tracking-[0.1em] uppercase font-mono">no +1</span>
                            )
                          )}
                          {person.checked_in ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 tracking-[0.1em] uppercase">
                              <CheckCheck size={12} />
                              {person.checked_in_at ? new Date(person.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "In"}
                            </span>
                          ) : (
                            <button
                              onClick={() => handleManualCheckIn(person.id)}
                              disabled={checkingInId === person.id}
                              className="flex items-center gap-1 px-2.5 py-1 text-[10px] tracking-[0.1em] uppercase text-emerald-500 border border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/5 rounded transition-all disabled:opacity-40"
                            >
                              <LogIn size={10} /> {checkingInId === person.id ? "…" : "Check in"}
                            </button>
                          )}

                          {/* QR ticket link */}
                          {person.qr_token && (
                            <a href={`/ticket/${person.qr_token}`} target="_blank" rel="noopener noreferrer"
                              title="View QR ticket"
                              className="p-1.5 text-neutral-600 hover:text-emerald-400 transition-colors">
                              <QrCode size={13} />
                            </a>
                          )}

                          {/* Resend email */}
                          {person.status === "approved" && (
                            <>
                              <button
                                onClick={() => handleResendEmail(person.id)}
                                disabled={resendingEmailId === person.id}
                                title={person.email_sent_at ? "Email sent — click to resend" : "Send approval email"}
                                className={`p-1.5 rounded transition-all disabled:opacity-40 ${
                                  resendingEmailId === person.id
                                    ? "text-neutral-500"
                                    : person.email_sent_at
                                    ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                                    : "text-neutral-500 hover:text-sky-400 hover:bg-sky-400/10"
                                }`}
                              >
                                {resendingEmailId === person.id
                                  ? <Clock size={13} />
                                  : person.email_sent_at
                                  ? <MailCheck size={13} />
                                  : <Mail size={13} />}
                              </button>
                              {resendResult?.id === person.id && (
                                <span className={`text-[10px] tracking-[0.1em] ${resendResult.success ? "text-emerald-400" : "text-red-400"}`}>
                                  {resendResult.message}
                                </span>
                              )}
                            </>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => editingStaffId === person.id ? setEditingStaffId(null) : startEditStaff(person)}
                            title="Edit"
                            className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded transition-all"
                          >
                            <Pencil size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Staff inline edit form */}
                      {editingStaffId === person.id && (
                        <div className="px-4 py-4 bg-neutral-900/50 border-t border-neutral-800 space-y-4">
                          <p className="text-[10px] tracking-[0.2em] uppercase text-neutral-500">Edit Staff Member</p>

                          {/* Name row */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1 block">First Name</label>
                              <input type="text" value={staffEditForm.first_name}
                                onChange={e => setStaffEditForm(f => ({ ...f, first_name: e.target.value }))}
                                className="w-full bg-transparent border-b border-neutral-700 py-1.5 text-white text-sm focus:outline-none focus:border-neutral-500" />
                            </div>
                            <div>
                              <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1 block">Last Name</label>
                              <input type="text" value={staffEditForm.last_name}
                                onChange={e => setStaffEditForm(f => ({ ...f, last_name: e.target.value }))}
                                className="w-full bg-transparent border-b border-neutral-700 py-1.5 text-white text-sm focus:outline-none focus:border-neutral-500" />
                            </div>
                          </div>

                          {/* Email */}
                          <div>
                            <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1 block">Email</label>
                            <input type="email" value={staffEditForm.email}
                              onChange={e => setStaffEditForm(f => ({ ...f, email: e.target.value }))}
                              className="w-full bg-transparent border-b border-neutral-700 py-1.5 text-white text-sm focus:outline-none focus:border-neutral-500" />
                          </div>

                          {/* Role */}
                          <div>
                            <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1.5 block">Role</label>
                            <div className="flex flex-wrap gap-2">
                              {STAFF_ROLES.map(r => (
                                <button key={r.value} type="button"
                                  onClick={() => setStaffEditForm(f => ({ ...f, role: r.value }))}
                                  className={`px-3 py-1 text-[10px] tracking-[0.15em] uppercase border rounded transition-all duration-150 ${
                                    staffEditForm.role === r.value
                                      ? `${ROLE_BADGE[r.value]} border-opacity-60`
                                      : "border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300"
                                  }`}
                                >
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Note */}
                          <div>
                            <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1 block">Note</label>
                            <input type="text" value={staffEditForm.role_note}
                              onChange={e => setStaffEditForm(f => ({ ...f, role_note: e.target.value }))}
                              placeholder="e.g. playing 02:00–04:00"
                              className="w-full bg-transparent border-b border-neutral-700 py-1.5 text-white text-sm placeholder-neutral-700 focus:outline-none focus:border-neutral-500" />
                          </div>

                          {/* Gender */}
                          <div>
                            <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-600 mb-1 block">Gender</label>
                            <select
                              value={staffEditForm.gender}
                              onChange={e => setStaffEditForm(f => ({ ...f, gender: e.target.value }))}
                              className="w-full bg-neutral-900 border-b border-neutral-700 py-1.5 text-white text-sm focus:outline-none focus:border-neutral-500"
                            >
                              <option value="" className="bg-black">— select —</option>
                              <option value="male" className="bg-black">Male</option>
                              <option value="female" className="bg-black">Female</option>
                              <option value="diverse" className="bg-black">Diverse</option>
                            </select>
                          </div>

                          {staffEditError && (
                            <p className="text-xs text-red-400 tracking-[0.1em]">{staffEditError}</p>
                          )}

                          <div className="flex items-center gap-2 pt-1">
                            <button onClick={() => handleEditStaffSave(person.id)} disabled={isEditingStaff}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs tracking-[0.1em] uppercase text-emerald-400 border border-emerald-400/30 hover:border-emerald-400 hover:bg-emerald-400/5 transition-all rounded disabled:opacity-40">
                              <Check size={12} /> {isEditingStaff ? "Saving…" : "Save"}
                            </button>
                            <button onClick={() => setEditingStaffId(null)}
                              className="flex items-center gap-1.5 px-3 py-2 text-xs tracking-[0.1em] uppercase text-neutral-400 border border-neutral-700 hover:border-neutral-500 transition-all rounded">
                              <X size={12} /> Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-between items-center px-6 md:px-16 py-12 border-t border-neutral-800">
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">Applications</div>
          <div className="text-[10px] tracking-[0.3em] uppercase text-neutral-700 font-light">© 2026</div>
        </div>
      </div>

      {/* ── Add Guest Modal ───────────────────────────────────────────────────── */}
      {showAddGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddGuestModal(false)} />
          <div className="relative z-10 w-full max-w-md bg-neutral-950 border border-neutral-800 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm tracking-[0.2em] uppercase text-white font-light">Add Guest</h2>
                <p className="text-[10px] tracking-[0.15em] uppercase text-neutral-600 mt-0.5">Manually add an approved guest</p>
              </div>
              <button onClick={() => setShowAddGuestModal(false)} className="p-1.5 text-neutral-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="h-px bg-neutral-800" />

            <div className="space-y-4">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-1.5 block">First Name *</label>
                  <input
                    type="text"
                    value={addGuestForm.first_name}
                    onChange={e => setAddGuestForm(f => ({ ...f, first_name: e.target.value }))}
                    placeholder="Max"
                    className="w-full bg-transparent border-b border-neutral-700 py-2 text-white text-sm placeholder-neutral-700 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-1.5 block">Last Name *</label>
                  <input
                    type="text"
                    value={addGuestForm.last_name}
                    onChange={e => setAddGuestForm(f => ({ ...f, last_name: e.target.value }))}
                    placeholder="Mustermann"
                    className="w-full bg-transparent border-b border-neutral-700 py-2 text-white text-sm placeholder-neutral-700 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>
              </div>

              {/* DOB */}
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-1.5 block">Date of Birth *</label>
                <input
                  type="date"
                  value={addGuestForm.date_of_birth}
                  onChange={e => setAddGuestForm(f => ({ ...f, date_of_birth: e.target.value }))}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full bg-transparent border-b border-neutral-700 py-2 text-white text-sm focus:outline-none focus:border-neutral-500 transition-colors [color-scheme:dark]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-1.5 block">Email *</label>
                <input
                  type="email"
                  value={addGuestForm.email}
                  onChange={e => setAddGuestForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="max@example.com"
                  className="w-full bg-transparent border-b border-neutral-700 py-2 text-white text-sm placeholder-neutral-700 focus:outline-none focus:border-neutral-500 transition-colors"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-1.5 block">Gender *</label>
                <select
                  value={addGuestForm.gender}
                  onChange={e => setAddGuestForm(f => ({ ...f, gender: e.target.value }))}
                  className="w-full bg-neutral-900 border-b border-neutral-700 py-2 text-white text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                >
                  <option value="" className="bg-black">— select —</option>
                  <option value="male" className="bg-black">Male</option>
                  <option value="female" className="bg-black">Female</option>
                  <option value="diverse" className="bg-black">Diverse</option>
                </select>
              </div>

              {/* Invite type */}
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-1.5 block">Invite Type</label>
                <div className="flex gap-2 pt-1">
                  {[{ value: "guest", label: "Guest" }, { value: "friendlist", label: "Friendlist" }].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setAddGuestForm(f => ({ ...f, invite_type: opt.value }))}
                      className={`px-4 py-1.5 text-[10px] tracking-[0.15em] uppercase border rounded transition-all duration-150 ${
                        addGuestForm.invite_type === opt.value
                          ? "border-white/40 text-white bg-white/5"
                          : "border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {addGuestError && (
              <p className="text-xs text-red-400 tracking-[0.1em]">{addGuestError}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleAddGuest}
                disabled={isAddingGuest}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs tracking-[0.2em] uppercase text-white border border-white/20 hover:border-white/60 hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isAddingGuest ? <><span className="animate-spin">⟳</span> Adding...</> : <><UserPlus size={12} /> Add Guest</>}
              </button>
              <button
                onClick={() => setShowAddGuestModal(false)}
                className="px-4 py-2.5 text-xs tracking-[0.2em] uppercase text-neutral-500 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Staff Modal ───────────────────────────────────────────────────── */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddStaffModal(false)} />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md bg-neutral-950 border border-neutral-800 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm tracking-[0.2em] uppercase text-white font-light">Add Staff</h2>
                <p className="text-[10px] tracking-[0.15em] uppercase text-neutral-600 mt-0.5">Staff, DJ, Security, etc.</p>
              </div>
              <button onClick={() => setShowAddStaffModal(false)} className="p-1.5 text-neutral-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="h-px bg-neutral-800" />

            <div className="space-y-4">
              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-1.5 block">First Name *</label>
                  <input
                    type="text"
                    value={addStaffForm.first_name}
                    onChange={e => setAddStaffForm(f => ({ ...f, first_name: e.target.value }))}
                    placeholder="Max"
                    className="w-full bg-transparent border-b border-neutral-700 py-2 text-white text-sm placeholder-neutral-700 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-1.5 block">Last Name *</label>
                  <input
                    type="text"
                    value={addStaffForm.last_name}
                    onChange={e => setAddStaffForm(f => ({ ...f, last_name: e.target.value }))}
                    placeholder="Mustermann"
                    className="w-full bg-transparent border-b border-neutral-700 py-2 text-white text-sm placeholder-neutral-700 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>
              </div>

              {/* DOB */}
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-1.5 block">Date of Birth *</label>
                <input
                  type="date"
                  value={addStaffForm.date_of_birth}
                  onChange={e => setAddStaffForm(f => ({ ...f, date_of_birth: e.target.value }))}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full bg-transparent border-b border-neutral-700 py-2 text-white text-sm focus:outline-none focus:border-neutral-500 transition-colors [color-scheme:dark]"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-1.5 block">Email *</label>
                <input
                  type="email"
                  value={addStaffForm.email}
                  onChange={e => setAddStaffForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="max@example.com"
                  className="w-full bg-transparent border-b border-neutral-700 py-2 text-white text-sm placeholder-neutral-700 focus:outline-none focus:border-neutral-500 transition-colors"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-1.5 block">Gender *</label>
                <select
                  value={addStaffForm.gender}
                  onChange={e => setAddStaffForm(f => ({ ...f, gender: e.target.value }))}
                  className="w-full bg-neutral-900 border-b border-neutral-700 py-2 text-white text-sm focus:outline-none focus:border-neutral-500 transition-colors"
                >
                  <option value="" className="bg-black">— select —</option>
                  <option value="male" className="bg-black">Male</option>
                  <option value="female" className="bg-black">Female</option>
                  <option value="diverse" className="bg-black">Diverse</option>
                </select>
              </div>

              {/* Role */}
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-1.5 block">Role *</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {STAFF_ROLES.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setAddStaffForm(f => ({ ...f, role: r.value }))}
                      className={`px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase border rounded transition-all duration-150 ${
                        addStaffForm.role === r.value
                          ? `${ROLE_BADGE[r.value]} border-opacity-60`
                          : "border-neutral-800 text-neutral-500 hover:border-neutral-600 hover:text-neutral-300"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-[10px] tracking-[0.2em] uppercase text-neutral-500 mb-1.5 block">Note <span className="text-neutral-700">(optional)</span></label>
                <input
                  type="text"
                  value={addStaffForm.role_note}
                  onChange={e => setAddStaffForm(f => ({ ...f, role_note: e.target.value }))}
                  placeholder="e.g. playing 02:00–04:00, door only..."
                  className="w-full bg-transparent border-b border-neutral-700 py-2 text-white text-sm placeholder-neutral-700 focus:outline-none focus:border-neutral-500 transition-colors"
                />
              </div>
            </div>

            {addStaffError && (
              <p className="text-xs text-red-400 tracking-[0.1em]">{addStaffError}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleAddStaff}
                disabled={isAddingStaff}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-xs tracking-[0.2em] uppercase text-white border border-white/20 hover:border-white/60 hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isAddingStaff ? <><span className="animate-spin">⟳</span> Adding...</> : <><UserPlus size={12} /> Add</>}
              </button>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="px-4 py-2.5 text-xs tracking-[0.2em] uppercase text-neutral-500 border border-neutral-800 hover:border-neutral-600 hover:text-neutral-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
